import { generateSchedulingConfiguration } from './api/scheduling'
import utilsService from './utils'
import { SubmissionEventTypes } from '@oneblink/types'
import { schedulingService } from '@oneblink/sdk-core'
import {
  FormSubmissionResult,
  BaseNewFormSubmission,
} from '../types/submissions'

const KEY = 'SCHEDULING_SUBMISSION_RESULT'
type SchedulingSubmissionResult = {
  formSubmissionResult: FormSubmissionResult
  paymentReceiptUrl: string | undefined
  paymentFormUrl: string | undefined
}
export async function getSchedulingSubmissionResult(): Promise<SchedulingSubmissionResult | null> {
  return await utilsService.getLocalForageItem(KEY)
}
export async function removeSchedulingSubmissionResult() {
  await utilsService.removeLocalForageItem(KEY)
}
async function setSchedulingSubmissionResult(
  schedulingSubmissionResult: SchedulingSubmissionResult,
) {
  await utilsService.setLocalForageItem(KEY, schedulingSubmissionResult)
}

type SchedulingBooking = {
  startTime: Date
  endTime: Date
  location: string
}

function checkForSchedulingSubmissionEvent(
  baseFormSubmission: BaseNewFormSubmission,
): SubmissionEventTypes.FormSchedulingEvent | undefined {
  const schedulingSubmissionEvent = schedulingService.checkForSchedulingEvent(
    baseFormSubmission.definition,
    baseFormSubmission.submission,
  )
  if (schedulingSubmissionEvent) {
    console.log(
      'Form has a scheduling submission event',
      schedulingSubmissionEvent,
    )
  }
  return schedulingSubmissionEvent
}

async function handleSchedulingSubmissionEvent({
  formSubmissionResult,
  schedulingSubmissionEvent,
  schedulingUrlConfiguration,
  paymentReceiptUrl,
  paymentFormUrl,
}: {
  formSubmissionResult: FormSubmissionResult
  schedulingSubmissionEvent: SubmissionEventTypes.FormSchedulingEvent
  schedulingUrlConfiguration: {
    schedulingReceiptUrl: string
    schedulingCancelUrl: string
    schedulingRescheduleUrl?: string
  }
  paymentReceiptUrl: string | undefined
  paymentFormUrl: string | undefined
}): Promise<FormSubmissionResult['scheduling']> {
  console.log(
    'Attempting to handle submission with scheduling submission event',
  )

  const bookingUrl = await generateSchedulingConfiguration({
    formSubmissionResult,
    schedulingSubmissionEvent,
    schedulingUrlConfiguration,
  })

  const scheduling = {
    submissionEvent: schedulingSubmissionEvent,
    bookingUrl,
  }
  console.log('Created scheduling configuration to start booking', scheduling)
  await setSchedulingSubmissionResult({
    formSubmissionResult: {
      ...formSubmissionResult,
      scheduling,
    },
    paymentReceiptUrl,
    paymentFormUrl,
  })

  return scheduling
}

export {
  SchedulingBooking,
  checkForSchedulingSubmissionEvent,
  handleSchedulingSubmissionEvent,
}
