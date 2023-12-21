import { SubmissionEventTypes } from '@oneblink/types'
import {
  BasePaymentConfigurationPayload,
  PaymentFormProvider,
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
import { completeWestpacQuickStreamTransaction } from '../api/payment'

export default class WestpacQuickStreamPaymentProvider
  implements
    PaymentFormProvider<
      SubmissionEventTypes.WestpacQuickStreamSubmissionEvent,
      {
        supplierBusinessCode: string
        publishableApiKey: string
        isTestMode: boolean
      },
      {
        singleUseTokenId: string
      }
    >
{
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent,
  ) {
    this.paymentSubmissionEvent = paymentSubmissionEvent
  }

  paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickStreamSubmissionEvent

  preparePaymentConfiguration(
    { paymentFormUrl, ...basePayload }: BasePaymentConfigurationPayload,
    formSubmissionResult: FormSubmissionResult,
  ) {
    if (!paymentFormUrl) {
      throw new Error(
        'Westpac QuickStream Payments require the "hostedFormUrl" option.',
      )
    }
    return {
      path: `/forms/${formSubmissionResult.definition.id}/westpac-quick-stream-payment`,
      payload: {
        ...basePayload,
        integrationEnvironmentId:
          this.paymentSubmissionEvent.configuration.environmentId,
      },
      interpretResponse: (response: unknown) => {
        const {
          formSubmissionPaymentId,
          supplierBusinessCode,
          publishableApiKey,
          isTestMode,
        } = response as {
          formSubmissionPaymentId: string
          supplierBusinessCode: string
          publishableApiKey: string
          isTestMode: boolean
        }
        const url = new URL(paymentFormUrl)
        url.searchParams.append(
          'formSubmissionPaymentId',
          formSubmissionPaymentId,
        )
        url.searchParams.append('isTestMode', isTestMode.toString())
        url.searchParams.append('publishableApiKey', publishableApiKey)
        url.searchParams.append('supplierBusinessCode', supplierBusinessCode)
        url.searchParams.append(
          'customerReferenceNumber',
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.customerReferenceNumber,
            formSubmissionResult,
          ),
        )
        url.searchParams.append('amount', basePayload.amount.toString())
        return {
          hostedFormUrl: url.href,
        }
      },
    }
  }

  async verifyPaymentTransaction(
    query: Record<string, unknown>,
    submissionResult: FormSubmissionResult,
  ) {
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
    if (submissionResult.submissionId !== paymentReferenceNumber) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }

    return {
      receiptItems: prepareReceiptItems([
        generateSubmissionIdReceiptItem(submissionResult.submissionId),
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
      submissionResult,
    }
  }

  async handlePaymentFormQueryString(
    query: Record<string, unknown>,
    formSubmissionResult: FormSubmissionResult,
    paymentReceiptUrl: string,
  ): Promise<{
    paymentFormConfiguration: {
      supplierBusinessCode: string
      publishableApiKey: string
      isTestMode: boolean
    }
    completeTransaction(
      payload: { singleUseTokenId: string },
      abortSignal?: AbortSignal | undefined,
    ): Promise<void>
  }> {
    const {
      formSubmissionPaymentId,
      supplierBusinessCode,
      publishableApiKey,
      isTestMode,
      customerReferenceNumber,
    } = query

    if (
      typeof customerReferenceNumber !== 'string' ||
      !customerReferenceNumber ||
      typeof formSubmissionPaymentId !== 'string' ||
      !formSubmissionPaymentId ||
      typeof supplierBusinessCode !== 'string' ||
      !supplierBusinessCode ||
      typeof publishableApiKey !== 'string' ||
      !publishableApiKey ||
      typeof isTestMode !== 'string' ||
      !isTestMode
    ) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for a misconfigured payment.',
      )
    }

    return {
      paymentFormConfiguration: {
        supplierBusinessCode,
        publishableApiKey,
        isTestMode: isTestMode === 'true',
      },
      completeTransaction: async (
        {
          singleUseTokenId,
        }: {
          singleUseTokenId: string
        },
        abortSignal?: AbortSignal,
      ) => {
        if (
          formSubmissionResult.payment?.submissionEvent.type !==
          'WESTPAC_QUICK_STREAM'
        ) {
          throw new Error('')
        }

        const { formSubmissionPayment } =
          await completeWestpacQuickStreamTransaction(
            formSubmissionResult.definition.id,
            {
              formSubmissionPaymentId,
              singleUseTokenId,
              integrationEnvironmentId:
                formSubmissionResult.payment.submissionEvent.configuration
                  .environmentId,
              customerReferenceNumber,
              principalAmount: formSubmissionResult.payment.amount,
            },
            abortSignal,
          )

        const url = new URL(paymentReceiptUrl)
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
      },
    }
  }
}
