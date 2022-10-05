import { isOffline } from './offline-service'
import { isLoggedIn } from './auth-service'
import {
  registerPendingQueueListener,
  getPendingQueueSubmissions,
  getFormSubmission,
  updatePendingQueueSubmission,
  deletePendingQueueSubmission,
  registerPendingQueueAttachmentProgressListener,
  registerPendingQueueProgressListener,
  executePendingQueueProgressListeners,
  removePendingQueueSubmission,
  PendingQueueListener,
  PendingQueueAction,
} from './services/pending-queue'
import { generateSubmissionCredentials } from './services/api/submissions'
import replaceCustomValues from './services/replace-custom-values'
import { FormTypes } from '@oneblink/types'
import Sentry from './Sentry'
import prepareSubmissionData from './services/prepareSubmissionData'
import submitForm, {
  SubmissionParams,
  ProgressListener,
  ProgressListenerEvent,
} from './services/submit'
import {
  PendingFormSubmission,
  FormSubmission,
  FormSubmissionResult,
  NewDraftSubmission,
  NewFormSubmission,
  DraftSubmission,
} from './types/submissions'
import { deleteAutoSaveData } from './auto-save-service'

let _isProcessingPendingQueue = false

/**
 * Force processing the pending queue. This must be called to process the
 * pending queue and is best used when the application comes back online.
 *
 * ### Example
 *
 * ```js
 * await submissionService.processPendingQueue()
 * ```
 *
 * @returns
 */
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
        'SUBMIT_STARTED',
      )

      const submission = await prepareSubmissionData(formSubmission)
      await submit({
        formSubmission: { ...formSubmission, submission },
        onProgress: (event) => {
          executePendingQueueProgressListeners({
            ...event,
            pendingTimestamp: pendingQueueSubmission.pendingTimestamp,
          })
        },
      })

      await removePendingQueueSubmission(
        pendingQueueSubmission.pendingTimestamp,
        'SUBMIT_SUCCEEDED',
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
        'SUBMIT_FAILED',
      )
    }
  }

  console.log(
    'Finished attempting to processing submissions in the pending queue.',
  )
  _isProcessingPendingQueue = false
}

/**
 * Submit a FormSubmission. Offline submissions will be added to a pending queue
 * and be processed using the `processPendingQueue()` function. FormSubmissions
 * with payment submission events will return the FormSubmissionResult with a
 * `payment` property set, this should be used to redirect the user to the
 * payment URL. Will also handle cleaning up auto save data (if the
 * `autoSaveKey` property is passed), locally stored drafts and prefill data.
 *
 * ### Example
 *
 * ```js
 * const formSubmission = {
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here',
 *   },
 *   definition: OneBlinkForm,
 *   captchaTokens: [],
 *   draftId: '2974602c-2c5b-4b46-b086-87ee9b2aa233',
 *   jobId: 'bb37d1da-9cda-4950-a36a-22f58b25de3a',
 *   preFillFormDataId: '7763f828-4aaf-49dc-9c1b-e2eeea8fa990',
 *   externalId: 'external-id-set-by-developer',
 * }
 *
 * // Pass paymentReceiptUrl if submission may require a payment
 * const paymentReceiptUrl = `${window.location.origin}/payment-receipt`
 *
 * // Pass schedulingBookingUrlConfiguration if submission utilise scheduling
 * const schedulingBookingUrlConfiguration = {
 *   schedulingReceiptUrl: 'https://my-website.com/receipt',
 *   schedulingCancelUrl: 'https://my-website.com/cancel',
 * }
 * const submissionResult = await submissionService.submit({
 *   formSubmission,
 *   paymentReceiptUrl,
 *   schedulingBookingUrlConfiguration,
 * })
 *
 * if (submissionResult.scheduling) {
 *   // Redirect user to booking form
 *   window.location.href = submissionResult.scheduling.bookingUrl
 *   return
 * }
 *
 * if (submissionResult.payment) {
 *   // Redirect user to payment form
 *   window.location.href = submissionResult.payment.hostedFormUrl
 *   return
 * }
 *
 * if (submissionResult.isOffline) {
 *   if (submissionResult.isInPendingQueue) {
 *     // Display message to user that the submission
 *     // has been added to the pending queue
 *   } else {
 *     // Display message to user that this submission can
 *     // not be processed while offline (most likely because it requires a payment)
 *   }
 *   return
 * }
 *
 * // submissionResult.submissionId and submissionResult.submissionTimestamp
 * // will be set if the submission was successful
 * ```
 *
 * @param params
 * @returns
 */
