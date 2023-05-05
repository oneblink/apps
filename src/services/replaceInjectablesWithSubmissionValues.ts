import { FormSubmissionResult } from '../types/submissions'
import * as localisationService from '../localisation-service'

export default function replaceInjectablesWithSubmissionValues(
  text: string,
  submissionResult: FormSubmissionResult,
): string {
  return localisationService.replaceInjectablesWithSubmissionValues(text, {
    previousApprovalId: submissionResult.previousFormSubmissionApprovalId,
    form: submissionResult.definition,
    submission: submissionResult.submission,
    submissionId: submissionResult.submissionId || '',
    submissionTimestamp: submissionResult.submissionTimestamp || '',
    externalId: submissionResult.externalId || undefined,
  })
}
