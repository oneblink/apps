import { SubmissionEventTypes } from '@oneblink/types'
import {
  BasePaymentConfigurationPayload,
  PaymentProvider,
} from '../../types/payments'
import { FormSubmissionResult } from '../../types/submissions'
import replaceInjectablesWithSubmissionValues from '../replaceInjectablesWithSubmissionValues'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import { verifyPaymentTransaction } from '../api/payment'

class BPOINTPaymentProvider
  implements PaymentProvider<SubmissionEventTypes.BPOINTSubmissionEvent>
{
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.BPOINTSubmissionEvent,
  ) {
    this.paymentSubmissionEvent = paymentSubmissionEvent
  }

  paymentSubmissionEvent: SubmissionEventTypes.BPOINTSubmissionEvent

  preparePaymentConfiguration(
    basePayload: BasePaymentConfigurationPayload,
    formSubmissionResult: FormSubmissionResult,
  ) {
    return {
      path: `/forms/${formSubmissionResult.definition.id}/bpoint-payment`,
      payload: {
        ...basePayload,
        integrationEnvironmentId:
          this.paymentSubmissionEvent.configuration.environmentId,
        crn2:
          this.paymentSubmissionEvent.configuration.crn2 &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.crn2,
            formSubmissionResult,
          ),
        crn3:
          this.paymentSubmissionEvent.configuration.crn3 &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.crn3,
            formSubmissionResult,
          ),
      },
    }
  }

  async verifyPaymentTransaction(
    query: Record<string, unknown>,
    formSubmissionResult: FormSubmissionResult,
  ) {
    const { ResultKey: transactionToken } = query
    if (!transactionToken) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }
    const transaction = await verifyPaymentTransaction<{
      ResponseCode: string
      ResponseText: string
      ReceiptNumber: string
      CardDetails?: {
        MaskedCardNumber?: string
      }
      Amount: number
      Crn1: string | null
    }>(`/forms/${formSubmissionResult.definition.id}/bpoint-verification`, {
      transactionToken,
      integrationEnvironmentId:
        this.paymentSubmissionEvent.configuration.environmentId,
    })
    if (formSubmissionResult.submissionId !== transaction.Crn1) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }
    return {
      transaction: {
        isSuccess: transaction.ResponseCode === '0',
        errorMessage: transaction.ResponseText,
        id: transaction.ReceiptNumber,
        creditCardMask: transaction.CardDetails?.MaskedCardNumber || null,
        amount: transaction.Amount / 100,
      },
      submissionResult: formSubmissionResult,
    }
  }
}

export default BPOINTPaymentProvider
