import { SubmissionTypes, FormTypes } from '@oneblink/types'
import uploadAttachment from './uploadAttachment'

export default async function prepareSubmissionData({
  definition,
  submission,
}: SubmissionTypes.NewDraftSubmission): Promise<
  SubmissionTypes.NewDraftSubmission['submission']
> {
  return uploadAttachments(definition.id, definition.elements, submission)
}

async function maybeUploadAttachment(
  formId: number,
  formElement: FormTypes.FormElementBinaryStorage,
  value: unknown,
) {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    // If the value matches the properties required for an attachment
    // that was never uploaded, we need to upload it.
    if (
      typeof record.type === 'string' &&
      typeof record.fileName === 'string' &&
      record.data instanceof Blob
    )
      return await uploadAttachment({
        formId,
        fileName: record.fileName,
        contentType: record.data.type,
        isPrivate: formElement.storageType === 'private',
        data: record.data,
      })
  }
  return value
}

async function uploadAttachments(
  formId: number,
  formElements: FormTypes.FormElement[],
  submission: SubmissionTypes.NewDraftSubmission['submission'],
): Promise<SubmissionTypes.NewDraftSubmission['submission']> {
  for (const formElement of formElements) {
    switch (formElement.type) {
      case 'page': {
        await uploadAttachments(formId, formElement.elements, submission)
        break
      }
      case 'form': {
        const nestedSubmission = submission[formElement.name]
        if (!nestedSubmission || typeof nestedSubmission !== 'object') {
          break
        }
        await uploadAttachments(
          formId,
          formElement.elements || [],
          nestedSubmission as SubmissionTypes.NewDraftSubmission['submission'],
        )
        break
      }
      case 'repeatableSet': {
        const entries = submission[formElement.name]
        if (!Array.isArray(entries)) {
          break
        }
        for (const entry of entries) {
          await uploadAttachments(formId, formElement.elements, entry)
        }
        break
      }
      case 'camera':
      case 'draw':
      case 'compliance':
      case 'files': {
        if (!formElement.storageType || formElement.storageType === 'legacy') {
          break
        }

        const value = submission[formElement.name]
        if (!value) {
          break
        }

        switch (formElement.type) {
          case 'camera':
          case 'draw': {
            const newValue = await maybeUploadAttachment(
              formId,
              formElement,
              value,
            )
            // @ts-expect-error Submission is readonly...we don't care
            submission[formElement.name] = newValue
            break
          }
          case 'compliance': {
            const files = (value as Record<string, unknown> | undefined)?.files
            if (Array.isArray(files)) {
              for (let index = 0; index < files.length; index++) {
                files[index] = await maybeUploadAttachment(
                  formId,
                  formElement,
                  files[index],
                )
              }
            }
            break
          }
          case 'files': {
            if (Array.isArray(value)) {
              for (let index = 0; index < value.length; index++) {
                value[index] = await maybeUploadAttachment(
                  formId,
                  formElement,
                  value[index],
                )
              }
            }
            break
          }
        }
      }
    }
  }

  return submission
}
