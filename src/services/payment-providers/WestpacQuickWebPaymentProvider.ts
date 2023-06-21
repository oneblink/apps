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

class WestpacQuickWebPaymentProvider
  implements
    PaymentProvider<SubmissionEventTypes.WestpacQuickWebSubmissionEvent>
{
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickWebSubmissionEvent,
  ) {
    this.paymentSubmissionEvent = paymentSubmissionEvent
  }

  paymentSubmissionEvent: SubmissionEventTypes.WestpacQuickWebSubmissionEvent

  preparePaymentConfiguration(
    basePayload: BasePaymentConfigurationPayload,
    formSubmissionResult: FormSubmissionResult,
  ) {
    return {
      path: `/forms/${formSubmissionResult.definition.id}/westpac-quick-web-payment`,
      payload: {
        ...basePayload,
        integrationEnvironmentId:
          this.paymentSubmissionEvent.configuration.environmentId,
        customerReferenceNumber:
          this.paymentSubmissionEvent.configuration.customerReferenceNumber &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.customerReferenceNumber,
            formSubmissionResult,
          ),
      },
    }
  }

  async verifyPaymentTransaction(
    query: Record<string, unknown>,
    submissionResult: FormSubmissionResult,
  ) {
    const {
      paymentReference,
      receiptNumber,
      maskedCardNumber,
      summaryCode,
      responseDescription,
      paymentAmount,
    } = query as {
      paymentReference?: string
      receiptNumber?: string
      maskedCardNumber?: string
      summaryCode?: string
      responseDescription?: string
      paymentAmount?: string
    }
    if (
      !query ||
      !paymentReference ||
      !receiptNumber ||
      !summaryCode ||
      !responseDescription ||
      !paymentAmount
    ) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }
    if (submissionResult.submissionId !== paymentReference) {
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
        generateCreditCardMaskReceiptItem(maskedCardNumber),
        generateAmountReceiptItem(parseFloat(paymentAmount)),
      ]),
      transaction: {
        isSuccess: summaryCode === '0',
        errorMessage: responseDescription,
      },
      submissionResult,
    }
  }
}

export default WestpacQuickWebPaymentProvider
