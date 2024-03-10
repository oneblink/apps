import { generateUploadAttachmentCredentials } from './api/submissions'
import {
  UploadAttachmentConfiguration,
  uploadAttachment as uploadAttachmentToS3,
  ProgressListener,
} from './s3Submit'
import tenants from '../tenants'
import { SubmissionTypes } from '@oneblink/types'

/**
 * Upload a submission attachment. Attachment can be passed as a `Blob`,
 * `Uint8Array` or `string` (base64). Will return data required form accessing
 * the attachment.
 *
 * ### Example
 *
 * ```js
 * const blob = new Blob(['a string of data'], {
 *   type: 'text/plain',
 * })
 * const file = {
 *   formId: 1,
 *   data: blob,
 *   fileName: 'file.jpg',
 *   contentType: 'image/jpeg',
 *   isPrivate: true, // Whether the attachment will be able to be downloaded by other users
 * }
 * const abortController = new AbortController()
 * const {
 *   s3: {
 *     key, // string
 *     bucket, // string
 *     region, // string
 *   },
 *   url, // string
 *   contentType, // string
 *   fileName, // string
 *   id, //string
 *   isPrivate, // boolean
 *   uploadedAt, // string
 * } = await submissionService.uploadAttachment(
 *   file,
 *   abortController.signal,
 * )
 * ```
 *
 * @param options
 * @param abortSignal
 * @returns
 */
export default async function uploadAttachment(
  {
    formId,
    fileName,
    contentType,
    isPrivate,
    data,
    onProgress,
  }: UploadAttachmentConfiguration & {
    formId: number
    onProgress?: ProgressListener
  },
  abortSignal?: AbortSignal,
): Promise<SubmissionTypes.FormSubmissionAttachment> {
  const formAttachmentS3Credentials = await generateUploadAttachmentCredentials(
    formId,
    abortSignal,
  )
  // S3 defaults unknown file types to the following, do the same here for our submission model
  const _contentType = contentType || 'application/octet-stream'
  await uploadAttachmentToS3({
    s3Configuration: formAttachmentS3Credentials,
    fileConfiguration: {
      fileName,
      contentType: _contentType,
      isPrivate,
      data,
    },
    abortSignal,
    onProgress,
  })
  return {
    s3: formAttachmentS3Credentials.s3,
    url: `${tenants.current.apiOrigin}/${formAttachmentS3Credentials.s3.key}`,
    contentType: _contentType,
    fileName,
    id: formAttachmentS3Credentials.attachmentDataId,
    isPrivate,
    uploadedAt: formAttachmentS3Credentials.uploadedAt,
  }
}

export { UploadAttachmentConfiguration }
