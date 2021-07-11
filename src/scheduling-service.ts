import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  generateSchedulingConfiguration,
  cancelSchedulingBooking,
} from './services/api/scheduling'
import utilsService from './services/utils'
import { SubmissionEventTypes } from '@oneblink/types'
import { conditionalLogicService } from '@oneblink/sdk-core'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from './payment-service'
import { FormSubmissionResult, NewDraftSubmission } from './types/submissions'
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

function checkForSchedulingSubmissionEvent(
  newDraftSubmission: NewDraftSubmission,
): SubmissionEventTypes.SchedulingSubmissionEvent | undefined {
  const submissionEvents = newDraftSubmission.definition.submissionEvents || []
  for (const submissionEvent of submissionEvents) {
    if (
      submissionEvent.type === 'SCHEDULING' &&
      conditionalLogicService.evaluateConditionalPredicates({
        isConditional: !!submissionEvent.conditionallyExecute,
        requiresAllConditionalPredicates:
          !!submissionEvent.requiresAllConditionallyExecutePredicates,
        conditionalPredicates:
          submissionEvent.conditionallyExecutePredicates || [],
        submission: newDraftSubmission.submission,
        formElements: newDraftSubmission.definition.elements,
      })
    ) {
      console.log('Form has a scheduling submission event', submissionEvent)
      return submissionEvent
    }
  }
}

async function handleSchedulingSubmissionEvent({
  formSubmissionResult,
  schedulingSubmissionEvent,
  schedulingUrlConfiguration,
}: {
  formSubmissionResult: FormSubmissionResult
  schedulingSubmissionEvent: SubmissionEventTypes.SchedulingSubmissionEvent
  schedulingUrlConfiguration: {
    schedulingReceiptUrl: string
    schedulingCancelUrl: string
  }
}): Promise<FormSubmissionResult['scheduling']> {
  console.log(
    'Attempting to handle submission with scheduling submission event',
  )

  const { bookingUrl } = await generateSchedulingConfiguration({
    formSubmissionResult,
    schedulingSubmissionEvent,
    schedulingUrlConfiguration,
  })

  const scheduling = {
    submissionEvent: schedulingSubmissionEvent,
    bookingUrl,
  }
  console.log('Created scheduling configuration to start booking', scheduling)
  await utilsService.setLocalForageItem(KEY, {
    ...formSubmissionResult,
    scheduling,
  })

  return scheduling
}

async function handleCancelSchedulingBooking(details: {
  submissionId: string
  nylasEditHash: string
  reason: string
}) {
  return await cancelSchedulingBooking(details)
}

export {
  SchedulingBooking,
  handleSchedulingQuerystring,
  checkForSchedulingSubmissionEvent,
  handleSchedulingSubmissionEvent,
  cancelSchedulingBooking,
}
