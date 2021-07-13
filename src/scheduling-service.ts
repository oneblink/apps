import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { cancelSchedulingBooking } from './services/api/scheduling'
import utilsService from './services/utils'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from './payment-service'
import { FormSubmissionResult } from './types/submissions'
const KEY = 'SCHEDULING_SUBMISSION_RESULT'

type SchedulingBooking = {
  submissionId: string
  startTime: Date
  endTime: Date
  location: string
  isReschedule: boolean
}

async function handleSchedulingQuerystring({
  start_time,
  end_time,
  location,
  submissionId,
  isReschedule,
}: Record<string, unknown>): Promise<{
  booking: SchedulingBooking
  formSubmissionResult?: FormSubmissionResult
}> {
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
  const booking = {
    submissionId,
    startTime: new Date(parseInt(start_time) * 1000),
    endTime: new Date(parseInt(end_time) * 1000),
    location,
    isReschedule: isReschedule === 'true',
  }
  console.log('Parsed booking result', booking)

  if (isReschedule) {
    return {
      booking,
    }
  }

  const schedulingSubmissionResultConfiguration =
    await utilsService.getLocalForageItem<{
      formSubmissionResult: FormSubmissionResult
      paymentReceiptUrl?: string
    } | null>(KEY)
  // If the current transaction does not match the submission
  // we will display message to user indicating
  // they are looking for the wrong transaction receipt.
  if (!schedulingSubmissionResultConfiguration) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for an unknown booking.',
    )
  }

  const { formSubmissionResult, paymentReceiptUrl } =
    schedulingSubmissionResultConfiguration
  if (
    !formSubmissionResult ||
    !formSubmissionResult.scheduling ||
    !formSubmissionResult.scheduling.submissionEvent
  ) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for a misconfigured booking.',
    )
  }

  if (formSubmissionResult.submissionId !== submissionId) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for the incorrect booking.',
    )
  }

  if (paymentReceiptUrl) {
    const paymentSubmissionEventConfiguration =
      checkForPaymentSubmissionEvent(formSubmissionResult)
    if (paymentSubmissionEventConfiguration) {
      formSubmissionResult.payment = await handlePaymentSubmissionEvent({
        ...paymentSubmissionEventConfiguration,
        formSubmissionResult,
        paymentReceiptUrl,
      })
    }
  }

  await utilsService.removeLocalForageItem(KEY)

  return {
    formSubmissionResult,
    booking,
  }
}

function handleCancelSchedulingBookingQuerystring({
  nylasEditHash,
  submissionId,
  startTime,
  endTime,
  eventName,
  location,
  timezone,
  cancellationPolicy,
}: Record<string, unknown>): {
  nylasEditHash: string
  submissionId: string
  startTime: Date
  endTime: Date
  eventName: string
  location: string
  timezone: string
  cancellationPolicy?: string
} {
  if (
    typeof submissionId !== 'string' ||
    typeof nylasEditHash !== 'string' ||
    typeof startTime !== 'string' ||
    typeof endTime !== 'string' ||
    typeof eventName !== 'string' ||
    typeof location !== 'string' ||
    typeof timezone !== 'string' ||
    (typeof cancellationPolicy !== 'string' && cancellationPolicy !== undefined)
  ) {
    throw new OneBlinkAppsError(
      'Scheduling bookings cannot be cancelled unless navigating here from the correct link.',
    )
  }

  const booking = {
    nylasEditHash,
    submissionId,
    startTime: new Date(parseInt(startTime) * 1000),
    endTime: new Date(parseInt(endTime) * 1000),
    eventName,
    location,
    timezone,
    cancellationPolicy,
  }
  console.log('Parsed scheduling booking cancel data', booking)

  return booking
}

export {
  SchedulingBooking,
  handleSchedulingQuerystring,
  cancelSchedulingBooking,
  handleCancelSchedulingBookingQuerystring,
}
