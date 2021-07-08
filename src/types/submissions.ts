import { FormTypes, SubmissionEventTypes } from '@oneblink/types'

export type NewDraftSubmission = {
  submission: {
    readonly [key: string]: unknown
  }
  definition: FormTypes.Form
}

export type NewFormSubmission = NewDraftSubmission & {
  captchaTokens: string[]
}

export type DraftSubmission = NewDraftSubmission & {
  formsAppId: number
  keyId?: string
}

export type FormSubmission = DraftSubmission &
  NewFormSubmission & {
    draftId: string | null
    jobId: string | null
    externalId: string | null
    preFillFormDataId: string | null
    previousFormSubmissionApprovalId?: string
  }

export type FormSubmissionResult = FormSubmission & {
  submissionId: string | null
  submissionTimestamp: string | null
  payment: {
    amount: number
    hostedFormUrl: string
    submissionEvent: SubmissionEventTypes.PaymentSubmissionEvent
  } | null
  scheduling: {
    bookingUrl: string
    submissionEvent: SubmissionEventTypes.SchedulingSubmissionEvent
  } | null
  isInPendingQueue: boolean
  isOffline: boolean
}

export type PendingFormSubmission = Omit<FormSubmission, 'submission'> & {
  pendingTimestamp: string
  isSubmitting?: boolean
  error?: string
}
