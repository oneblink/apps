import {
  FormTypes,
  SubmissionEventTypes,
  MiscTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { S3ObjectCredentials } from '@oneblink/types/typescript/aws'
import { FormElement } from '@oneblink/types/typescript/forms'
import { FormSubmissionMeta } from '@oneblink/types/typescript/submissions'

export type BaseFormSubmission = {
  /** The submission data */
  submission: SubmissionTypes.S3SubmissionData['submission']
  /** The form definition when the draft was saved */
  definition: FormTypes.Form
}

export type NewDraftSubmission = BaseFormSubmission & {
  /**
   * Set to true if the submission should be uploaded in the background, false
   * or undefined if the submission should be uploaded immediately
   */
  backgroundUpload?: boolean
  /** The element that was last updated before the draft was saved */
  lastElementUpdated?: FormElement
}

export type NewFormSubmission = BaseFormSubmission & {
  /** Captcha tokens gathered by a `captcha` Form Element */
  captchaTokens: string[]
}

export type DraftSubmission = NewDraftSubmission & {
  /** The id of the Forms App submitting for */
  formsAppId: number
  /**
   * The id of the Forms Developer Key used to create the token passed to
   * `authService.setFormsKeyToken()`
   */
  keyId?: string
}

export type FormSubmission = DraftSubmission &
  NewFormSubmission & {
    /** The id of the draft to clean up after successful submission */
    draftId: string | null
    /** The id of the job to submit */
    jobId: string | null
    /** The id of the Forms App submitting for */
    externalId: string | null
    /** The id of the prefill data to clean up after successful submission */
    preFillFormDataId: string | null
    /**
     * The id of the previous form submission approval id. Only used when the
     * form submission is in response to `CLARIFICATION_REQUIRED` approval.
     */
    previousFormSubmissionApprovalId?: string
    /** The id of the scheduled task being completed */
    taskId?: number
    taskGroupId?: number
    taskGroupInstanceId?: number
  }

export type FormSubmissionResult = FormSubmission & {
  /** `null` if the form submission was unsuccessful */
  submissionId: string | null
  /** `null` if the form submission was unsuccessful */
  submissionTimestamp: string | null
  /** `null` if the form submission does not require a payment */
  payment: {
    /** The amount required to pay */
    amount: number
    /** The URL to redirect the user to to complete the payment process */
    hostedFormUrl: string
    /** The payment submission event */
    submissionEvent: SubmissionEventTypes.FormPaymentEvent
  } | null
  /** `null` if the form submission does not require a booking */
  scheduling: {
    /** The URL to redirect the user to to complete the booking process */
    bookingUrl: string
    /** The scheduling submission event */
    submissionEvent: SubmissionEventTypes.SchedulingSubmissionEvent
  } | null
  /**
   * Will have a value if the user was attempting to complete a scheduled task
   * via a form submission
   */
  taskCompletion?: {
    /** The URL to redirect the user to after completing the task via form submission */
    scheduledTasksUrl: string
  }
  /** `true` if the submission was not submitted yet and was added to the pending queue */
  isInPendingQueue: boolean
  /** `true` if the submission was attempted offline */
  isOffline: boolean
  /** The ipAddress of the client submitting */
  ipAddress?: string
  /** True if the submission was attempted whilst attachments were uploading */
  isUploadingAttachments: boolean
  /** Exists if the form allows PDF download */
  downloadSubmissionPdfUrl?: string
}

export type PendingFormSubmission = Omit<FormSubmission, 'submission'> & {
  /** The date and time (in ISO format) the submission was attempted */
  pendingTimestamp: string
  /** `true` if the submission is currently being processed by the pending queue */
  isSubmitting?: boolean
  /**
   * An error message that might be set while attempting to process the
   * submission in the pending queue
   */
  error?: string
}

type _S3UploadCredentials = S3ObjectCredentials & {
  submissionTimestamp: string
  usernameToken: string
}

export type S3UploadCredentials = _S3UploadCredentials & {
  submissionId: string
  ipAddress?: string
  userProfile?: MiscTypes.UserProfile
  pdfAccessToken?: string
  formSubmissionMeta: FormSubmissionMeta
  preventPayment?: boolean
}

export type S3DraftUploadCredentials = _S3UploadCredentials & {
  draftDataId: string
}
