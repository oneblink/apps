import { SubmissionTypes, AWSTypes } from '@oneblink/types'
import { HTTPError, postRequest } from '../fetch'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import Sentry from '../../Sentry'

const getBadRequestError = (error: HTTPError) => {
  return new OneBlinkAppsError(
    'The data you are attempting to submit could not be validated. Please ensure all validation has passed and try again. If the problem persists, please contact your administrator.',
    {
      title: 'Invalid Submission',
      originalError: error,
      httpStatusCode: error.status,
    },
  )
}
const getUnauthenticatedError = (error: HTTPError) => {
  return new OneBlinkAppsError(
    'The form you are attempting to complete requires authentication. Please login and try again.',
    {
      requiresLogin: true,
      originalError: error,
      httpStatusCode: error.status,
    },
  )
}
const getUnauthorisedError = (error: HTTPError) => {
  return new OneBlinkAppsError(
    'You do not have access to complete this form. Please contact your administrator to gain the correct level of access.',
    {
      requiresAccessRequest: true,
      originalError: error,
      httpStatusCode: error.status,
    },
  )
}
const getNotFoundError = (error: HTTPError) => {
  return new OneBlinkAppsError(
    'We could not find the form you are looking for. Please contact your administrator to ensure your form configuration has been completed successfully.',
    {
      title: 'Unknown Form',
      originalError: error,
      httpStatusCode: error.status,
    },
  )
}
const getDefaultError = (error: HTTPError) => {
  return new OneBlinkAppsError(
    'We could not find the form you are looking for. Please contact your administrator to ensure your form configuration has been completed successfully.',
    {
      originalError: error,
      httpStatusCode: error.status,
    },
  )
}

export const generateSubmissionCredentials = async (
  submissionData: SubmissionTypes.FormSubmission,
): Promise<SubmissionTypes.S3UploadCredentials> => {
  return postRequest<SubmissionTypes.S3UploadCredentials>(
    `${tenants.current.apiOrigin}/forms/${submissionData.definition.id}/submission-credentials`,
    {
      recaptchas: (submissionData.captchaTokens || []).map((token: string) => ({
        token,
      })),
    },
  ).catch((error) => {
    Sentry.captureException(error)
    // handle only credential errors here
    console.error('Error with getting credentials for submit:', error)
    switch (error.status) {
      case 400: {
        throw getBadRequestError(error)
      }
      case 401: {
        throw getUnauthenticatedError(error)
      }
      case 403: {
        throw getUnauthorisedError(error)
      }
      case 404: {
        throw getNotFoundError(error)
      }
      default: {
        throw getDefaultError(error)
      }
    }
  })
}

export const generateRetrieveApprovalSubmissionCredentials = async (
  formSubmissionApprovalId: string,
) => {
  return postRequest<AWSTypes.FormS3Credentials>(
    `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApprovalId}/retrieval-credentials`,
  ).catch((error) => {
    Sentry.captureException(error)
    // handle only credential errors here
    console.error('Error with getting credentials for retrieval:', error)
    switch (error.status) {
      case 400: {
        throw getBadRequestError(error)
      }
      case 401: {
        throw getUnauthenticatedError(error)
      }
      case 403: {
        throw getUnauthorisedError(error)
      }
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the approval submission you are looking for. Please contact your administrator to ensure your form configuration has been completed successfully.',
          {
            title: 'Unknown Form or Submission',
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'We could not find the approval submission you are looking for. Please contact your administrator to ensure your form configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  })
}

export const generateUploadAttachmentCredentials = async (formId: number) => {
  return postRequest<AWSTypes.FormAttachmentS3Credentials>(
    `${tenants.current.apiOrigin}/forms/${formId}/upload-attachment-credentials`,
  ).catch((error) => {
    Sentry.captureException(error)
    // handle only credential errors here
    console.error('Error getting credentials for upload:', error)
    switch (error.status) {
      case 400: {
        throw getBadRequestError(error)
      }
      case 401: {
        throw getUnauthenticatedError(error)
      }
      case 403: {
        throw getUnauthorisedError(error)
      }
      case 404: {
        throw getNotFoundError(error)
      }
      default: {
        throw getDefaultError(error)
      }
    }
  })
}
