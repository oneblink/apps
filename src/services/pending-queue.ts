import OneBlinkAppsError from './errors/oneBlinkAppsError'
import utilsService from './utils'
import Sentry from '../Sentry'
import { FormSubmission, PendingFormSubmission } from '../types/submissions'
import { ProgressListener, ProgressListenerEvent } from './s3Submit'

function errorHandler(error: Error): Error {
  Sentry.captureException(error)
  console.error('Local Forage Error', error)
  if (/The serialized value is too large/.test(error.message)) {
    return new OneBlinkAppsError(
      'It seems you have run out of space. To free up space, please connect to the internet to process pending submissions.',
      {
        originalError: error,
      },
    )
  }

  return error
}

export type PendingQueueAction =
  | 'SUBMIT_STARTED'
  | 'SUBMIT_FAILED'
  | 'SUBMIT_SUCCEEDED'
  | 'ADDITION'
  | 'DELETION'
export type PendingQueueListener = (
  results: PendingFormSubmission[],
  action: PendingQueueAction,
) => unknown
const pendingQueueListeners: Array<PendingQueueListener> = []

/**
 * Register a listener function that will be passed an array of
 * PendingFormSubmissions when the pending queue is modified.
 *
 * ### Example
 *
 * ```js
 * const listener = async (pendingSubmissions) => {
 *   // use pending submissions here...
 * }
 * const deregister = await submissionService.registerPendingQueueListener(
 *   listener,
 * )
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param listener
 * @returns
 */
export function registerPendingQueueListener(
  listener: PendingQueueListener,
): () => void {
  pendingQueueListeners.push(listener)

  return () => {
    const index = pendingQueueListeners.indexOf(listener)
    if (index !== -1) {
      pendingQueueListeners.splice(index, 1)
    }
  }
}

function executePendingQueueListeners(
  newSubmissions: PendingFormSubmission[],
  action: PendingQueueAction,
) {
  console.log(
    'Pending Queue submissions have been updated',
    action,
    newSubmissions,
  )
  for (const pendingQueueListener of pendingQueueListeners) {
    pendingQueueListener(newSubmissions, action)
  }
}

export async function addFormSubmissionToPendingQueue(
  formSubmission: FormSubmission,
) {
  const pendingTimestamp = new Date().toISOString()
  try {
    await utilsService.setLocalForageItem(
      `SUBMISSION_${pendingTimestamp}`,
      formSubmission,
    )
    const submissions: PendingFormSubmission[] =
      await getPendingQueueSubmissions()
    submissions.push({
      ...formSubmission,
      pendingTimestamp,
      submission: undefined,
    } as PendingFormSubmission)
    await utilsService.localForage.setItem('submissions', submissions)
    executePendingQueueListeners(submissions, 'ADDITION')
  } catch (error) {
    Sentry.captureException(error)
    throw error instanceof Error ? errorHandler(error) : error
  }
}

export async function updatePendingQueueSubmission(
  pendingTimestamp: string,
  newSubmission: PendingFormSubmission,
  action: 'SUBMIT_FAILED' | 'SUBMIT_STARTED',
) {
  try {
    const submissions = await getPendingQueueSubmissions()
    const newSubmissions = submissions.map((submission) => {
      if (submission.pendingTimestamp === pendingTimestamp) {
        return newSubmission
      }
      return submission
    })
    await utilsService.localForage.setItem('submissions', newSubmissions)
    executePendingQueueListeners(newSubmissions, action)
  } catch (error) {
    Sentry.captureException(error)
    throw error instanceof Error ? errorHandler(error) : error
  }
}

/**
 * Get an array of PendingFormSubmission
 *
 * ### Example
 *
 * ```js
 * const pendingSubmission =
 *   await submissionService.getPendingQueueSubmissions()
 * // Display pending submissions to user...
 * ```
 *
 * @returns
 */
export function getPendingQueueSubmissions(): Promise<PendingFormSubmission[]> {
  return utilsService.localForage
    .getItem('submissions')
    .then((submissions) => (Array.isArray(submissions) ? submissions : []))
}

