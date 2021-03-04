import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { getRequest, putRequest } from './services/fetch'
import tenants from './tenants'
import { FormTypes, ApprovalTypes } from '@oneblink/types'
import { generateRetrieveApprovalSubmissionCredentials } from './services/api/submissions'
import { downloadPreFillData } from './services/s3Submit'

interface FormSubmissionApprovalsResponse {
  forms: FormTypes.Form[]
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
  formApprovalFlowInstances: ApprovalTypes.FormApprovalFlowInstance[]
}
export async function getFormSubmissionApprovals(
  formsAppId: number,
): Promise<FormSubmissionApprovalsResponse> {
  try {
    return await getRequest<FormSubmissionApprovalsResponse>(
      `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/my-approvals`,
    )
  } catch (error) {
    console.error('Error retrieving form submission approvals', error)

    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot view your pending approvals without first logging in. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
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
          },
        )
      }
    }
  }
}

interface FormSubmissionApprovalResponse {
  formSubmissionApproval: ApprovalTypes.FormSubmissionApproval
  formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
  form: FormTypes.Form
  previousFormSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
  previousFormApprovalFlowInstances: ApprovalTypes.FormApprovalFlowInstance[]
}
export async function getFormSubmissionApproval(
  formSubmissionApprovalId: number,
): Promise<FormSubmissionApprovalResponse> {
  try {
    const result = await getRequest<FormSubmissionApprovalResponse>(
      `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApprovalId}`,
    )
    return result
  } catch (error) {
    console.error('Error retrieving form submission approval', error)

    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot action this pending submission without first logging in. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
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
          },
        )
      }
    }
  }
}

export async function updateFormSubmissionApproval(
  formSubmissionApproval: ApprovalTypes.FormSubmissionApproval,
): Promise<ApprovalTypes.FormSubmissionApproval> {
  try {
    return await putRequest<ApprovalTypes.FormSubmissionApproval>(
      `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApproval.id}`,
      formSubmissionApproval,
    )
  } catch (error) {
    console.error('Error updating form submission approval', error)

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
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot action this pending submission without first logging in. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
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
          },
        )
      }
    }
  }
}

export async function retrieveFormSubmissionApprovalSubmission<T>(
  approvalId: number,
) {
  const credentials = await generateRetrieveApprovalSubmissionCredentials(
    approvalId,
  )
  return downloadPreFillData<T>({
    credentials: credentials.credentials,
    s3: credentials.s3,
  }).catch((err) => {
    throw new OneBlinkAppsError(
      'The form submission associated with this pending approval could not be retrieved.',
      {
        originalError: err,
        title: 'Submission Data Unavailable',
      },
    )
  })
}
