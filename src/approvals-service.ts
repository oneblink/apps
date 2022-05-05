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
import {
  generateFormSubmissionApprovalSubmissionCredentials,
  generateRetrieveApprovalSubmissionCredentials,
  generateApprovalFormSubmissionCredentials,
} from './services/api/submissions'
import { downloadSubmissionS3Data } from './services/s3Submit'
import Sentry from './Sentry'
import submitForm, { SubmissionParams } from './services/submit'
import { FormSubmissionResult } from './types/submissions'
import { deleteAutoSaveData } from './auto-save-service'

export type FormSubmissionApprovalsResponse = {
  forms: FormTypes.Form[]
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
  formApprovalFlowInstances: ApprovalTypes.FormApprovalFlowInstance[]
  formSubmissionMeta: SubmissionTypes.FormSubmissionMeta[]
}

export type FormApprovalFlowInstanceHistory = {
  formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
  formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
}

export type FormSubmissionApprovalResponse = {
  formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
  formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
  formSubmissionApproval: ApprovalTypes.FormSubmissionApproval
  form: FormTypes.Form
  history: FormApprovalFlowInstanceHistory[]
}

export type FormSubmissionsAdministrationApprovalsResponse = {
  approvals: Array<{
    formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
    formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
    formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
    history: Array<{
      formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
      formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
      formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
    }>
  }>
  meta: {
    limit: number
    offset: number
    nextOffset?: number
  }
}

/**
 * Get an Object containing FormSubmissionApprovals assigned to the current user
 * and the Form definitions in those approvals.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const {
 *   formSubmissionApprovals,
 *   formApprovalFlowInstances,
 *   forms,
 *   formSubmissionMeta,
 * } = await approvalsService.getFormSubmissionApprovals(formAppId)
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
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

/**
 * Get a single FormSubmissionApproval belonging to the given id.
 *
 * #### Example
 *
 * ```js
 * const formSubmissionApprovalId = 'd27966cc-128d-48a2-b681-6ad52012e113'
 * const {
 *   formSubmissionApproval,
 *   formApprovalFlowInstance,
 *   formSubmissionMeta,
 *   form,
 *   history,
 * } = await approvalsService.getFormSubmissionApproval(
 *   formSubmissionApprovalId,
 * )
 * ```
 *
 * @param formSubmissionApprovalId
 * @param abortSignal
 * @returns
 */
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

/**
 * Update a single FormSubmissionApproval assigned to the current user.
 *
 * #### Example
 *
 * ```js
 * const formSubmissionApproval = {
 *   id: 'd27966cc-128d-48a2-b681-6ad52012e113',
 *   status: 'APPROVED',
 *   username: 'email@example.com',
 *   formApprovalFlowInstanceId: 1,
 *   notificationEmailAddress: 'email@example.com',
 *   notes: 'Great work!!!',
 *   internalNotes: 'It was not really that great...',
 *   createdAt: '2021-02-21T22:57:56.257Z',
 *   updatedAt: '2021-02-21T22:57:56.257Z',
 * }
 * const updatedFormSubmissionApproval =
 *   await approvalsService.updateFormSubmissionApproval(
 *     formSubmissionApproval,
 *   )
 * ```
 *
 * @param formSubmissionApproval
 * @param abortSignal
 * @returns
 */
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

/**
 * As an administrator, reopen a submission that has been approved or denied .
 *
 * #### Example
 *
 * ```js
 * await approvalsService.updateFormSubmissionApproval({
 *   formApprovalFlowInstanceId: 1,
 *   notificationEmailAddress: 'email@example.com',
 *   notes: 'Great work!!!',
 *   internalNotes: 'It was not really that great...',
 * })
 * ```
 *
 * @param options
 * @param abortSignal
 * @returns
 */
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

/**
 * Retrieve the submission data associated with a FormApprovalFlowInstance.
 *
 * #### Example
 *
 * ```js
 * const formApprovalFlowInstanceId = 1
 * const formSubmission =
 *   await approvalsService.getFormApprovalFlowInstanceSubmission(
 *     formApprovalFlowInstanceId,
 *   )
 * ```
 *
 * @param formApprovalFlowInstanceId
 * @param abortSignal
 * @returns
 */
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

