import { isOffline } from './offline-service'
import { getFormsKeyId, isLoggedIn } from './auth-service'
import {
  registerPendingQueueListener,
  addSubmissionToPendingQueue,
  getPendingQueueSubmissions,
  getPendingQueueSubmission,
  updatePendingQueueSubmission,
  deletePendingQueueSubmission,
} from './services/pending-queue'
import { handlePaymentSubmissionEvent } from './payment-service'
import {
  generateSubmissionCredentials,
  generateUploadAttachmentCredentials,
} from './services/api/submissions'
import { uploadFormSubmission } from './services/s3Submit'
import { deleteDraft } from './draft-service'
import { removePrefillFormData } from './prefill-service'
import replaceCustomValues from './services/replace-custom-values'
import recentlySubmittedJobsService from './services/recently-submitted-jobs'
import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'
import { getUserToken } from './services/user-token'
import Sentry from './Sentry'
import {
  UploadFileConfiguration,
  uploadFileStreamToS3,
} from './services/s3Submit'

let _isProcessingPendingQueue = false

async function processPendingQueue(): Promise<void> {
  if (_isProcessingPendingQueue) {
    return
  }
  _isProcessingPendingQueue = true

  console.log('Checking pending queue for submissions.')
  const submissions = await getPendingQueueSubmissions()

  console.log(`Found ${submissions.length} submission(s) in the pending queue.`)
  for (const submission of submissions) {
    if (isOffline()) {
      console.log(
        'Application is offline, leaving submission in the pending queue:',
        submission,
      )
      continue
    }

    if (submission.definition.isAuthenticated && !isLoggedIn()) {
      console.log(
        'Authentication is required for this form but the user does not have a valid token, leaving submission in the pending queue:',
        submission,
      )
      continue
    }

    try {
      console.log(
        'Attempting to process submission from pending queue:',
        submission,
      )
      // Get Submission again to get ensure we are submitting all the data
      const existingSubmission = await getPendingQueueSubmission(
        submission.pendingTimestamp,
      )
      if (!existingSubmission) {
        console.log(
          'Skipping submission as it has already been processed',
          submission,
        )
        continue
      }

      submission.isSubmitting = true
      submission.error = undefined
      await updatePendingQueueSubmission(
        submission.pendingTimestamp,
        submission,
      )

      await submit({ formSubmission: existingSubmission })

      await deletePendingQueueSubmission(submission.pendingTimestamp)

      console.log(
        'Successfully processed submission from the pending queue',
        submission,
      )
    } catch (error) {
      Sentry.captureException(error)
      console.error('Error processing submission from the pending queue', error)
      submission.isSubmitting = false
      if (error.message) {
        submission.error = error.message
      } else {
        submission.error =
          'An unknown error has occurred, which has prevented your Form from submitting. Please try again, or contact your Administrator if the problem persists.'
      }
      await updatePendingQueueSubmission(
        submission.pendingTimestamp,
        submission,
      )
    }
  }

  console.log(
    'Finished attempting to processing submissions in the pending queue.',
  )
  _isProcessingPendingQueue = false
}

