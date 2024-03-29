import { isOffline } from '../offline-service'
import { getFormsKeyId } from '../auth-service'
import { addFormSubmissionToPendingQueue } from './pending-queue'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from '../payment-service'
import {
  ProgressListener,
  ProgressListenerEvent,
  uploadFormSubmission,
} from './s3Submit'
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
import tenants from '../tenants'
import externalIdGeneration from './external-id-generation'
import serverValidateForm from './server-validation'
import OneBlinkAppsError from './errors/oneBlinkAppsError'

type SubmissionParams = {
  formSubmission: FormSubmission
  isPendingQueueEnabled: boolean
  shouldRunServerValidation: boolean
  shouldRunExternalIdGeneration: boolean
  paymentReceiptUrl: string | undefined
  paymentFormUrl: string | undefined
  schedulingUrlConfiguration?: {
    schedulingReceiptUrl: string
    schedulingCancelUrl: string
  }
}

export { SubmissionParams, ProgressListener, ProgressListenerEvent }

export default async function submit({
  formSubmission,
  isPendingQueueEnabled,
  paymentReceiptUrl,
  paymentFormUrl,
  schedulingUrlConfiguration,
  generateCredentials,
  onProgress,
  shouldRunServerValidation,
  shouldRunExternalIdGeneration,
}: SubmissionParams & {
  generateCredentials: (
    formSubmission: FormSubmission,
  ) => Promise<S3UploadCredentials>
  onProgress?: ProgressListener
}): Promise<FormSubmissionResult> {
  try {
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

      if (!isPendingQueueEnabled) {
        console.log(
          'Offline - app does not support pending queue, return offline',
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
      formSubmission.submission,
    )

    if (attachmentsStillUploading) {
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

    if (shouldRunServerValidation) {
      await serverValidateForm(formSubmission)
    }
    if (shouldRunExternalIdGeneration) {
      const externalIdResult = await externalIdGeneration(formSubmission)
      if (externalIdResult.externalId) {
        formSubmission.externalId = externalIdResult.externalId
      }
    }
    formSubmission.keyId = getFormsKeyId() || undefined

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
      downloadSubmissionPdfUrl: !data.pdfAccessToken
        ? undefined
        : `${tenants.current.apiOrigin}/forms/${formSubmission.definition.id}/submissions/${data.submissionId}/pdf-document?accessToken=${data.pdfAccessToken}`,
    }

    if (schedulingSubmissionEvent && schedulingUrlConfiguration) {
      formSubmissionResult.scheduling = await handleSchedulingSubmissionEvent({
        formSubmissionResult,
        schedulingSubmissionEvent,
        schedulingUrlConfiguration,
        paymentReceiptUrl,
        paymentFormUrl,
      })
    } else if (
      paymentSubmissionEventConfiguration &&
      paymentReceiptUrl &&
      !data.preventPayment
    ) {
      formSubmissionResult.payment = await handlePaymentSubmissionEvent({
        ...paymentSubmissionEventConfiguration,
        formSubmissionResult,
        paymentReceiptUrl,
        paymentFormUrl,
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
        externalId: formSubmission.externalId || undefined,
        task: formSubmission.taskCompletion?.task,
        taskGroup: formSubmission.taskCompletion?.taskGroup,
        taskGroupInstance: formSubmission.taskCompletion?.taskGroupInstance,
      },
      tags: {
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
  } catch (error: OneBlinkAppsError | unknown) {
    if (error instanceof OneBlinkAppsError) {
      if (error.isOffline) {
        if (!isPendingQueueEnabled) {
          console.warn(
            'Offline error thrown - app does not support pending queue, return offline',
            error,
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

        console.warn(
          'Offline error thrown - saving submission to pending queue..',
          error,
        )
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

      // If the error has already been handled as a
      // OneBlinkAppsError, we can throw it as is.
      throw error
    }

    throw new OneBlinkAppsError(
      'An error has occurred with your submission, please contact Support if this problem persists.',
      {
        title: 'Unexpected Error',
        originalError: error as Error,
      },
    )
  }
}
