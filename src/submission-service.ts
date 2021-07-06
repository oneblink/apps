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
import { generateSubmissionCredentials } from './services/api/submissions'
import { uploadFormSubmission } from './services/s3Submit'
import uploadAttachment from './services/uploadAttachment'
import { deleteDraft } from './draft-service'
import { removePrefillFormData } from './prefill-service'
import replaceCustomValues from './services/replace-custom-values'
import recentlySubmittedJobsService from './services/recently-submitted-jobs'
import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { getUserToken } from './services/user-token'
import Sentry from './Sentry'
import prepareSubmissionData from './services/prepareSubmissionData'
import { conditionalLogicService } from '@oneblink/sdk-core'
import { handleSchedulingSubmissionEvent } from './scheduling-service'

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
      const existingSubmission = await getPendingQueueSubmission(
        pendingQueueSubmission.pendingTimestamp,
      )
      if (!existingSubmission) {
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

      const submission = await prepareSubmissionData(existingSubmission)
      await submit({ formSubmission: { ...existingSubmission, submission } })

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
      if (error.message) {
        pendingQueueSubmission.error = error.message
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
  schedulingReceiptUrl,
}: {
  formSubmission: SubmissionTypes.FormSubmission
  paymentReceiptUrl?: string
  schedulingReceiptUrl?: string
}): Promise<SubmissionTypes.FormSubmissionResult> {
  formSubmission.keyId = getFormsKeyId() || undefined
  const submissionEvents = formSubmission.definition.submissionEvents || []
  const paymentSubmissionEvent = submissionEvents.reduce(
    (
      p: SubmissionEventTypes.PaymentSubmissionEvent | null,
      submissionEvent,
    ) => {
      if (p) {
        return p
      }
      if (
        (submissionEvent.type === 'CP_PAY' ||
          submissionEvent.type === 'BPOINT' ||
          submissionEvent.type === 'WESTPAC_QUICK_WEB') &&
        conditionalLogicService.evaluateConditionalPredicates({
          isConditional: !!submissionEvent.conditionallyExecute,
          requiresAllConditionalPredicates:
            !!submissionEvent.requiresAllConditionallyExecutePredicates,
          conditionalPredicates:
            submissionEvent.conditionallyExecutePredicates || [],
          submission: formSubmission.submission,
          formElements: formSubmission.definition.elements,
        })
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

  const schedulingSubmissionEvent = submissionEvents.reduce(
    (
      memo: SubmissionEventTypes.SchedulingSubmissionEvent | null,
      submissionEvent,
    ) => {
      if (memo) {
        return memo
      }
      if (
        submissionEvent.type === 'SCHEDULING' &&
        conditionalLogicService.evaluateConditionalPredicates({
          isConditional: !!submissionEvent.conditionallyExecute,
          requiresAllConditionalPredicates:
            !!submissionEvent.requiresAllConditionallyExecutePredicates,
          conditionalPredicates:
            submissionEvent.conditionallyExecutePredicates || [],
          submission: formSubmission.submission,
          formElements: formSubmission.definition.elements,
        })
      ) {
        return submissionEvent
      }
      return memo
    },
    null,
  )
  if (schedulingSubmissionEvent) {
    console.log(
      'Form has a scheduling submission event',
      schedulingSubmissionEvent,
    )
  }

  if (isOffline()) {
    if (paymentSubmissionEvent || schedulingSubmissionEvent) {
      console.log(
        'Offline - form has a payment/scheduling submission event that has not been processed yet, return offline',
        { paymentSubmissionEvent, schedulingSubmissionEvent },
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
      scheduling: null,
    })
  }

  const data = await generateSubmissionCredentials(formSubmission)

  const formSubmissionResult = {
    ...formSubmission,
    payment: null,
    scheduling: null,
    isOffline: false,
    isInPendingQueue: false,
    submissionTimestamp: data.submissionTimestamp,
    submissionId: data.submissionId,
  }

  let schedulingSubmissionResult:
    | SubmissionTypes.FormSubmissionResult
    | undefined = undefined
  if (schedulingSubmissionEvent && schedulingReceiptUrl) {
    schedulingSubmissionResult = await handleSchedulingSubmissionEvent({
      formSubmissionResult,
      schedulingSubmissionEvent,
      schedulingReceiptUrl,
    })
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

  if (schedulingSubmissionResult) {
    return schedulingSubmissionResult
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
  const formSubmissionResult: SubmissionTypes.FormSubmissionResult = {
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
  submissionResult: SubmissionTypes.FormSubmissionResult,
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
  submissionResult: SubmissionTypes.FormSubmissionResult,
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
}
