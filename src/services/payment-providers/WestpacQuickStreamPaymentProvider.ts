import { SubmissionEventTypes } from '@oneblink/types'
import {
  BasePaymentConfigurationPayload,
  PaymentProvider,
} from '../../types/payments'
import { FormSubmissionResult } from '../../types/submissions'
import replaceInjectablesWithSubmissionValues from '../replaceInjectablesWithSubmissionValues'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import {
  generateAmountReceiptItem,
  generateCreditCardMaskReceiptItem,
  generateSubmissionIdReceiptItem,
  prepareReceiptItems,
} from './receipt-items'
import {
  completeWestpacQuickStreamTransaction,
  getCustomFormPaymentConfiguration,
} from '../api/payment'
import { deleteRequest } from '../fetch'
import Sentry from '../../Sentry'
import { HTTPError } from '../fetch'
import { isOffline } from '../../offline-service'

export default class WestpacQuickStreamPaymentProvider
  implements
    PaymentProvider<SubmissionEventTypes.WestpacQuickStreamSubmissionEvent>
{
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent,
    formSubmissionResult: FormSubmissionResult,
  ) {
    this.formSubmissionResult = formSubmissionResult
    this.paymentSubmissionEvent = paymentSubmissionEvent
  }

  formSubmissionResult: FormSubmissionResult
  paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent

  preparePaymentConfiguration(payload: BasePaymentConfigurationPayload) {
    if (!payload.submissionId) {
      throw new Error(
        'Westpac QuickStream Payments require the "submissionId" option.',
      )
    }
    if (!payload.paymentFormUrl) {
      throw new Error(
        'Westpac QuickStream Payments require the "paymentFormUrl" option.',
      )
    }
    return {
      path: `/forms/${this.formSubmissionResult.definition.id}/westpac-quick-stream-payment`,
      payload,
    }
  }

  async verifyPaymentTransaction(query: Record<string, unknown>) {
    const {
      paymentReferenceNumber,
      receiptNumber,
      maskedCardNumber4Digits,
      summaryCode,
      responseDescription,
      totalAmount,
    } = query as {
      paymentReferenceNumber?: string
      receiptNumber?: string
      maskedCardNumber4Digits?: string
      summaryCode?: string
      responseDescription?: string
      totalAmount?: string
    }
    if (
      !paymentReferenceNumber ||
      !receiptNumber ||
      !summaryCode ||
      !responseDescription ||
      !totalAmount
    ) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }
    if (this.formSubmissionResult.submissionId !== paymentReferenceNumber) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }

    return {
      receiptItems: prepareReceiptItems([
        generateSubmissionIdReceiptItem(this.formSubmissionResult.submissionId),
        {
          className: 'ob-payment-receipt__transaction-id',
          valueClassName: 'cypress-payment-receipt-transaction-id',
          icon: 'shopping_cart',
          label: 'Receipt Number',
          value: receiptNumber,
          allowCopyToClipboard: true,
        },
        generateCreditCardMaskReceiptItem(maskedCardNumber4Digits),
        generateAmountReceiptItem(parseFloat(totalAmount)),
      ]),
      transaction: {
        isSuccess: summaryCode === '0',
        errorMessage: responseDescription,
      },
      submissionResult: this.formSubmissionResult,
    }
  }
}

export async function getPaymentFormConfiguration({
  formSubmissionResult,
  formSubmissionPaymentId,
  paymentSubmissionEvent,
  abortSignal,
}: {
  formSubmissionResult: FormSubmissionResult
  formSubmissionPaymentId: string
  paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent
  abortSignal: AbortSignal
}): Promise<{
  supplierBusinessCode: string
  publishableApiKey: string
  isTestMode: boolean
}> {
  const { supplierBusinessCode, publishableApiKey, isTestMode } =
    await getCustomFormPaymentConfiguration<{
      supplierBusinessCode: string
      publishableApiKey: string
      isTestMode: boolean
    }>(
      `/forms/${formSubmissionResult.definition.id}/westpac-quick-stream-payment`,
      {
        integrationEnvironmentId:
          paymentSubmissionEvent.configuration.environmentId,
        formSubmissionPaymentId,
      },
      abortSignal,
    )

  return {
    supplierBusinessCode,
    publishableApiKey,
    isTestMode,
  }
}

export async function completeTransaction({
  formSubmissionPaymentId,
  formSubmissionResult,
  paymentSubmissionEvent,
  singleUseTokenId,
  abortSignal,
}: {
  formSubmissionPaymentId: string
  formSubmissionResult: FormSubmissionResult
  paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent
  singleUseTokenId: string
  abortSignal?: AbortSignal
}) {
  if (!formSubmissionResult.payment) {
    throw new Error(
      '"formSubmissionResult.payment" must have a value to complete transactions',
    )
  }

  const { formSubmissionPayment } = await completeWestpacQuickStreamTransaction(
    formSubmissionResult.definition.id,
    {
      formSubmissionPaymentId,
      singleUseTokenId,
      integrationEnvironmentId:
        paymentSubmissionEvent.configuration.environmentId,
      customerReferenceNumber: replaceInjectablesWithSubmissionValues(
        paymentSubmissionEvent.configuration.customerReferenceNumber,
        formSubmissionResult,
      ),
      principalAmount: formSubmissionResult.payment.amount,
    },
    abortSignal,
  )

  const url = new URL(formSubmissionResult.payment.paymentReceiptUrl)
  if (
    formSubmissionPayment.type === 'WESTPAC_QUICK_STREAM' &&
    formSubmissionPayment.paymentTransaction
  ) {
    url.searchParams.append(
      'paymentReferenceNumber',
      formSubmissionPayment.paymentTransaction.paymentReferenceNumber,
    )
    url.searchParams.append(
      'receiptNumber',
      formSubmissionPayment.paymentTransaction.receiptNumber,
    )
    url.searchParams.append(
      'totalAmount',
      formSubmissionPayment.paymentTransaction.totalAmount.amount.toString(),
    )
    url.searchParams.append(
      'summaryCode',
      formSubmissionPayment.paymentTransaction.summaryCode,
    )
    url.searchParams.append(
      'responseDescription',
      formSubmissionPayment.paymentTransaction.responseDescription,
    )
    if (
      formSubmissionPayment.paymentTransaction.creditCard
        ?.maskedCardNumber4Digits
    ) {
      url.searchParams.append(
        'maskedCardNumber4Digits',
        formSubmissionPayment.paymentTransaction.creditCard
          ?.maskedCardNumber4Digits,
      )
    }
  }

  window.location.replace(url.href)
}

export async function cancelPayment(
  formId: number,
  formSubmissionPaymentId: string,
  abortSignal?: AbortSignal,
) {
  try {
    const url = `/forms/${formId}/westpac-quick-stream-payment/${formSubmissionPaymentId}`
    return await deleteRequest(url, abortSignal)
  } catch (error) {
    Sentry.captureException(error)

    const httpError = error as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet to continue',
        {
          originalError: httpError,
          isOffline: true,
        },
      )
    }
    switch (httpError.status) {
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the form you are looking for. Please contact support if the problem persists.',
          {
            originalError: httpError,
            title: 'Unknown Form',
            httpStatusCode: httpError.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: httpError,
            httpStatusCode: httpError.status,
          },
        )
      }
    }
  }
}
