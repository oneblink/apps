import { isOffline } from '../offline-service'
import { getFormsKeyId } from '../auth-service'
import { addFormSubmissionToPendingQueue } from './pending-queue'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from '../payment-service'
import { OnProgress, uploadFormSubmission } from './s3Submit'
import { deleteDraft } from '../draft-service'
import { removePrefillFormData } from '../prefill-service'
import recentlySubmittedJobsService from './recently-submitted-jobs'
import { getUserToken } from './user-token'
import {
  handleSchedulingSubmissionEvent,
  checkForSchedulingSubmissionEvent,
} from './schedulingHandlers'
import {
  FormSubmission,
  FormSubmissionResult,
  S3UploadCredentials,
} from '../types/submissions'
import { checkIfAttachmentsAreUploading } from '../attachments-service'

type SubmissionParams = {
  formSubmission: FormSubmission
  paymentReceiptUrl?: string
  schedulingUrlConfiguration?: {
    schedulingReceiptUrl: string
    schedulingCancelUrl: string
  }
  continueWithUploadingAttachments?: boolean
}

export { SubmissionParams }

export default async function submit({
  formSubmission,
  paymentReceiptUrl,
  schedulingUrlConfiguration,
  generateCredentials,
  onProgress,
  continueWithUploadingAttachments,
}: SubmissionParams & {
  generateCredentials: (
    formSubmission: FormSubmission,
  ) => Promise<S3UploadCredentials>
  onProgress?: OnProgress
}): Promise<FormSubmissionResult> {
  formSubmission.keyId = getFormsKeyId() || undefined
  const paymentSubmissionEventConfiguration =
    checkForPaymentSubmissionEvent(formSubmission)

  const schedulingSubmissionEvent =
    checkForSchedulingSubmissionEvent(formSubmission)

  if (isOffline()) {
    if (paymentSubmissionEventConfiguration || schedulingSubmissionEvent) {
      console.log(
        'Offline - form has a payment/scheduling submission event that has not been processed yet, return offline',
        { paymentSubmissionEventConfiguration, schedulingSubmissionEvent },
      )
      return Object.assign({}, formSubmission, {
        isOffline: true,
        isInPendingQueue: false,
        submissionTimestamp: null,
        submissionId: null,
        payment: null,
        scheduling: null,
        isUploadingAttachments: false,
      })
    }

    console.log('Offline - saving submission to pending queue..')
    await addFormSubmissionToPendingQueue(formSubmission)
    return Object.assign({}, formSubmission, {
      isOffline: true,
      isInPendingQueue: true,
      submissionTimestamp: null,
      submissionId: null,
      payment: null,
      scheduling: null,
      isUploadingAttachments: false,
    })
  }

  const attachmentsStillUploading = checkIfAttachmentsAreUploading(
    formSubmission.definition,
    formSubmission,
  )

  if (attachmentsStillUploading) {
    if (!continueWithUploadingAttachments) {
      console.log(
        'Attachments still uploading and continueWithUploadingAttachments is false or undefined, return isUploadingAttachments',
        {
          paymentSubmissionEventConfiguration,
          schedulingSubmissionEvent,
        },
      )
      return Object.assign({}, formSubmission, {
        isOffline: false,
        isInPendingQueue: false,
        submissionTimestamp: null,
        submissionId: null,
        payment: null,
        scheduling: null,
        isUploadingAttachments: true,
      })
    }
    if (paymentSubmissionEventConfiguration || schedulingSubmissionEvent) {
      console.log(
        'Attachments still uploading - form has a payment/scheduling submission event that has not been processed yet, return isUploading',
        { paymentSubmissionEventConfiguration, schedulingSubmissionEvent },
      )
      return Object.assign({}, formSubmission, {
        isOffline: false,
        isInPendingQueue: false,
        submissionTimestamp: null,
        submissionId: null,
        payment: null,
        scheduling: null,
        isUploadingAttachments: true,
      })
    }
    console.log(
      'Attachments still uploading - saving submission to pending queue..',
    )
    await addFormSubmissionToPendingQueue(formSubmission)
    return Object.assign({}, formSubmission, {
      isOffline: false,
      isInPendingQueue: true,
      submissionTimestamp: null,
      submissionId: null,
      payment: null,
      scheduling: null,
      isUploadingAttachments: true,
    })
  }

  const data = await generateCredentials(formSubmission)

  const formSubmissionResult: FormSubmissionResult = {
    ...formSubmission,
    payment: null,
    scheduling: null,
    isOffline: false,
    isInPendingQueue: false,
    submissionTimestamp: data.submissionTimestamp,
    submissionId: data.submissionId,
    isUploadingAttachments: false,
  }

  if (schedulingSubmissionEvent && schedulingUrlConfiguration) {
    formSubmissionResult.scheduling = await handleSchedulingSubmissionEvent({
      formSubmissionResult,
      schedulingSubmissionEvent,
      schedulingUrlConfiguration,
      paymentReceiptUrl,
    })
  } else if (paymentSubmissionEventConfiguration && paymentReceiptUrl) {
    formSubmissionResult.payment = await handlePaymentSubmissionEvent({
      ...paymentSubmissionEventConfiguration,
      formSubmissionResult,
      paymentReceiptUrl,
    })
  }
  const userToken = getUserToken()

  await uploadFormSubmission({
    s3Configuration: data,
    formJson: {
      formsAppId: formSubmission.formsAppId,
      definition: formSubmission.definition,
      submission: formSubmission.submission,
      submissionTimestamp: data.submissionTimestamp,
      keyId: formSubmission.keyId,
      ipAddress: data.ipAddress,
      user: data.userProfile,
    },
    tags: {
      externalId: formSubmission.externalId || undefined,
      jobId: formSubmission.jobId || undefined,
      userToken: userToken || undefined,
      usernameToken: data.usernameToken,
      previousFormSubmissionApprovalId:
        formSubmissionResult.previousFormSubmissionApprovalId,
    },
    onProgress,
  })
  if (formSubmission.draftId) {
    await deleteDraft(formSubmission.draftId, formSubmission.formsAppId)
  }
  if (formSubmission.preFillFormDataId) {
    await removePrefillFormData(formSubmission.preFillFormDataId)
  }
  if (formSubmission.jobId) {
    await recentlySubmittedJobsService.add(formSubmission.jobId)
  }

  return formSubmissionResult
}
