import { MiscTypes, SubmissionEventTypes } from '@oneblink/types'
import { FormSubmissionResult } from './submissions'

export type PaymentReceiptItem = {
  /** The label to represent the value */
  label: string
  /** The value to display */
  value: string
  /** A CSS class to add to the HTML element container */
  className?: string
  /** A CSS class to add to the HTML element containing the value */
  valueClassName?: string
  /** A [material icon](https://fonts.google.com/icons) */
  icon?: string
  /** Display a button on the receipt item to copy the value to the clipboard */
  allowCopyToClipboard: boolean
}

export type HandlePaymentResult = {
  receiptItems: PaymentReceiptItem[]
  transaction: {
    /** `true` if the transaction was successful */
    isSuccess: boolean
    /** The error message to display if `isSuccess` is `false` */
    errorMessage: string | MiscTypes.NoU
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
