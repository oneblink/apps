import { MiscTypes, SubmissionEventTypes } from '@oneblink/types'
import { FormSubmissionResult } from './submissions'

export type HandlePaymentResult = {
  transaction: {
    /** `true` if the transaction was successful */
    isSuccess: boolean
    /** The error message to display if `isSuccess` is `false` */
    errorMessage: string | MiscTypes.NoU
    /** The id the transaction */
    id: string | MiscTypes.NoU
    /** A mask of the credit card used e.g. _1234....7890_ */
    creditCardMask: string | MiscTypes.NoU
    /** The total amount charged */
    amount: number | MiscTypes.NoU
  }
  submissionResult: FormSubmissionResult
}

export type BasePaymentConfigurationPayload = {
  amount: number
  redirectUrl: string
  submissionId: string | null
}

export interface PaymentProvider<T extends SubmissionEventTypes.FormEventBase> {
  paymentSubmissionEvent: T

  preparePaymentConfiguration(
    basePayload: BasePaymentConfigurationPayload,
    formSubmissionResult: FormSubmissionResult,
  ): {
    path: string
    payload: BasePaymentConfigurationPayload
  }

  verifyPaymentTransaction(
    query: Record<string, unknown>,
    formSubmissionResult: FormSubmissionResult,
  ): Promise<HandlePaymentResult>
}
