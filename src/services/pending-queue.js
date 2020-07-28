// @flow
'use strict'

import $localForage from 'localforage'

import OneBlinkAppsError from './errors/oneBlinkAppsError'
import utilsService from './utils'

function errorHandler(error) {
  console.error('Local Forage Error', error)
  if (/The serialized value is too large/.test(error.message)) {
    throw new OneBlinkAppsError(
      'It seems you have run out of space. To free up space, please connect to the internet to process pending submissions.'
    )
  }

  throw error
}

const pendingQueueListeners = []

export function registerPendingQueueListener(
  listener /* : (PendingFormSubmissionResult[]) => mixed */
) /* : () => void */ {
  pendingQueueListeners.push(listener)

  return () => {
    const index = pendingQueueListeners.indexOf(listener)
    if (index !== -1) {
      pendingQueueListeners.splice(index, 1)
    }
  }
}

function executePendingQueueListeners(newSubmissions) {
  console.log('Pending Queue submissions have been updated', newSubmissions)
  for (const pendingQueueListener of pendingQueueListeners) {
    pendingQueueListener(newSubmissions)
  }
}

export async function addSubmissionToPendingQueue(
  formSubmissionResult /* : PendingFormSubmissionResult */
) {
  try {
    await utilsService.setLocalForageItem(
      `SUBMISSION_${formSubmissionResult.pendingTimestamp}`,
      formSubmissionResult
    )
    const submissions /* : Object[] */ = await getPendingQueueSubmissions()
    submissions.push({
      ...formSubmissionResult,
      submission: undefined,
    })
    await $localForage.setItem('submissions', submissions)
    executePendingQueueListeners(submissions)
  } catch (error) {
    errorHandler(error)
  }
}

export async function updatePendingQueueSubmission(
  pendingTimestamp /* : string */,
  newSubmission /* : PendingFormSubmissionResult */
) {
  try {
    const submissions = await getPendingQueueSubmissions()
    const newSubmissions = submissions.map((submission) => {
      if (submission.pendingTimestamp === pendingTimestamp) {
        return newSubmission
      }
      return submission
    })
    await $localForage.setItem('submissions', newSubmissions)
    executePendingQueueListeners(newSubmissions)
  } catch (error) {
    errorHandler(error)
  }
}

export function getPendingQueueSubmissions() /* : Promise<PendingFormSubmissionResult[]> */ {
  return $localForage
    .getItem('submissions')
    .then((submissions) => (Array.isArray(submissions) ? submissions : []))
}

export function getPendingQueueSubmission(pendingTimestamp /* : string */) {
  return utilsService.getLocalForageItem(`SUBMISSION_${pendingTimestamp}`)
}

export async function deletePendingQueueSubmission(
  pendingTimestamp /* : string */
) {
  try {
    await utilsService.removeLocalForageItem(`SUBMISSION_${pendingTimestamp}`)
    const submissions = await getPendingQueueSubmissions()
    const newSubmissions = submissions.filter(
      (submission /* : PendingFormSubmissionResult */) =>
        submission.pendingTimestamp !== pendingTimestamp
    )
    await $localForage.setItem('submissions', newSubmissions)
    executePendingQueueListeners(newSubmissions)
  } catch (error) {
    errorHandler(error)
  }
}