async function submit({
  autoSaveKey,
  ...params
}: SubmissionParams & {
  autoSaveKey?: string
  onProgress?: ProgressListener
}): Promise<FormSubmissionResult> {
  const formSubmissionResult = await submitForm({
    ...params,
    generateCredentials: generateSubmissionCredentials,
  })
  if (typeof autoSaveKey === 'string') {
    try {
      await deleteAutoSaveData(params.formSubmission.definition.id, autoSaveKey)
    } catch (error) {
      console.warn('Error removing auto save data: ', error)
      Sentry.captureException(error)
    }
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

/**
 * Go back in the browser history or attempts to close the browser tab if there
 * is no history.
 *
 * ### Example
 *
 * ```js
 * try {
 *   await submissionService.goBackOrCloseWindow()
 * } catch (error) {
 *   // Handle error while closing browser tab.
 *   // Display message to user to close it manually
 * }
 * ```
 *
 * @returns
 */
async function goBackOrCloseWindow(): Promise<void> {
  if (window.history.length <= 1) {
    return closeWindow()
  } else {
    window.history.back()
  }
}

/**
 * Action to cancel completing a form, currently goes back in the browser
 * history or attempts to close the browser tab if there is no history.
 *
 * ### Example
 *
 * ```js
 * const options = {
 *   definition: OneBlinkForm,
 *   externalId: 'external-id-set-by-developer',
 * }
 * // Only used for relative URLs
 * const pushRelativePath = (path) => {
 *   window.location.href = path
 * }
 * try {
 *   await submissionService.executeCancelAction(options, pushRelativePath)
 * } catch (error) {
 *   // Handle error while closing browser tab.
 *   // Display message to user to close it manually
 * }
 * ```
 *
 * @param options
 * @param push
 */
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
    isUploadingAttachments: false,
  }

  await executeAction(
    formSubmissionResult,
    formSubmissionResult.definition.cancelAction,
    formSubmissionResult.definition.cancelRedirectUrl,
    push,
  )
}

/**
 * Execute the post submission action for a form after a successful form submission.
 *
 * ### Example
 *
 * ```js
 * const formSubmissionResult = {
 *   submissionId: '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
 *   submissionTimestamp: '2020-07-29T01:03:26.573Z'
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here'
 *   },
 *   definition: OneBlinkForm,
 *   payment: {
 *     hostedFormUrl: 'https://payment.com/transaction'
 *   },
 *   draftId: '2974602c-2c5b-4b46-b086-87ee9b2aa233',
 *   jobId: 'bb37d1da-9cda-4950-a36a-22f58b25de3a',
 *   preFillFormDataId: '7763f828-4aaf-49dc-9c1b-e2eeea8fa990',
 *   externalId: 'external-id-set-by-developer',
 * }
 * // Only used for relative URLs
 * const pushRelativePath = (path) => {
 *   window.location.href = path
 * }
 * try {
 *   await submissionService.executePostSubmissionAction(formSubmissionResult, pushRelativePath)
 * } catch (error) {
 *   // Handle error while closing browser tab.
 *   // Display message to user to close it manually
 * }
 * ```
 *
 * @param submissionResult
 * @param push
 */
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
  NewDraftSubmission,
  NewFormSubmission,
  DraftSubmission,
  FormSubmission,
  FormSubmissionResult,
  PendingFormSubmission,
  SubmissionParams,
  registerPendingQueueAttachmentProgressListener,
  registerPendingQueueProgressListener,
  ProgressListener,
  ProgressListenerEvent,
  PendingQueueListener,
  PendingQueueAction,
}
