import { isOffline } from '../offline-service'
import {
  addFormSubmissionToPendingQueue,
  deletePendingQueueSubmission,
} from './pending-queue'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from '../payment-service'
import { removeLocalDraftSubmission } from './draft-data-store'
import { removePrefillFormData } from '../prefill-service'
import {
  handleSchedulingSubmissionEvent,
  checkForSchedulingSubmissionEvent,
} from './schedulingHandlers'
import {
  FormSubmission,
  FormSubmissionResult,
  ProgressListener,
  ProgressListenerEvent,
} from '../types/submissions'
import { checkIfAttachmentsAreUploading } from '../attachments-service'
import tenants from '../tenants'
import externalIdGeneration from './external-id-generation'
import serverValidateForm from './server-validation'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import { uploadFormSubmission } from './api/submissions'
import { syncDrafts } from '../draft-service'

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
    schedulingRescheduleUrl: string
  }
  pendingTimestamp?: string
  onProgress?: ProgressListener
  abortSignal?: AbortSignal
}

export { SubmissionParams, ProgressListener, ProgressListenerEvent }

export default async function submit({
  formSubmission,
  isPendingQueueEnabled,
  paymentReceiptUrl,
  paymentFormUrl,
  schedulingUrlConfiguration,
  onProgress,
  shouldRunServerValidation,
  shouldRunExternalIdGeneration,
  abortSignal,
  pendingTimestamp,
}: SubmissionParams): Promise<FormSubmissionResult> {
  try {
    if (pendingTimestamp) {
      await deletePendingQueueSubmission(pendingTimestamp)
    }
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

    const data = await uploadFormSubmission(
      formSubmission,
      onProgress,
      abortSignal,
    )

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

    if (formSubmission.formSubmissionDraftId) {
      await removeLocalDraftSubmission(formSubmission.formSubmissionDraftId)
      syncDrafts({
        formsAppId: formSubmission.formsAppId,
        throwError: false,
      })
    }
    if (formSubmission.preFillFormDataId) {
      await removePrefillFormData(formSubmission.preFillFormDataId)
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
