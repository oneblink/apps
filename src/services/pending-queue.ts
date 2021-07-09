import OneBlinkAppsError from './errors/oneBlinkAppsError'
import utilsService from './utils'
import Sentry from '../Sentry'
import { FormSubmission, PendingFormSubmission } from '../types/submissions'

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

const pendingQueueListeners: Array<
  (results: PendingFormSubmission[]) => unknown
> = []

export function registerPendingQueueListener(
  listener: (results: PendingFormSubmission[]) => unknown,
): () => void {
  pendingQueueListeners.push(listener)

  return () => {
    const index = pendingQueueListeners.indexOf(listener)
    if (index !== -1) {
      pendingQueueListeners.splice(index, 1)
    }
  }
}

function executePendingQueueListeners(newSubmissions: PendingFormSubmission[]) {
  console.log('Pending Queue submissions have been updated', newSubmissions)
  for (const pendingQueueListener of pendingQueueListeners) {
    pendingQueueListener(newSubmissions)
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
    executePendingQueueListeners(submissions)
  } catch (error) {
    Sentry.captureException(error)
    throw errorHandler(error)
  }
}

export async function updatePendingQueueSubmission(
  pendingTimestamp: string,
  newSubmission: PendingFormSubmission,
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
    executePendingQueueListeners(newSubmissions)
  } catch (error) {
    Sentry.captureException(error)
    throw errorHandler(error)
  }
}

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

export async function deletePendingQueueSubmission(pendingTimestamp: string) {
  try {
    await utilsService.removeLocalForageItem(`SUBMISSION_${pendingTimestamp}`)
    const submissions = await getPendingQueueSubmissions()
    const newSubmissions = submissions.filter(
      (submission) => submission.pendingTimestamp !== pendingTimestamp,
    )
    await utilsService.localForage.setItem('submissions', newSubmissions)
    executePendingQueueListeners(newSubmissions)
  } catch (error) {
    Sentry.captureException(error)
    throw errorHandler(error)
  }
}
