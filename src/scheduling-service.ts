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
  formSubmissionResult: FormSubmissionResult
}> {
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

export {
  SchedulingBooking,
  handleSchedulingQuerystring,
  cancelSchedulingBooking,
}
