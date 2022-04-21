import { SubmissionEventTypes } from '@oneblink/types'
import { postRequest } from '../fetch'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import Sentry from '../../Sentry'
import { FormSubmissionResult } from '../../types/submissions'
import { submissionService } from '@oneblink/sdk-core'

function getBookingQuerystringValue(
  elementId: string | undefined,
  formSubmissionResult: FormSubmissionResult,
) {
  if (elementId) {
    const value = submissionService.getRootElementValueById(
      elementId,
      formSubmissionResult.definition.elements,
      formSubmissionResult.submission,
    )
    if (value && typeof value === 'string') {
      return value
    }
  }
}

function generateSchedulingConfiguration({
  formSubmissionResult,
  schedulingSubmissionEvent,
  schedulingUrlConfiguration: { schedulingReceiptUrl, schedulingCancelUrl },
}: {
  formSubmissionResult: FormSubmissionResult
  schedulingSubmissionEvent: SubmissionEventTypes.SchedulingSubmissionEvent
  schedulingUrlConfiguration: {
    schedulingReceiptUrl: string
    schedulingCancelUrl: string
  }
}): Promise<{ bookingUrl: string }> {
  const url = `${tenants.current.apiOrigin}/scheduling/generate-booking-url`
  const body = {
    formId: formSubmissionResult.definition.id,
    nylasSchedulingPageId:
      schedulingSubmissionEvent.configuration.nylasSchedulingPageId,
    submissionId: formSubmissionResult.submissionId,
    schedulingReceiptUrl,
    schedulingCancelUrl,
    name: getBookingQuerystringValue(
      schedulingSubmissionEvent.configuration.nameElementId,
      formSubmissionResult,
    ),
    email: getBookingQuerystringValue(
      schedulingSubmissionEvent.configuration.emailElementId,
      formSubmissionResult,
    ),
  }
  console.log('Attempting to generate scheduling configuration', url, body)
  return postRequest<{ bookingUrl: string }>(url, body).catch((error) => {
    Sentry.captureException(error)
    console.warn(
      'Error occurred while attempting to generate configuration for scheduling submission event',
      error,
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot make bookings until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to make bookings. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the configuration required to make a booking. Please contact your administrator to verify your configuration.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  })
}

/**
 * Cancel a booking
 *
 * #### Example
 *
 * ```js
 * await schedulingService.cancelSchedulingBooking({
 *   submissionId: '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
 *   nylasEditHash: '123abc321abcCBA456abcabc123456',
 *   reason: 'Busy at time of booking.',
 * })
 * // Booking Cancelled
 * ```
 *
 * @param details
 * @returns
 */
function cancelSchedulingBooking(details: {
  /** The unique identifier for the submission associated with the booking */
  submissionId: string
  /** The nylas edit hash associated with the booking */
  nylasEditHash: string
  /** Reason for cancelling the booking */
  reason: string
}): Promise<void> {
  const url = `${tenants.current.apiOrigin}/scheduling/cancel-booking`
  console.log('Attempting to cancel scheduling booking', url, details)

  return postRequest<void>(url, details).catch((error) => {
    Sentry.captureException(error)
    console.warn(
      'Error occurred while attempting to cancel scheduling booking',
      error,
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot cancel this booking until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to cancel bookings. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the booking to be cancelled. It may have already been cancelled, otherwise please contact your administrator.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  })
}

export { generateSchedulingConfiguration, cancelSchedulingBooking }
