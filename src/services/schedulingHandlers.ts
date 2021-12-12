import { generateSchedulingConfiguration } from './api/scheduling'
import utilsService from './utils'
import { SubmissionEventTypes } from '@oneblink/types'
import { conditionalLogicService } from '@oneblink/sdk-core'
import { FormSubmissionResult, NewDraftSubmission } from '../types/submissions'
const KEY = 'SCHEDULING_SUBMISSION_RESULT'

type SchedulingBooking = {
  startTime: Date
  endTime: Date
  location: string
}

function checkForSchedulingSubmissionEvent(
  newDraftSubmission: NewDraftSubmission,
): SubmissionEventTypes.SchedulingSubmissionEvent | undefined {
  const schedulingSubmissionEvents =
    newDraftSubmission.definition.schedulingEvents || []
  return schedulingSubmissionEvents.find((schedulingSubmissionEvent) => {
    if (
      conditionalLogicService.evaluateConditionalPredicates({
        isConditional: !!schedulingSubmissionEvent.conditionallyExecute,
        requiresAllConditionalPredicates:
          !!schedulingSubmissionEvent.requiresAllConditionallyExecutePredicates,
        conditionalPredicates:
          schedulingSubmissionEvent.conditionallyExecutePredicates || [],
        submission: newDraftSubmission.submission,
        formElements: newDraftSubmission.definition.elements,
      })
    ) {
      console.log(
        'Form has a scheduling submission event',
        schedulingSubmissionEvent,
      )
      return schedulingSubmissionEvent
    }
  })
}

async function handleSchedulingSubmissionEvent({
  formSubmissionResult,
  schedulingSubmissionEvent,
  schedulingUrlConfiguration,
  paymentReceiptUrl,
}: {
  formSubmissionResult: FormSubmissionResult
  schedulingSubmissionEvent: SubmissionEventTypes.SchedulingSubmissionEvent
  schedulingUrlConfiguration: {
    schedulingReceiptUrl: string
    schedulingCancelUrl: string
  }
  paymentReceiptUrl?: string
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
    formSubmissionResult: {
      ...formSubmissionResult,
      scheduling,
    },
    paymentReceiptUrl,
  })

  return scheduling
}

export {
  SchedulingBooking,
  checkForSchedulingSubmissionEvent,
  handleSchedulingSubmissionEvent,
}
