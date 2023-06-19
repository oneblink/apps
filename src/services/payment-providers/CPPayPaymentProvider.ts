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
    if (!transactionId || !submissionId) {
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
      transaction: {
        isSuccess: transaction.result?.responseType === 'Success',
        errorMessage: transaction.result?.errorCode,
        id: transactionId as string,
        creditCardMask: transaction.result?.lastFour
          ? `xxxx xxxx xxxx ${transaction.result.lastFour}`
          : null,
        amount: transaction.result?.amount,
      },
      submissionResult,
    }
  }
}

export default CPPayPaymentProvider
