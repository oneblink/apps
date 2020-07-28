// @flow
'use strict'

import {
  getRequest,
  searchRequest,
  postRequest,
  putRequest,
  HTTPError,
} from './fetch'
import { isLoggedIn } from '../auth-service'
import OneBlinkFormsAppError from './errors/oneBlinkFormsAppError'

const formsHostnameConfiguration = window.formsHostnameConfiguration || {}
const formsAppId = formsHostnameConfiguration.formsAppId || 'UNKNOWN'

const uploadDraftData = async (
  draft /* : FormsAppDraft */,
  draftSubmission /* : FormSubmissionResult */
) /* : Promise<string>*/ => {
  const url = `/forms/${draft.formId}/upload-draft-data-credentials`
  console.log('Attempting to get Credentials to upload draft data', url)

  try {
    const data = await postRequest(url)
    console.log('Attempting to upload draft data:', data)
    await s3SubmitService.uploadFormSubmission(
      data,
      {
        definition: draftSubmission.definition,
        submission: draftSubmission.submission,
        submissionTimestamp: data.submissionTimestamp,
        keyId: draftSubmission.keyId,
      },
      {
        externalId: draft.externalId,
        jobId: draft.jobId,
      }
    )
    return data.draftDataId
  } catch (error) {
    console.warn('Error occurred while attempting to upload draft data', error)
    switch (error.status) {
      case 401: {
        throw new OneBlinkFormsAppError(
          'You cannot save drafts until you have logged in. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          }
        )
      }
      case 403: {
        throw new OneBlinkFormsAppError(
          'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          }
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkFormsAppError(
          'We could not find the application your attempting upload a draft for. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          }
        )
      }
      default: {
        throw new OneBlinkFormsAppError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
          }
        )
      }
    }
  }
}

const putDrafts = async (
  draftsData /* : FormsAppDrafts */
) /* : Promise<FormsAppDrafts>*/ => {
  if (!isLoggedIn()) {
    console.log(
      'Could not sync drafts with API as the current user is not logged in.'
    )
    return draftsData
  }
  const draftsWithDataInS3 = draftsData.drafts.filter(
    (draft) => draft.draftDataId && draft.draftId !== draft.draftDataId
  )
  const draftsWithoutDataInS3 = draftsData.drafts.filter(
    (draft) => !draft.draftDataId || draft.draftId === draft.draftDataId
  )

  const url = `/forms-apps/${formsAppId}/drafts`
  console.log('Attempting to sync drafts with API', draftsData)

  try {
    const data = await putRequest(url, {
      drafts: draftsWithDataInS3,
      createdAt: draftsData.createdAt,
      updatedAt: draftsData.updatedAt,
    })
    draftsWithoutDataInS3.forEach((draft) => {
      data.drafts.push(draft)
    })
    return data
  } catch (error) {
    console.warn(
      'Error occurred while attempting to sync drafts with API',
      error
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkFormsAppError(
          'You cannot sync your drafts until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          }
        )
      }
      case 403: {
        throw new OneBlinkFormsAppError(
          'You do not have access to drafts for this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          }
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkFormsAppError(
          'We could not find the application your attempting sync drafts for. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            title: 'Error Syncing Drafts',
            httpStatusCode: error.status,
          }
        )
      }
      default: {
        throw new OneBlinkFormsAppError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
          }
        )
      }
    }
  }
}

async function downloadDraftData /* :: <T> */(
  formId /* : number */,
  draftDataId /* : string */
) /* : Promise<T> */ {
  const url = `/forms/${formId}/download-draft-data-credentials/${draftDataId}`
  console.log('Attempting to get Credentials to download draft data', url)

  const data = await postRequest(url)
  console.log('Attempting to download draft form data:', data)
  return s3SubmitService.downloadPreFillData(data)
}

async function uploadPreFillFormData /* :: <T> */(
  formId /* : number */,
  preFillData /* : T */
) /* : Promise<string> */ {
  const url = `/forms/${formId}/pre-fill-credentials`
  console.log('Attempting to get Credentials to upload pre fill form data', url)

  const data = await postRequest(url)
  console.log('Attempting to upload pre fill form data:', data)
  await s3SubmitService.uploadPreFillData(data, preFillData)
  return data.preFillFormDataId
}

async function downloadPreFillFormData /* :: <T> */(
  formId /* : number */,
  preFillFormDataId /* : string */
) /* : Promise<T> */ {
  const url = `/forms/${formId}/pre-fill-retrieval-credentials/${preFillFormDataId}`
  console.log(
    'Attempting to get Credentials to download pre fill form data',
    url
  )

  const data = await postRequest(url)
  console.log('Attempting to download pre fill form data:', data)
  return s3SubmitService.downloadPreFillData(data)
}
