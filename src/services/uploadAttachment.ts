import { generateUploadAttachmentCredentials } from './api/submissions'
import {
  UploadAttachmentConfiguration,
  uploadAttachment as uploadAttachmentToS3,
} from './s3Submit'
import tenants from '../tenants'
import { SubmissionTypes } from '@oneblink/types'

export default async function uploadAttachment(
  {
    formId,
    fileName,
    contentType,
    isPrivate,
    data,
  }: UploadAttachmentConfiguration & {
    formId: number
  },
  abortSignal?: AbortSignal,
): Promise<SubmissionTypes.FormSubmissionAttachment> {
  const formAttachmentS3Credentials = await generateUploadAttachmentCredentials(
    formId,
    abortSignal,
  )
  await uploadAttachmentToS3(
    formAttachmentS3Credentials,
    {
      fileName,
      contentType,
      isPrivate,
      data,
    },
    abortSignal,
  )
  return {
    s3: formAttachmentS3Credentials.s3,
    url: `${tenants.current.apiOrigin}/${formAttachmentS3Credentials.s3.key}`,
    contentType,
    fileName,
    id: formAttachmentS3Credentials.attachmentDataId,
    isPrivate,
    uploadedAt: Date.now().toString(),
  }
}
