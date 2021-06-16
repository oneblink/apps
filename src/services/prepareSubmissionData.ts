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
      case 'form':
      case 'section': {
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

export function getPaymentElementValuePath(
  elementId: string,
  elements: FormTypes.FormElement[],
): string[] {
  for (const element of elements) {
    if (element.id === elementId && element.type !== 'page') {
      return [element.name]
    }
    if (
      (element.type === 'section' || element.type === 'page') &&
      Array.isArray(element.elements)
    ) {
      const nestedPath = getPaymentElementValuePath(elementId, element.elements)
      // Found path to element inside nested elements
      if (nestedPath.length) {
        // Page element names are not represented in the submission data, so we do not return the page name in front of the child element path
        if (element.type === 'page') return nestedPath
        return [element.name, ...nestedPath]
      }
    }
  }
  return []
}

export function getPaymentValueFromPath(
  path: string[],
  submission: SubmissionTypes.FormSubmissionResult['submission'],
): unknown {
  let val: unknown = submission
  for (const key of path) {
    if (!!val && typeof val === 'object') {
      val = (val as SubmissionTypes.FormSubmissionResult['submission'])[key]
      continue
    }
    // In this case we encountered a value in the submission tree which should have been an object we can call a property on,
    // but it was not an object, so we return undefined as the value
    return
  }

  return val
}
