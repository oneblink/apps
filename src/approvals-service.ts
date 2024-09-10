import { SubmissionTypes, ApprovalTypes, FormTypes } from '@oneblink/types'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import {
  deleteRequest,
  getRequest,
  putRequest,
  searchRequest,
  postRequest,
  HTTPError,
} from './services/fetch'
import tenants from './tenants'
import Sentry from './Sentry'

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
  successfulFormSubmissionPayment?: SubmissionTypes.FormSubmissionPayment
}

export type FormSubmissionApprovalResponse = {
  formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
  formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
  formSubmissionApproval: ApprovalTypes.FormSubmissionApproval
  form: FormTypes.Form
  successfulFormSubmissionPayment?: SubmissionTypes.FormSubmissionPayment
  history: FormApprovalFlowInstanceHistory[]
}

export type FormSubmissionsAdministrationApprovalsResponse = {
  approvals: Array<
    FormApprovalFlowInstanceHistory & {
      history: Array<FormApprovalFlowInstanceHistory>
    }
  >
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
 *   cannedResponseKey: 'my_canned_response_key',
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
 * @deprecated Use "reopenFormApprovalFlowInstance()" instead
 * @internal
 */
export const reopenFormSubmissionApproval = reopenFormApprovalFlowInstance

/**
 * As an administrator, reopen a submission that has been approved or denied.
 *
 * #### Example
 *
 * ```js
 * await approvalsService.reopenFormApprovalFlowInstance({
 *   formApprovalFlowInstanceId: 1,
 *   notificationEmailAddress: 'email@example.com',
 *   notes: 'Great work!!!',
 *   internalNotes: 'It was not really that great...',
 *   cannedResponseKey: 'my_canned_response_key',
 * })
 * ```
 *
 * @param options
 * @param abortSignal
 * @returns
 */
export async function reopenFormApprovalFlowInstance(
  {
    formApprovalFlowInstanceId,
    ...payload
  }: {
    formApprovalFlowInstanceId: number
    notificationEmailAddress: string
    notes: string
    internalNotes?: string
    cannedResponseKey?: string
  },
  abortSignal?: AbortSignal,
): Promise<ApprovalTypes.FormSubmissionApproval> {
  console.log('Reopening form approval flow instance', {
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
    console.error('Error reopening form approval flow instance', err)
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
 * As an administrator, close a submission that has been approved.
 *
 * #### Example
 *
 * ```js
 * await approvalsService.closeFormApprovalFlowInstance({
 *   formApprovalFlowInstanceId: 1,
 *   notificationEmailAddress: ['email@example.com'],
 *   notes: 'Great work!!!',
 *   internalNotes: 'It was not really that great...',
 *   cannedResponseKey: 'my_canned_response_key',
 * })
 * ```
 *
 * @param options
 * @param abortSignal
 * @returns
 */
export async function closeFormApprovalFlowInstance(
  {
    formApprovalFlowInstanceId,
    ...payload
  }: {
    formApprovalFlowInstanceId: number
    notificationEmailAddress?: string[]
    notes?: string
    internalNotes?: string
    cannedResponseKey?: string
  },
  abortSignal?: AbortSignal,
): Promise<ApprovalTypes.FormSubmissionApproval> {
  console.log('Closing form approval flow instance', {
    formApprovalFlowInstanceId,
    ...payload,
  })
  try {
    return await postRequest<ApprovalTypes.FormSubmissionApproval>(
      `${tenants.current.apiOrigin}/form-approval-flow-instances/${formApprovalFlowInstanceId}/close`,
      payload,
      abortSignal,
    )
  } catch (err) {
    console.log('Error closing form approval flow instance', err)
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
          'You cannot close this approval without first logging in. Please login and try again.',
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
    formApprovalFlowInstanceId?: number
    submittedAfterDateTime?: string
    submittedBeforeDateTime?: string
    limit: number
    offset: number
    statuses?: string[]
    updatedAfterDateTime?: string
    updatedBeforeDateTime?: string
    lastUpdatedBy?: string[]
    submissionTitle?: string
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
 * const { usernames } =
 *   await approvalsService.getFormApprovalUsernames(formsAppId)
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
 * Create an additional note for a form submission approval.
 *
 * #### Example
 *
 * ```js
 * const formSubmissionApprovalId = 'd96ff812-f263-4a66-868d-e259a1fe4157'
 * const newFormSubmissionApprovalNote = {
 *   note: 'this is my note',
 * }
 * const createdFormSubmissionApprovalNote =
 *   await approvalsService.createApprovalAdditionalNote({
 *     formSubmissionApprovalId,
 *     newFormSubmissionApprovalNote,
 *   })
 * ```
 *
 * @param options
 * @returns
 */
export async function createApprovalAdditionalNote({
  formSubmissionApprovalId,
  newFormSubmissionApprovalNote,
  abortSignal,
}: {
  formSubmissionApprovalId: string
  newFormSubmissionApprovalNote: ApprovalTypes.NewFormSubmissionApprovalNote
  abortSignal?: AbortSignal
}): Promise<ApprovalTypes.FormSubmissionApprovalNote> {
  try {
    return await postRequest<ApprovalTypes.FormSubmissionApprovalNote>(
      `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApprovalId}/additional-notes`,
      newFormSubmissionApprovalNote,
      abortSignal,
    )
  } catch (err) {
    console.error('Error creating form submission approval note', err)
    if (abortSignal?.aborted) {
      throw err
    }

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
          'You cannot create additional notes without first logging in. Please login and try again.',
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
 * Update an additional note for a form submission approval.
 *
 * #### Example
 *
 * ```js
 * const formSubmissionApprovalId = 'd96ff812-f263-4a66-868d-e259a1fe4157'
 * const formSubmissionApprovalNote = {
 *   id: '1e84dee3-0dc0-4abe-b2cf-d15d62fd9d0b',
 *   note: 'this is my note',
 *   createdAt: '2022-06-24T03:16:34.696Z',
 *   createdBy: {
 *     username: 'user@domain.com',
 *   },
 *   updatedAt: '2022-06-24T03:16:34.696Z',
 *   lastUpdatedBy: {
 *     username: 'user@domain.com',
 *   },
 * }
 * const updatedFormSubmissionApprovalNote =
 *   await approvalsService.updateApprovalAdditionalNote({
 *     formSubmissionApprovalId,
 *     formSubmissionApprovalNote,
 *   })
 * ```
 *
 * @param options
 * @returns
 */
export async function updateApprovalAdditionalNote({
  formSubmissionApprovalId,
  formSubmissionApprovalNote,
  abortSignal,
}: {
  formSubmissionApprovalId: string
  formSubmissionApprovalNote: ApprovalTypes.FormSubmissionApprovalNote
  abortSignal?: AbortSignal
}): Promise<ApprovalTypes.FormSubmissionApprovalNote> {
  try {
    return await putRequest<ApprovalTypes.FormSubmissionApprovalNote>(
      `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApprovalId}/additional-notes/${formSubmissionApprovalNote.id}`,
      formSubmissionApprovalNote,
      abortSignal,
    )
  } catch (err) {
    console.error('Error updating form submission approval note', err)
    if (abortSignal?.aborted) {
      throw err
    }

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
          'You cannot update additional notes without first logging in. Please login and try again.',
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
 * Delete an additional note for a form submission approval.
 *
 * #### Example
 *
 * ```js
 * const formSubmissionApprovalId = 'd96ff812-f263-4a66-868d-e259a1fe4157'
 * const formSubmissionApprovalNoteId = '1e84dee3-0dc0-4abe-b2cf-d15d62fd9d0b',
 * const updatedFormSubmissionApprovalNote =
 *   await approvalsService.deleteApprovalAdditionalNote({
 *     formSubmissionApprovalId,
 *     formSubmissionApprovalNoteId,
 *   })
 * ```
 *
 * @param options
 * @returns
 */
export async function deleteApprovalAdditionalNote({
  formSubmissionApprovalId,
  formSubmissionApprovalNoteId,
  abortSignal,
}: {
  formSubmissionApprovalId: string
  formSubmissionApprovalNoteId: string
  abortSignal?: AbortSignal
}): Promise<void> {
  try {
    return await deleteRequest(
      `${tenants.current.apiOrigin}/form-submission-approvals/${formSubmissionApprovalId}/additional-notes/${formSubmissionApprovalNoteId}`,
      abortSignal,
    )
  } catch (err) {
    console.error('Error updating form submission approval note', err)
    if (abortSignal?.aborted) {
      throw err
    }

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
          'You cannot delete additional notes without first logging in. Please login and try again.',
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
