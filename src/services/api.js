// @flow
'use strict'

// import {
//   getRequest,
//   searchRequest,
//   postRequest,
//   putRequest,
//   HTTPError,
// } from './fetch'
import OneBlinkFormsAppError from './errors/oneBlinkFormsAppError'
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
