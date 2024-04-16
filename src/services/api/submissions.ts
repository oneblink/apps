import { AWSTypes } from '@oneblink/types'
import { HTTPError, postRequest } from '../fetch'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import tenants from '../../tenants'
import Sentry from '../../Sentry'
import { isOffline } from '../../offline-service'

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

export const generateRetrieveApprovalSubmissionCredentials = async (
  formApprovalFlowInstanceId: number,
  abortSignal?: AbortSignal,
) => {
  return postRequest<AWSTypes.FormS3Credentials>(
    `${tenants.current.apiOrigin}/form-approval-flow-instances/${formApprovalFlowInstanceId}/retrieval-credentials`,
    undefined,
    abortSignal,
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

export async function generateFormSubmissionApprovalSubmissionCredentials(
  formSubmissionApprovalId: string,
  abortSignal?: AbortSignal,
) {
  return postRequest<AWSTypes.FormS3Credentials>(
    `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApprovalId}/retrieval-credentials`,
    undefined,
    abortSignal,
  ).catch((error) => {
    console.error('Error with getting credentials for retrieval:', error)
    Sentry.captureException(error)
    // handle only credential errors here
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
      case 404:
      default: {
        throw new OneBlinkAppsError(
          'We could not find the approval submission you are looking for. Please contact your administrator to ensure your form configuration has been completed successfully.',
          {
            title: 'Unknown Form or Submission',
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  })
}

export async function generateSubmissionRetrievalCredentials({
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
    return await postRequest<AWSTypes.FormS3Credentials>(
      url,
      undefined,
      abortSignal,
    )
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
