import { MiscTypes } from '@oneblink/types'
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
