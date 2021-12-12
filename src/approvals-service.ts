import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import {
  getRequest,
  putRequest,
  searchRequest,
  postRequest,
  HTTPError,
} from './services/fetch'
import tenants from './tenants'
import { SubmissionTypes, ApprovalTypes, FormTypes } from '@oneblink/types'
import { generateRetrieveApprovalSubmissionCredentials } from './services/api/submissions'
import { downloadSubmissionS3Data } from './services/s3Submit'
import Sentry from './Sentry'
import {
  FormSubmissionApprovalsResponse,
  FormSubmissionApprovalResponse,
  FormSubmissionsAdministrationApprovalsResponse,
} from './types/approvals'

export { FormSubmissionApprovalsResponse }
export async function getFormSubmissionApprovals(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<FormSubmissionApprovalsResponse> {
  try {
    return await getRequest<FormSubmissionApprovalsResponse>(
      `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/my-approvals`,
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error retrieving form submission approvals', err)
    const error = err as HTTPError
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
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

export { FormSubmissionApprovalResponse }
export async function getFormSubmissionApproval(
  formSubmissionApprovalId: string,
  abortSignal?: AbortSignal,
): Promise<FormSubmissionApprovalResponse> {
  try {
    const result = await getRequest<FormSubmissionApprovalResponse>(
      `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApprovalId}`,
      abortSignal,
    )
    return result
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error retrieving form submission approval', err)

    const error = err as HTTPError
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
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

export async function updateFormSubmissionApproval(
  formSubmissionApproval: ApprovalTypes.FormSubmissionApproval,
  abortSignal?: AbortSignal,
): Promise<ApprovalTypes.FormSubmissionApproval> {
  try {
    return await putRequest<ApprovalTypes.FormSubmissionApproval>(
      `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApproval.id}`,
      formSubmissionApproval,
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error updating form submission approval', err)

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
      case 404:
      case 409: {
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

export async function reopenFormSubmissionApproval(
  {
    formApprovalFlowInstanceId,
    ...payload
  }: {
    formApprovalFlowInstanceId: number
    notificationEmailAddress: string
    notes: string
    internalNotes?: string
  },
  abortSignal?: AbortSignal,
): Promise<ApprovalTypes.FormSubmissionApproval> {
  console.log('Reopening form submission approval', {
    formApprovalFlowInstanceId,
    ...payload,
  })
  try {
    return await postRequest<ApprovalTypes.FormSubmissionApproval>(
      `${tenants.current.apiOrigin}/form-approval-flow-instances/${formApprovalFlowInstanceId}/reopen`,
      payload,
      abortSignal,
    )
  } catch (err) {
    console.error('Error reopening form submission approval', err)
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
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot reopen this approval without first logging in. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this approval. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404:
      case 409: {
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

export async function getFormApprovalFlowInstanceSubmission(
  formApprovalFlowInstanceId: number,
  abortSignal?: AbortSignal,
): Promise<SubmissionTypes.S3SubmissionData> {
  const credentials = await generateRetrieveApprovalSubmissionCredentials(
    formApprovalFlowInstanceId,
    abortSignal,
  )
  return await downloadSubmissionS3Data<SubmissionTypes.S3SubmissionData>({
    credentials: credentials.credentials,
    s3: credentials.s3,
  })
}

type FormApprovalFlowResponse = {
  forms: FormTypes.Form[]
}

export async function getFormApprovalFlows(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<FormApprovalFlowResponse> {
  try {
    return await getRequest<FormApprovalFlowResponse>(
      `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/form-approval-flows`,
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error retrieving form approval flows', err)

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
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot access form approval flows without first logging in. Please login and try again.',
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
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

export async function getFormSubmissionAdministrationApprovals(
  {
    formsAppId,
    ...rest
  }: {
    formsAppId: number
    formId?: number
    externalId?: string
    submissionId?: string
    submittedAfterDateTime?: string
    submittedBeforeDateTime?: string
    limit: number
    offset: number
    statuses?: string[]
    updatedAfterDateTime?: string
    updatedBeforeDateTime?: string
    lastUpdatedBy?: string[]
  },
  abortSignal?: AbortSignal,
): Promise<FormSubmissionsAdministrationApprovalsResponse> {
  try {
    return await searchRequest<FormSubmissionsAdministrationApprovalsResponse>(
      `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/approvals`,
      {
        ...rest,
      },
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)
    console.error(
      'Error retrieving administrator form submission approvals',
      err,
    )

    const error = err as HTTPError
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
          'You cannot view approvals without first logging in. Please login and try again.',
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
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

type FormApprovalUsernamesResponse = { usernames: Array<{ username: string }> }
export async function getFormApprovalUsernames(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<FormApprovalUsernamesResponse> {
  try {
    return await getRequest<FormApprovalUsernamesResponse>(
      `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/approvals/usernames`,
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error retrieving form approval usernames', err)

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
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot access form approval usernames without first logging in. Please login and try again.',
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
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}
