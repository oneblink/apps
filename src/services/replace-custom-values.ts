import { FormSubmissionResult } from '../types/submissions'
import { submissionService } from '@oneblink/sdk-core'
import * as localisationService from '../localisation-service'

export default function (
  string: string,
  submissionResult: FormSubmissionResult,
): string {
  return submissionService.replaceCustomValues(string, {
    previousApprovalId: submissionResult.previousFormSubmissionApprovalId,
    form: submissionResult.definition,
    submission: submissionResult.submission,
    submissionId: submissionResult.submissionId || '',
    submissionTimestamp: submissionResult.submissionTimestamp || '',
    externalId: submissionResult.externalId || undefined,
    formatDate: (value) => localisationService.formatDate(new Date(value)),
    formatTime: (value) => localisationService.formatTime(new Date(value)),
    formatCurrency: (value) => localisationService.formatCurrency(value),
    formatNumber: (value) => value.toString(),
  })
}
