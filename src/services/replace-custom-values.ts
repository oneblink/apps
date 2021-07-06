import { SubmissionTypes } from '@oneblink/types'
import { replaceCustomValues } from '@oneblink/sdk-core'
import localisationService from '../localisation-service'

export default function (
  string: string,
  submissionResult: SubmissionTypes.FormSubmissionResult,
): string {
  return replaceCustomValues(string, {
    form: submissionResult.definition,
    submission: submissionResult.submission,
    submissionId: submissionResult.submissionId || '',
    submissionTimestamp: submissionResult.submissionTimestamp || '',
    externalId: submissionResult.externalId || undefined,
    formatDate: (value) => localisationService.formatDate(new Date(value)),
    formatTime: (value) => localisationService.formatTime(new Date(value)),
  })
}
