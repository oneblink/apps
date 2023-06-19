import { SubmissionEventTypes } from '@oneblink/types'
import {
  BasePaymentConfigurationPayload,
  PaymentProvider,
} from '../../types/payments'
import { FormSubmissionResult } from '../../types/submissions'
import replaceInjectablesWithSubmissionValues from '../replaceInjectablesWithSubmissionValues'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'

class NSWGovPayPaymentProvider
  implements PaymentProvider<SubmissionEventTypes.NSWGovPaySubmissionEvent>
{
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.NSWGovPaySubmissionEvent,
  ) {
    this.paymentSubmissionEvent = paymentSubmissionEvent
  }

  paymentSubmissionEvent: SubmissionEventTypes.NSWGovPaySubmissionEvent

  preparePaymentConfiguration(
    basePayload: BasePaymentConfigurationPayload,
    formSubmissionResult: FormSubmissionResult,
  ) {
    return {
      path: `/forms/${formSubmissionResult.definition.id}/nsw-gov-pay-payment`,
      payload: {
        ...basePayload,
        integrationPrimaryAgencyId:
          this.paymentSubmissionEvent.configuration.primaryAgencyId,
        productDescription: replaceInjectablesWithSubmissionValues(
          this.paymentSubmissionEvent.configuration.productDescription,
          formSubmissionResult,
        ),
        customerReference:
          this.paymentSubmissionEvent.configuration.customerReference &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.customerReference,
            formSubmissionResult,
          ),
        subAgencyCode:
          this.paymentSubmissionEvent.configuration.subAgencyCode &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.subAgencyCode,
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
      submissionId,
      isSuccess,
      errorMessage,
      id,
      creditCardMask,
      amount,
      isBpay,
    } = query as {
      submissionId?: string
      isSuccess?: string
      errorMessage?: string
      id?: string
      creditCardMask?: string
      amount?: string
      isBpay?: string
    }

    if (!submissionId || !isSuccess || !id || !isBpay) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }

    if (submissionResult.submissionId !== submissionId) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }

    return {
      transaction: {
        isSuccess: isSuccess === 'true',
        errorMessage,
        id,
        creditCardMask: creditCardMask
          ? `xxxx xxxx xxxx ${creditCardMask}`
          : null,
        amount: typeof amount === 'string' ? parseFloat(amount) : undefined,
        isBpay: isBpay === 'true',
      },
      submissionResult,
    }
  }
}

export default NSWGovPayPaymentProvider
