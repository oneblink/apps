import { generateUploadAttachmentCredentials } from './api/submissions'
import {
  UploadAttachmentConfiguration,
  uploadAttachment as uploadAttachmentToS3,
} from './s3Submit'
import tenants from '../tenants'

export default async function uploadAttachment({
  formId,
  file,
}: {
  formId: number
  file: UploadAttachmentConfiguration
}) {
  const formAttachmentS3Credentials = await generateUploadAttachmentCredentials(
    formId,
  )
  await uploadAttachmentToS3(formAttachmentS3Credentials, file)
  return {
    s3: formAttachmentS3Credentials.s3,
    url: `${tenants.current.apiOrigin}/${formAttachmentS3Credentials.s3.key}`,
    contentType: file.type,
    fileName: file.name,
    id: formAttachmentS3Credentials.attachmentDataId,
    isPrivate: file.isPrivate,
  }
}
