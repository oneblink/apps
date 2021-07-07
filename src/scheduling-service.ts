import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { generateSchedulingConfiguration } from './services/api/scheduling'
import utilsService from './services/utils'
import { SubmissionTypes, SubmissionEventTypes } from '@oneblink/types'

const KEY = 'SCHEDULING_SUBMISSION_RESULT'

type SchedulingBooking = {
  startTime: Date
  endTime: Date
  location: string
}

async function handleSchedulingQuerystring({
  start_time,
  end_time,
  location,
  submissionId,
}: Record<string, unknown>): Promise<{
  booking: SchedulingBooking
  formSubmissionResult: SubmissionTypes.FormSubmissionResult
}> {
  const formSubmissionResult =
    await utilsService.getLocalForageItem<SubmissionTypes.FormSubmissionResult | null>(
      KEY,
    )
  // If the current transaction does not match the submission
  // we will display message to user indicating
  // they are looking for the wrong transaction receipt.
  if (!formSubmissionResult) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for an unknown booking.',
    )
  }
  if (
    !formSubmissionResult.scheduling ||
    !formSubmissionResult.scheduling.submissionEvent
  ) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for a misconfigured booking.',
    )
  }

  if (
    typeof submissionId !== 'string' ||
    typeof start_time !== 'string' ||
    typeof end_time !== 'string' ||
    typeof location !== 'string'
  ) {
    throw new OneBlinkAppsError(
      'Scheduling receipts cannot be displayed unless navigating here directly after a booking.',
    )
  }

  if (formSubmissionResult.submissionId !== submissionId) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for the incorrect booking.',
    )
  }

  await utilsService.removeLocalForageItem(KEY)

  const booking = {
    startTime: new Date(parseInt(start_time) * 1000),
    endTime: new Date(parseInt(end_time) * 1000),
    location,
  }
  console.log('Parsed booking result', booking)

  return {
    formSubmissionResult,
    booking,
  }
}

async function handleSchedulingSubmissionEvent({
  formSubmissionResult,
  schedulingSubmissionEvent,
  schedulingReceiptUrl,
}: {
  formSubmissionResult: SubmissionTypes.FormSubmissionResult
  schedulingSubmissionEvent: SubmissionEventTypes.SchedulingSubmissionEvent
  schedulingReceiptUrl: string
}): Promise<SubmissionTypes.FormSubmissionResult> {
  console.log('Attempting to handle submission with scheduling submission event')

  const { bookingUrl } = await generateSchedulingConfiguration({
    formSubmissionResult,
    schedulingSubmissionEvent,
    schedulingReceiptUrl,
  })

  const scheduling = {
    submissionEvent: schedulingSubmissionEvent,
    bookingUrl,
  }
  console.log('Created scheduling configuration to start booking', scheduling)
  const submissionResult = {
    ...formSubmissionResult,
    scheduling,
  }

  await utilsService.setLocalForageItem(KEY, submissionResult)

  return submissionResult
}

export {
  SchedulingBooking,
  handleSchedulingQuerystring,
  handleSchedulingSubmissionEvent,
}
