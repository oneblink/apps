import { isOffline } from './offline-service'
import { getFormsKeyId, isLoggedIn } from './auth-service'
import {
  registerPendingQueueListener,
  addFormSubmissionToPendingQueue,
  getPendingQueueSubmissions,
  getFormSubmission,
  updatePendingQueueSubmission,
  deletePendingQueueSubmission,
} from './services/pending-queue'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from './payment-service'
import { generateSubmissionCredentials } from './services/api/submissions'
import { uploadFormSubmission } from './services/s3Submit'
import uploadAttachment from './services/uploadAttachment'
import { deleteDraft } from './draft-service'
import { removePrefillFormData } from './prefill-service'
import replaceCustomValues from './services/replace-custom-values'
import recentlySubmittedJobsService from './services/recently-submitted-jobs'
import { FormTypes } from '@oneblink/types'
import { getUserToken } from './services/user-token'
import Sentry from './Sentry'
import prepareSubmissionData from './services/prepareSubmissionData'
import {
  handleSchedulingSubmissionEvent,
  checkForSchedulingSubmissionEvent,
} from './services/schedulingHandlers'
import {
  PendingFormSubmission,
  FormSubmission,
  FormSubmissionResult,
  NewDraftSubmission,
  NewFormSubmission,
  DraftSubmission,
} from './types/submissions'

let _isProcessingPendingQueue = false

async function processPendingQueue(): Promise<void> {
  if (_isProcessingPendingQueue) {
    return
  }
  _isProcessingPendingQueue = true

  console.log('Checking pending queue for submissions.')
  const pendingQueueSubmissions = await getPendingQueueSubmissions()

  console.log(
    `Found ${pendingQueueSubmissions.length} submission(s) in the pending queue.`,
  )
  for (const pendingQueueSubmission of pendingQueueSubmissions) {
    if (isOffline()) {
      console.log(
        'Application is offline, leaving submission in the pending queue:',
        pendingQueueSubmission,
      )
      continue
    }

    if (pendingQueueSubmission.definition.isAuthenticated && !isLoggedIn()) {
      console.log(
        'Authentication is required for this form but the user does not have a valid token, leaving submission in the pending queue:',
        pendingQueueSubmission,
      )
      continue
    }

    try {
      console.log(
        'Attempting to process submission from pending queue:',
        pendingQueueSubmission,
      )
      // Get Submission again to get ensure we are submitting all the data
      const formSubmission = await getFormSubmission(
        pendingQueueSubmission.pendingTimestamp,
      )
      if (!formSubmission) {
        console.log(
          'Skipping submission as it has already been processed',
          pendingQueueSubmission,
        )
        continue
      }

      pendingQueueSubmission.isSubmitting = true
      pendingQueueSubmission.error = undefined
      await updatePendingQueueSubmission(
        pendingQueueSubmission.pendingTimestamp,
        pendingQueueSubmission,
      )

      const submission = await prepareSubmissionData(formSubmission)
      await submit({ formSubmission: { ...formSubmission, submission } })

      await deletePendingQueueSubmission(
        pendingQueueSubmission.pendingTimestamp,
      )

      console.log(
        'Successfully processed submission from the pending queue',
        pendingQueueSubmission,
      )
    } catch (error) {
      Sentry.captureException(error)
      console.error('Error processing submission from the pending queue', error)
      pendingQueueSubmission.isSubmitting = false
      if ((error as Error).message) {
        pendingQueueSubmission.error = (error as Error).message
      } else {
        pendingQueueSubmission.error =
          'An unknown error has occurred, which has prevented your Form from submitting. Please try again, or contact your Administrator if the problem persists.'
      }
      await updatePendingQueueSubmission(
        pendingQueueSubmission.pendingTimestamp,
        pendingQueueSubmission,
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
  schedulingUrlConfiguration,
}: {
  formSubmission: FormSubmission
  paymentReceiptUrl?: string
  schedulingUrlConfiguration?: {
    schedulingReceiptUrl: string
    schedulingCancelUrl: string
  }
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
    })
  }

  const data = await generateSubmissionCredentials(formSubmission)

  const formSubmissionResult: FormSubmissionResult = {
    ...formSubmission,
    payment: null,
    scheduling: null,
    isOffline: false,
    isInPendingQueue: false,
    submissionTimestamp: data.submissionTimestamp,
    submissionId: data.submissionId,
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

  await uploadFormSubmission(
    data,
    {
      formsAppId: formSubmission.formsAppId,
      definition: formSubmission.definition,
      submission: formSubmission.submission,
      submissionTimestamp: data.submissionTimestamp,
      keyId: formSubmission.keyId,
      ipAddress: data.ipAddress,
      user: data.userProfile,
    },
    {
      externalId: formSubmission.externalId || undefined,
      jobId: formSubmission.jobId || undefined,
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

async function goBackOrCloseWindow(): Promise<void> {
  if (window.history.length <= 1) {
    return closeWindow()
  } else {
    window.history.back()
  }
}

async function executeCancelAction(
  options: {
    definition: FormTypes.Form
    externalId: string | null
  },
  push: (url: string) => void,
): Promise<void> {
  const formSubmissionResult: FormSubmissionResult = {
    ...options,
    formsAppId: NaN,
    draftId: null,
    jobId: null,
    externalId: null,
    preFillFormDataId: null,
    captchaTokens: [],
    submission: {},
    isInPendingQueue: false,
    isOffline: false,
    payment: null,
    scheduling: null,
    submissionId: null,
    submissionTimestamp: null,
  }

  await executeAction(
    formSubmissionResult,
    formSubmissionResult.definition.cancelAction,
    formSubmissionResult.definition.cancelRedirectUrl,
    push,
  )
}

async function executePostSubmissionAction(
  submissionResult: FormSubmissionResult,
  push: (url: string) => void,
): Promise<void> {
  console.log('Attempting to run post submission action')
  let postSubmissionAction = submissionResult.definition.postSubmissionAction
  let redirectUrl = submissionResult.definition.redirectUrl

  if (submissionResult.scheduling) {
    postSubmissionAction = 'URL'
    redirectUrl = submissionResult.scheduling.bookingUrl
  } else if (submissionResult.payment) {
    postSubmissionAction = 'URL'
    redirectUrl = submissionResult.payment.hostedFormUrl
  }

  await executeAction(submissionResult, postSubmissionAction, redirectUrl, push)
}

async function executeAction(
  submissionResult: FormSubmissionResult,
  action: FormTypes.FormPostSubmissionAction,
  redirectUrl: string | undefined,
  push: (url: string) => void,
): Promise<void> {
  switch (action) {
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
    case 'BACK':
    default: {
      // if there's no post submission action for some reason, use prev. logic...
      return goBackOrCloseWindow()
    }
  }
}

export {
  submit,
  executePostSubmissionAction,
  executeCancelAction,
  goBackOrCloseWindow,
  getPendingQueueSubmissions,
  deletePendingQueueSubmission,
  registerPendingQueueListener,
  processPendingQueue,
  uploadAttachment,
  NewDraftSubmission,
  NewFormSubmission,
  DraftSubmission,
  FormSubmission,
  FormSubmissionResult,
  PendingFormSubmission,
}
