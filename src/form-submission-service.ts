import { FormS3Credentials } from '@oneblink/types/typescript/aws'
import tenants from './tenants'
import { HTTPError, postRequest } from './services/fetch'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import Sentry from './Sentry'
import { S3SubmissionData } from '@oneblink/types/typescript/submissions'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const FORM_SUBMISSION_DATA_UNAVAILABLE_ERROR_NAME =
  'FormSubmissionDataUnavailable'

/**
 * Retrieve submission credentials for a known formId and submissionId
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const submissionId = 'fba95b9d-5a9c-463d-ab68-867f431e4120'
 * const credentials = await formSubmissionService.getSubmissionCredentials(
 *   { formId, submissionId },
 * )
 * ```
 *
 * @param formId
 * @param submissionId
 * @param abortSignal
 * @returns
 */
export async function getSubmissionCredentials({
  formId,
  submissionId,
  abortSignal,
}: {
  formId: number
  submissionId: string
  abortSignal?: AbortSignal
}) {
  const url = `${tenants.current.apiOrigin}/forms/${formId}/retrieval-credentials/${submissionId}`
  try {
    return await postRequest<FormS3Credentials>(url, undefined, abortSignal)
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to submission data. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Retrieve submission data for a known formId and submissionId
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const submissionId = 'fba95b9d-5a9c-463d-ab68-867f431e4120'
 * const credentials = await formSubmissionService.getSubmissionData({
 *   formId,
 *   submissionId,
 * })
 * ```
 *
 * @param formId
 * @param submissionId
 * @param abortSignal
 * @returns
 */
export async function getSubmissionData({
  formId,
  submissionId,
  abortSignal,
}: {
  formId: number
  submissionId: string
  abortSignal?: AbortSignal
}): Promise<S3SubmissionData> {
  const s3Details = await getSubmissionCredentials({
    formId,
    submissionId,
    abortSignal,
  })
  const s3 = new S3Client({
    apiVersion: '2006-03-01',
    region: s3Details.s3.region,
    credentials: {
      accessKeyId: s3Details.credentials.AccessKeyId,
      secretAccessKey: s3Details.credentials.SecretAccessKey,
      sessionToken: s3Details.credentials.SessionToken,
    },
  })
  const params = {
    Bucket: s3Details.s3.bucket,
    Key: s3Details.s3.key,
  }

  try {
    const s3Object = await s3.send(new GetObjectCommand(params))

    return JSON.parse((await s3Object.Body?.transformToString()) ?? '')
  } catch (error) {
    console.warn('Error retrieving Form Submission Data', error)

    // AWS will return an "Access Denied" error for objects that have been
    // deleted. As we should only be getting these if objects are not there
    // (because our API should always return valid credentials) we can tell
    // the user that their data has been removed from OneBlink's stores.
    if ((error as Error).name === 'AccessDenied') {
      const newError = new Error(
        `This submission has been removed from the ${tenants.current.name} store based on your submission data retention policy`,
      )
      newError.name = FORM_SUBMISSION_DATA_UNAVAILABLE_ERROR_NAME
      throw newError
    }

    throw error
  }
}