/**
 * Retrieve the submission data associated with a FormSubmissionApproval.
 *
 * #### Example
 *
 * ```js
 * const formSubmissionApprovalId = '7145544d-853a-47e8-873c-1e849698e414'
 * const formSubmission =
 *   await approvalsService.getFormSubmissionApprovalSubmission(
 *     formSubmissionApprovalId,
 *   )
 * ```
 *
 * @param formSubmissionApprovalId
 * @param abortSignal
 * @returns
 */
export async function getFormSubmissionApprovalSubmission(
  formSubmissionApprovalId: string,
  abortSignal?: AbortSignal,
): Promise<SubmissionTypes.S3SubmissionData> {
  const credentials = await generateFormSubmissionApprovalSubmissionCredentials(
    formSubmissionApprovalId,
    abortSignal,
  )
  return await downloadSubmissionS3Data<SubmissionTypes.S3SubmissionData>({
    credentials: credentials.credentials,
    s3: credentials.s3,
  })
}

export type FormApprovalFlowResponse = {
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

/**
 * Get an Object containing approvals for the app regardless of approval groups
 * and meta for paging. Must be an Approvals Administrator.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const limit = 50
 * const offset = 0
 * const { approvals, meta } =
 *   await approvalsService.getFormSubmissionAdministrationApprovals({
 *     formAppId,
 *     limit,
 *     offset,
 *   })
 * ```
 *
 * @param options
 * @param abortSignal
 * @returns
 */
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

export type FormApprovalUsernamesResponse = {
  usernames: Array<{ username: string }>
}
/**
 * Get an array containing usernames that have updated approvals in the within
 * the formsAppId associated with the passed `formsAppId`. Must be an Approvals
 * Administrator.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const { usernames } = await approvalsService.getFormApprovalUsernames(
 *   formsAppId,
 * )
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
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

/**
 * Submit a FormSubmission. Offline submissions will be added to a pending queue
 * and be processed using the processPendingQueue() function. Will also handle
 * cleaning up auto save data (if the `autoSaveKey` property is passed), locally
 * stored drafts and prefill data
 *
 * #### Example
 *
 * ```js
 * const formSubmission = {
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here',
 *   },
 *   definition: OneBlinkForm,
 *   captchaTokens: [],
 *   draftId: null,
 *   jobId: null,
 *   preFillFormDataId: '7763f828-4aaf-49dc-9c1b-e2eeea8fa990',
 *   externalId: 'external-id-set-by-developer',
 * }
 *
 * const submissionResult = await submissionService.submit({
 *   formSubmission,
 *   formSubmissionApprovalId: '3245a275-7bfa-49dc-9c1b-e2eeea8rt678',
 *   autoSaveKey: 'my-key',
 * })
 *
 * if (submissionResult.isOffline) {
 *   if (submissionResult.isInPendingQueue) {
 *     // Display message to user that the submission
 *     // has been added to the pending queue
 *   } else {
 *     // Display message to user that this submission can
 *     // not be processed while offline (most likely because it requires a payment)
 *   }
 *   return
 * }
 *
 * // submissionResult.submissionId and submissionResult.submissionTimestamp
 * // will be set if the submission was successful
 * ```
 *
 * @param options
 * @returns
 */
export async function submitApprovalForm({
  formSubmissionApprovalId,
  autoSaveKey,
  ...options
}: SubmissionParams & {
  formSubmissionApprovalId: string
  autoSaveKey?: string
}): Promise<FormSubmissionResult> {
  const formSubmissionResult = await submitForm({
    ...options,
    generateCredentials: (formSubmission) =>
      generateApprovalFormSubmissionCredentials(
        formSubmission,
        formSubmissionApprovalId,
      ),
  })
  if (typeof autoSaveKey === 'string') {
    try {
      await deleteAutoSaveData(
        options.formSubmission.definition.id,
        autoSaveKey,
      )
    } catch (error) {
      console.warn('Error removing auto save data: ', error)
      Sentry.captureException(error)
    }
  }
  return formSubmissionResult
}
