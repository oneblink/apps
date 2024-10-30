import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  cancelSchedulingBooking,
  createNylasSession,
} from './services/api/scheduling'
import utilsService from './services/utils'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from './payment-service'
import { FormSubmissionResult } from './types/submissions'
import { KEY } from './services/schedulingHandlers'

type SchedulingBooking = {
  /** The unique identifier for the submission associated with the booking */
  submissionId: string
  /** Date and time the booking starts */
  startTime: Date
  /** Date and time the booking ends */
  endTime: Date
  /** Location of booking */
  location: string
  /** `true` if the booking has been rescheduled, otherwise `false` */
  isReschedule: boolean
}

/**
 * Pass in query string parameters after a redirect back to your app after a
 * booking is processed. Will return a SchedulingBooking and the submission
 * result from the original submission before redirecting to
 * `scheduling.bookingUrl`. If the booking has been rescheduled, the submission
 * result will not be returned.
 *
 * #### Example
 *
 * ```js
 * import queryString from 'query-string'
 *
 * const query = queryString.parse(window.location.search)
 *
 * const { booking, formSubmissionResult } =
 *   await schedulingService.handleSchedulingQuerystring(query)
 * ```
 *
 * @param options
 * @returns
 */
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
      paymentReceiptUrl: string | undefined
      paymentFormUrl: string | undefined
    } | null>(KEY)
  // If the current transaction does not match the submission
  // we will display message to user indicating
  // they are looking for the wrong transaction receipt.
  if (!schedulingSubmissionResultConfiguration) {
    throw new OneBlinkAppsError(
      'It looks like you are attempting to view a scheduling receipt for an unknown booking.',
    )
  }

  const { formSubmissionResult, paymentReceiptUrl, paymentFormUrl } =
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
        paymentFormUrl,
      })
    }
  }

  await utilsService.removeLocalForageItem(KEY)

  return {
    formSubmissionResult,
    booking,
  }
}

/**
 * Pass in query string parameters after navigation to your app via a valid
 * cancellation link.
 *
 * #### Example
 *
 * ```js
 * import queryString from 'query-string'
 *
 * const query = queryString.parse(window.location.search)
 *
 * const bookingToCancel =
 *   await schedulingService.handleCancelSchedulingBookingQuerystring(query)
 * ```
 *
 * @param options
 * @returns
 */
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
  /** The nylas edit hash associated with the booking */
  nylasEditHash: string
  /** The unique identifier for the submission associated with the booking */
  submissionId: string
  /** The start time of the booking */
  startTime: Date
  /** The end time of the booking */
  endTime: Date
  /** The event name */
  eventName: string
  /** The location of the event */
  location: string
  /** The timezone the booking was booked in */
  timezone: string
  /**
   * The policy to display to users when asked why they are cancelling the
   * booking
   */
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
  createNylasSession,
  handleCancelSchedulingBookingQuerystring,
}
