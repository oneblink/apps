import { SubmissionTypes } from '@oneblink/types'

const CUSTOM_VALUES = [
  {
    string: '{INFO_PAGE_ID}',
    value: (submissionResult: SubmissionTypes.FormSubmissionResult) =>
      submissionResult.definition.id.toString(),
  },
  {
    string: '{INFO_PAGE_NAME}',
    value: (submissionResult: SubmissionTypes.FormSubmissionResult) =>
      submissionResult.definition.name,
  },
  {
    string: '{FORM_ID}',
    value: (submissionResult: SubmissionTypes.FormSubmissionResult) =>
      submissionResult.definition.id.toString(),
  },
  {
    string: '{FORM_NAME}',
    value: (submissionResult: SubmissionTypes.FormSubmissionResult) =>
      submissionResult.definition.name,
  },
  {
    string: '{DATE}',
    value: (submissionResult: SubmissionTypes.FormSubmissionResult) => {
      if (!submissionResult.submissionTimestamp) {
        return ''
      }
      return new Date(submissionResult.submissionTimestamp).toLocaleString()
    },
  },
  {
    string: '{TIMESTAMP}',
    value: (submissionResult: SubmissionTypes.FormSubmissionResult) =>
      submissionResult.submissionTimestamp || '',
  },
  {
    string: '{SUBMISSION_ID}',
    value: (submissionResult: SubmissionTypes.FormSubmissionResult) =>
      submissionResult.submissionId || '',
  },
  {
    string: '{EXTERNAL_ID}',
    value: (submissionResult: SubmissionTypes.FormSubmissionResult) =>
      submissionResult.externalId || '',
  },
]

export default function replaceCustomValues(
  string: string,
  submissionResult: SubmissionTypes.FormSubmissionResult,
): string {
  const matches = string.match(/({ELEMENT:)([^}]+)(})/g)
  if (matches) {
    string = matches.reduce((newString, match) => {
      const propertyName = match.substring(
        match.indexOf(':') + 1,
        match.lastIndexOf('}'),
      )
      return newString.replace(
        match,
        (submissionResult.submission[propertyName] as string | undefined) ?? '',
      )
    }, string)
  }

  return CUSTOM_VALUES.reduce((newString, customValue) => {
    return newString.replace(
      customValue.string,
      customValue.value(submissionResult),
    )
  }, string)
}
