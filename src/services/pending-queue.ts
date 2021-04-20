import OneBlinkAppsError from './errors/oneBlinkAppsError'
import utilsService from './utils'
import { SubmissionTypes } from '@oneblink/types'
import Sentry from '../Sentry'

type PendingFormSubmissionResultWithOptionalSubmission = Pick<
  SubmissionTypes.PendingFormSubmissionResult,
  Exclude<keyof SubmissionTypes.PendingFormSubmissionResult, 'submission'>
> & {
  submission?: SubmissionTypes.PendingFormSubmissionResult['submission']
}

function errorHandler(error: Error) {
  console.error('Local Forage Error', error)
  if (/The serialized value is too large/.test(error.message)) {
    throw new OneBlinkAppsError(
      'It seems you have run out of space. To free up space, please connect to the internet to process pending submissions.',
    )
  }

  throw error
}

const pendingQueueListeners: Array<
  (results: PendingFormSubmissionResultWithOptionalSubmission[]) => unknown
> = []

export function registerPendingQueueListener(
  listener: (
    results: PendingFormSubmissionResultWithOptionalSubmission[],
  ) => unknown,
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
  newSubmissions: PendingFormSubmissionResultWithOptionalSubmission[],
) {
  console.log('Pending Queue submissions have been updated', newSubmissions)
  for (const pendingQueueListener of pendingQueueListeners) {
    pendingQueueListener(newSubmissions)
  }
}

export async function addSubmissionToPendingQueue(
  formSubmissionResult: SubmissionTypes.PendingFormSubmissionResult,
) {
  try {
    await utilsService.setLocalForageItem(
      `SUBMISSION_${formSubmissionResult.pendingTimestamp}`,
      formSubmissionResult,
    )
    const submissions: PendingFormSubmissionResultWithOptionalSubmission[] = await getPendingQueueSubmissions()
    submissions.push({
      ...formSubmissionResult,
      submission: undefined,
    })
    await utilsService.localForage.setItem('submissions', submissions)
    executePendingQueueListeners(submissions)
  } catch (error) {
    Sentry.captureException(error)
    errorHandler(error)
  }
}

export async function updatePendingQueueSubmission(
  pendingTimestamp: string,
  newSubmission: SubmissionTypes.PendingFormSubmissionResult,
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
    errorHandler(error)
  }
}

export function getPendingQueueSubmissions(): Promise<
  SubmissionTypes.PendingFormSubmissionResult[]
> {
  return utilsService.localForage
    .getItem('submissions')
    .then((submissions) => (Array.isArray(submissions) ? submissions : []))
}

export function getPendingQueueSubmission(
  pendingTimestamp: string,
): Promise<SubmissionTypes.PendingFormSubmissionResult | null> {
  return utilsService.getLocalForageItem(`SUBMISSION_${pendingTimestamp}`)
}

export async function deletePendingQueueSubmission(pendingTimestamp: string) {
  try {
    await utilsService.removeLocalForageItem(`SUBMISSION_${pendingTimestamp}`)
    const submissions = await getPendingQueueSubmissions()
    const newSubmissions = submissions.filter(
      (submission: SubmissionTypes.PendingFormSubmissionResult) =>
        submission.pendingTimestamp !== pendingTimestamp,
    )
    await utilsService.localForage.setItem('submissions', newSubmissions)
    executePendingQueueListeners(newSubmissions)
  } catch (error) {
    Sentry.captureException(error)
    errorHandler(error)
  }
}
