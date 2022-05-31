import { AWSTypes, FormsAppsTypes, SubmissionTypes } from '@oneblink/types'
import { postRequest, putRequest, HTTPError } from '../fetch'
import { isLoggedIn } from '../../auth-service'
import { uploadFormSubmission, downloadDraftS3Data } from '../s3Submit'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import { getUserToken } from '../user-token'
import Sentry from '../../Sentry'
import prepareSubmissionData from '../prepareSubmissionData'
import {
  DraftSubmission,
  S3DraftUploadCredentials,
} from '../../types/submissions'

const uploadDraftData = async (
  draft: SubmissionTypes.FormsAppDraft,
  draftSubmission: DraftSubmission,
): Promise<string> => {
  const url = `${tenants.current.apiOrigin}/forms/${draft.formId}/upload-draft-data-credentials`
  console.log('Attempting to get Credentials to upload draft data', url)

  try {
    const submission = await prepareSubmissionData(draftSubmission)
    const data = await postRequest<S3DraftUploadCredentials>(url)
    const userToken = getUserToken()
    console.log('Attempting to upload draft data:', data)
    await uploadFormSubmission(
      data,
      {
        definition: draftSubmission.definition,
        submission,
        submissionTimestamp: data.submissionTimestamp,
        keyId: draftSubmission.keyId,
        formsAppId: draftSubmission.formsAppId,
      },
      {
        externalId: draft.externalId || undefined,
        jobId: draft.jobId || undefined,
        userToken: userToken || undefined,
        usernameToken: data.usernameToken,
        previousFormSubmissionApprovalId:
          draft.previousFormSubmissionApprovalId,
      },
    )
    return data.draftDataId
  } catch (error) {
    Sentry.captureException(error)
    console.warn('Error occurred while attempting to upload draft data', error)
    if (!(error instanceof HTTPError)) throw error
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot save drafts until you have logged in. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
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
            httpStatusCode: error.status,
          },
        )
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

export type PutDraftsPayload = Omit<
  FormsAppsTypes.NewFormsAppsDraft,
  'formsAppUserUsername' | 'formsAppId'
>

const putDrafts = async (
  draftsData: PutDraftsPayload,
  formsAppId: number,
): Promise<PutDraftsPayload> => {
  if (!isLoggedIn()) {
    console.log(
      'Could not sync drafts with API as the current user is not logged in.',
    )
    return draftsData
  }
  const draftsWithDataInS3 = draftsData.drafts.filter(
    (draft) => draft.draftDataId && draft.draftId !== draft.draftDataId,
  )
  const draftsWithoutDataInS3 = draftsData.drafts.filter(
    (draft) => !draft.draftDataId || draft.draftId === draft.draftDataId,
  )

  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/drafts`
  console.log('Attempting to sync drafts with API', draftsData)

  try {
    const putPayload = {
      drafts: draftsWithDataInS3,
      createdAt: draftsData.createdAt,
      updatedAt: draftsData.updatedAt,
    }
    const data = await putRequest<typeof putPayload>(url, putPayload)
    draftsWithoutDataInS3.forEach((draft) => {
      data.drafts.push(draft)
    })
    return data
  } catch (err) {
    console.warn('Error occurred while attempting to sync drafts with API', err)
    if (err instanceof OneBlinkAppsError) {
      throw err
    }

    const error = err as HTTPError
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot sync your drafts until you have logged in. Please login and try again.',
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
          'We could not find the application your attempting sync drafts for. Please contact your administrator to ensure your application configuration has been completed successfully.',
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

async function downloadDraftData<T>(
  formId: number,
  draftDataId: string,
): Promise<T> {
  const url = `${tenants.current.apiOrigin}/forms/${formId}/download-draft-data-credentials/${draftDataId}`
  console.log('Attempting to get Credentials to download draft data', url)

  const data = await postRequest<AWSTypes.FormS3Credentials>(url)
  console.log('Attempting to download draft form data:', data)
  return downloadDraftS3Data<T>(data)
}

export { uploadDraftData, putDrafts, downloadDraftData }
