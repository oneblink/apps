import { SubmissionEventTypes } from '@oneblink/types'
import {
  BasePaymentConfigurationPayload,
  PaymentProvider,
} from '../../types/payments'
import { FormSubmissionResult } from '../../types/submissions'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import {
  acknowledgeCPPayTransaction,
  verifyPaymentTransaction,
} from '../api/payment'
import { components } from '@oneblink/types/typescript/cp-pay/swagger.v2'
import {
  generateAmountReceiptItem,
  generateCreditCardMaskReceiptItem,
  generateSubmissionIdReceiptItem,
  prepareReceiptItems,
} from './receipt-items'

class CPPayPaymentProvider
  implements PaymentProvider<SubmissionEventTypes.CPPaySubmissionEvent>
{
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.CPPaySubmissionEvent,
  ) {
    this.paymentSubmissionEvent = paymentSubmissionEvent
  }

  paymentSubmissionEvent: SubmissionEventTypes.CPPaySubmissionEvent

  preparePaymentConfiguration(
    basePayload: BasePaymentConfigurationPayload,
    formSubmissionResult: FormSubmissionResult,
  ) {
    return {
      path: `/forms/${formSubmissionResult.definition.id}/cp-pay-payment`,
      payload: {
        ...basePayload,
        integrationGatewayId:
          this.paymentSubmissionEvent.configuration.gatewayId,
      },
    }
  }

  async verifyPaymentTransaction(
    query: Record<string, unknown>,
    submissionResult: FormSubmissionResult,
  ) {
    const { transactionId, externalReferenceId: submissionId } = query
    if (typeof transactionId !== 'string' || !submissionId) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }
    if (submissionResult.submissionId !== submissionId) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }

    const transaction = await verifyPaymentTransaction<
      components['schemas']['TransactionDetailsViewModelResponseEnvelope']
    >(`/forms/${submissionResult.definition.id}/cp-pay-verification`, {
      transactionId,
      integrationGatewayId: this.paymentSubmissionEvent.configuration.gatewayId,
    })
    // Asynchronously acknowledge receipt
    acknowledgeCPPayTransaction(submissionResult.definition.id, {
      transactionId,
      integrationGatewayId: this.paymentSubmissionEvent.configuration.gatewayId,
    }).catch((error) => {
      console.warn(
        'Error while attempting to acknowledge CP Pay transaction',
        error,
      )
    })

    return {
      receiptItems: prepareReceiptItems([
        generateSubmissionIdReceiptItem(submissionResult.submissionId),
        {
          className: 'ob-payment-receipt__transaction-id',
          valueClassName: 'cypress-payment-receipt-transaction-id',
          icon: 'shopping_cart',
          label: 'Transaction Id',
          value: transactionId,
          allowCopyToClipboard: true,
        },
        generateCreditCardMaskReceiptItem(
          transaction.result?.lastFour
            ? `xxxx xxxx xxxx ${transaction.result.lastFour}`
            : null,
        ),
        generateAmountReceiptItem(transaction.result?.amount),
      ]),
      transaction: {
        isSuccess: transaction.result?.responseType === 'Success',
        errorMessage: transaction.result?.errorCode,
      },
      submissionResult,
    }
  }
}

export default CPPayPaymentProvider