async function submit({
  formSubmission,
  paymentReceiptUrl,
}: {
  formSubmission: SubmissionTypes.FormSubmission
  paymentReceiptUrl?: string
}): Promise<SubmissionTypes.FormSubmissionResult> {
  formSubmission.keyId = getFormsKeyId() || undefined
  const submissionEvents = formSubmission.definition.submissionEvents || []
  const paymentSubmissionEvent = submissionEvents.reduce(
    (
      p: SubmissionEventTypes.PaymentSubmissionEvent | null,
      submissionEvent,
    ) => {
      if (
        submissionEvent.type === 'CP_PAY' ||
        submissionEvent.type === 'BPOINT'
      ) {
        return submissionEvent
      }
      return p
    },
    null,
  )

  if (paymentSubmissionEvent) {
    console.log('Form has a payment submission event', paymentSubmissionEvent)
  }

  if (isOffline()) {
    if (paymentSubmissionEvent) {
      console.log(
        'Offline - form has a payment submission event and payment has not been processed yet, return offline',
      )
      return Object.assign({}, formSubmission, {
        isOffline: true,
        isInPendingQueue: false,
        submissionTimestamp: null,
        submissionId: null,
        payment: null,
      })
    }

    console.log('Offline - saving submission to pending queue..')
    await addSubmissionToPendingQueue(
      Object.assign({}, formSubmission, {
        pendingTimestamp: new Date().toISOString(),
      }),
    )
    return Object.assign({}, formSubmission, {
      isOffline: true,
      isInPendingQueue: true,
      submissionTimestamp: null,
      submissionId: null,
      payment: null,
    })
  }

  const data = await generateSubmissionCredentials(formSubmission)

  const formSubmissionResult = {
    ...formSubmission,
    payment: null,
    isOffline: false,
    isInPendingQueue: false,
    submissionTimestamp: data.submissionTimestamp,
    submissionId: data.submissionId,
  }

  let paymentSubmissionResult:
    | SubmissionTypes.FormSubmissionResult
    | undefined = undefined
  if (paymentSubmissionEvent && paymentReceiptUrl) {
    paymentSubmissionResult = await handlePaymentSubmissionEvent({
      formSubmissionResult,
      paymentSubmissionEvent,
      paymentReceiptUrl,
    })
  }
  const userToken = getUserToken()

  await uploadFormSubmission(
    data,
    {
      formsAppId: formSubmission.formsAppId,
      definition: formSubmission.definition,
      submission: formSubmission.submission,
      submissionTimestamp: data.submissionTimestamp,
      keyId: formSubmission.keyId,
    },
    {
      externalId: formSubmission.externalId || undefined,
      jobId: formSubmission.jobId || undefined,
      payment: paymentSubmissionResult ? 'PENDING' : undefined,
      userToken: userToken || undefined,
      usernameToken: data.usernameToken,
      previousFormSubmissionApprovalId:
        formSubmissionResult.previousFormSubmissionApprovalId,
    },
  )
  if (formSubmission.draftId) {
    await deleteDraft(formSubmission.draftId, formSubmission.formsAppId)
  }
  if (formSubmission.preFillFormDataId) {
    await removePrefillFormData(formSubmission.preFillFormDataId)
  }
  if (formSubmission.jobId) {
    await recentlySubmittedJobsService.add(formSubmission.jobId)
  }

  if (paymentSubmissionResult) {
    return paymentSubmissionResult
  }

  return formSubmissionResult
}

async function closeWindow(): Promise<void> {
  // @ts-expect-error
  if (window.cordova && window.cordova.plugins.exit) {
    // @ts-expect-error
    window.cordova.plugins.exit()
    return
  }

  window.close()

  // If the browser has not closed after timeout,
  // we throw an error to display to the user
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('Could not close as window was not opened using JavaScript')
      reject(
        new Error(
          'We were unable to close your browser, could you please close it manually for us?',
        ),
      )
    }, 500)
  })
}

async function cancelForm(): Promise<void> {
  if (window.history.length <= 1) {
    return closeWindow()
  } else {
    window.history.back()
  }
}

async function executePostSubmissionAction(
  submissionResult: SubmissionTypes.FormSubmissionResult,
  push: (url: string) => void,
): Promise<void> {
  console.log('Attempting to run post submission action')
  let postSubmissionAction = submissionResult.definition.postSubmissionAction
  let redirectUrl = submissionResult.definition.redirectUrl

  if (submissionResult.payment) {
    postSubmissionAction = 'URL'
    redirectUrl = submissionResult.payment.hostedFormUrl
  }

  switch (postSubmissionAction) {
    case 'CLOSE':
      return closeWindow()
    case 'FORMS_LIBRARY':
      push('/')
      break
    case 'URL': {
      const newUrl = replaceCustomValues(redirectUrl || '/', submissionResult)
      // Relative URLs can be navigated to internally
      if (newUrl[0] === '/') {
        push(newUrl)
        return
      }

      window.location.href = newUrl

      // If we are in cordova land, we will navigate
      // back to the home screen after redirect
      if (window.cordova) {
        // Wait a couple of seconds to ensure the browser has
        // been opened before navigating away from form.
        setTimeout(() => {
          push('/')
        }, 2000)
      }
      break
    }
    default: {
      // if there's no post submission action for some reason, use prev. logic...
      return cancelForm()
    }
  }
}

async function uploadAttachment({
  formId,
  file,
}: {
  formId: number
  file: Required<UploadFileConfiguration>
}) {
  const creds = await generateUploadAttachmentCredentials(formId)
  await uploadFileStreamToS3(creds, file)
  return creds.attachmentDataId
}

export {
  submit,
  executePostSubmissionAction,
  cancelForm,
  getPendingQueueSubmissions,
  deletePendingQueueSubmission,
  registerPendingQueueListener,
  processPendingQueue,
  uploadAttachment,
}
