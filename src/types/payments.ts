import { MiscTypes } from '@oneblink/types'
import { FormSubmissionResult } from './submissions'

export type HandlePaymentResult = {
  transaction: {
    isSuccess: boolean
    errorMessage: string | MiscTypes.NoU
    id: string | MiscTypes.NoU
    creditCardMask: string | MiscTypes.NoU
    amount: number | MiscTypes.NoU
  }
  submissionResult: FormSubmissionResult
}
