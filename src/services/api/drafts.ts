import { AWSTypes, SubmissionTypes } from '@oneblink/types'
import { postRequest, getRequest, HTTPError, deleteRequest } from '../fetch'
import { isLoggedIn } from '../../auth-service'
import { downloadDraftS3Data, getDeviceInformation } from '../s3Submit'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import { getUserToken } from '../user-token'
import Sentry from '../../Sentry'
import prepareSubmissionData from '../prepareSubmissionData'
import { DraftSubmission, ProgressListener } from '../../types/submissions'
import generateOneBlinkUploader from '../generateOneBlinkUploader'
import { OneBlinkStorageError } from '@oneblink/storage'

async function uploadDraftData(
  draftSubmission: DraftSubmission,
  onProgress?: ProgressListener,
  abortSignal?: AbortSignal,
) {
  try {
    const submission = await prepareSubmissionData(draftSubmission)
    const oneblinkUploader = generateOneBlinkUploader()
    const userToken = getUserToken()
    console.log('Attempting to upload draft data')
    return await oneblinkUploader.uploadFormSubmissionDraft({
      submission,
      definition: draftSubmission.definition,
      device: getDeviceInformation(),
      userToken: userToken || undefined,
      previousFormSubmissionApprovalId:
        draftSubmission.previousFormSubmissionApprovalId,
      jobId: draftSubmission.jobId,
      formsAppId: draftSubmission.formsAppId,
      externalId: draftSubmission.externalId,
      taskId: draftSubmission.taskCompletion?.task.taskId,
      taskActionId: draftSubmission.taskCompletion?.taskAction.taskActionId,
      taskGroupInstanceId:
        draftSubmission.taskCompletion?.taskGroupInstance?.taskGroupInstanceId,
      formSubmissionDraftId: draftSubmission.formSubmissionDraftId,
      createdAt: draftSubmission.createdAt,
      title: draftSubmission.title,
      lastElementUpdated: draftSubmission.lastElementUpdated,
      onProgress,
      abortSignal,
    })
  } catch (error) {
    Sentry.captureException(error)
    console.warn('Error occurred while attempting to upload draft data', error)
    if (error instanceof OneBlinkStorageError) {
      switch (error.httpStatusCode) {
        case 401: {
          throw new OneBlinkAppsError(
            'You cannot save drafts until you have logged in. Please login and try again.',
            {
              originalError: error,
              requiresLogin: true,
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
            {
              originalError: error,
              requiresAccessRequest: true,
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
        case 400:
        case 404: {
          throw new OneBlinkAppsError(
            'We could not find the application your attempting upload a draft for. Please contact your administrator to ensure your application configuration has been completed successfully.',
            {
              originalError: error,
              title: 'Unknown Application',
              httpStatusCode: error.httpStatusCode,
            },
          )
        }
      }
    }

    throw new OneBlinkAppsError(
      'An unknown error has occurred. Please contact support if the problem persists.',
      {
        originalError: error instanceof Error ? error : undefined,
      },
    )
  }
}

async function getFormSubmissionDrafts(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<SubmissionTypes.FormSubmissionDraft[]> {
  if (!isLoggedIn()) {
    console.log(
      'Could not retrieve drafts from API as the current user is not logged in.',
    )
    return []
  }

  const url = new URL('/form-submission-drafts', tenants.current.apiOrigin)
  url.searchParams.append('formsAppId', formsAppId.toString())
  url.searchParams.append('isSubmitted', 'false')
  console.log('Attempting to retrieve drafts from API', url.href)

  try {
    return await getRequest<SubmissionTypes.FormSubmissionDraft[]>(
      url.href,
      abortSignal,
    )
  } catch (err) {
    console.warn(
      'Error occurred while attempting to retrieve drafts from API',
      err,
    )
    if (err instanceof OneBlinkAppsError) {
      throw err
    }

    const error = err as HTTPError
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot retrieve your drafts until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the application your attempting retrieve drafts for. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            title: 'Error Syncing Drafts',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
          },
        )
      }
    }
  }
}

async function downloadDraftData(
  formId: number,
  formSubmissionDraftVersionId: string,
  abortSignal?: AbortSignal,
): Promise<SubmissionTypes.S3SubmissionData> {
  const url = `${tenants.current.apiOrigin}/forms/${formId}/download-draft-data-credentials/${formSubmissionDraftVersionId}`
  console.log('Attempting to get Credentials to download draft data', url)

  const data = await postRequest<AWSTypes.FormS3Credentials>(url, abortSignal)
  console.log('Attempting to download draft form data:', data)
  return downloadDraftS3Data(data)
}

async function deleteFormSubmissionDraft(
  formSubmissionDraftId: string,
  abortSignal?: AbortSignal,
) {
  const url = `${tenants.current.apiOrigin}/form-submission-draft/${formSubmissionDraftId}`
  console.log('Attempting to delete form submission draft remotely', url)
  await deleteRequest(url, abortSignal)
}

export {
  uploadDraftData,
  getFormSubmissionDrafts,
  downloadDraftData,
  deleteFormSubmissionDraft,
}