export function getFormSubmission(
  pendingTimestamp: string,
): Promise<FormSubmission | null> {
  return utilsService.getLocalForageItem(`SUBMISSION_${pendingTimestamp}`)
}

/**
 * Delete a PendingFormSubmission before it is processed based on the
 * `pendingTimestamp` property.
 *
 * ### Example
 *
 * ```js
 * const pendingTimestamp = '2020-07-29T01:03:26.573Z'
 * await submissionService.deletePendingQueueSubmission(pendingTimestamp)
 * ```
 *
 * @param pendingTimestamp
 */
export async function deletePendingQueueSubmission(pendingTimestamp: string) {
  await removePendingQueueSubmission(pendingTimestamp, 'DELETION')
}

export async function removePendingQueueSubmission(
  pendingTimestamp: string,
  action: 'SUBMIT_SUCCEEDED' | 'DELETION',
) {
  try {
    await utilsService.removeLocalForageItem(`SUBMISSION_${pendingTimestamp}`)
    const submissions = await getPendingQueueSubmissions()
    const newSubmissions = submissions.filter(
      (submission) => submission.pendingTimestamp !== pendingTimestamp,
    )
    await utilsService.localForage.setItem('submissions', newSubmissions)
    executePendingQueueListeners(newSubmissions, action)
  } catch (error) {
    Sentry.captureException(error)
    throw error instanceof Error ? errorHandler(error) : error
  }
}

const pendingQueueAttachmentProgressListeners: Array<{
  attachmentId: string
  listener: ProgressListener
}> = []

/**
 * Register a listener function that will be passed a progress event when an
 * attachment for an item in the pending queue is being processed.
 *
 * ### Example
 *
 * ```js
 * const listener = async ({ progress }) => {
 *   // update the UI to reflect the progress here...
 * }
 * const deregister =
 *   await submissionService.registerPendingQueueAttachmentProgressListener(
 *     attachment.id,
 *     listener,
 *   )
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param attachmentId
 * @param listener
 * @returns
 */
export function registerPendingQueueAttachmentProgressListener(
  attachmentId: string,
  listener: ProgressListener,
): () => void {
  const item = { attachmentId, listener }
  pendingQueueAttachmentProgressListeners.push(item)

  return () => {
    const index = pendingQueueAttachmentProgressListeners.indexOf(item)
    if (index !== -1) {
      pendingQueueAttachmentProgressListeners.splice(index, 1)
    }
  }
}

export function executePendingQueueAttachmentProgressListeners(
  event: ProgressListenerEvent & {
    attachmentId: string
  },
) {
  for (const pendingQueueAttachmentProgressListener of pendingQueueAttachmentProgressListeners) {
    if (
      event.attachmentId === pendingQueueAttachmentProgressListener.attachmentId
    ) {
      pendingQueueAttachmentProgressListener.listener(event)
    }
  }
}

const pendingQueueProgressListeners: Array<{
  pendingTimestamp: string
  listener: ProgressListener
}> = []

/**
 * Register a listener function that will be passed a progress event when an
 * item in the pending queue is being processed.
 *
 * ### Example
 *
 * ```js
 * const listener = async ({ progress }) => {
 *   // update the UI to reflect the progress here...
 * }
 * const deregister =
 *   await submissionService.registerPendingQueueProgressListener(
 *     pendingQueueItem.pendingTimestamp,
 *     listener,
 *   )
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param pendingTimestamp
 * @param listener
 * @returns
 */
export function registerPendingQueueProgressListener(
  pendingTimestamp: string,
  listener: ProgressListener,
): () => void {
  const item = { pendingTimestamp, listener }
  pendingQueueProgressListeners.push(item)

  return () => {
    const index = pendingQueueProgressListeners.indexOf(item)
    if (index !== -1) {
      pendingQueueProgressListeners.splice(index, 1)
    }
  }
}

export function executePendingQueueProgressListeners(
  event: ProgressListenerEvent & {
    pendingTimestamp: string
  },
) {
  for (const pendingQueueProgressListener of pendingQueueProgressListeners) {
    if (
      event.pendingTimestamp === pendingQueueProgressListener.pendingTimestamp
    ) {
      pendingQueueProgressListener.listener(event)
    }
  }
}
