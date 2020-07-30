// Type definitions for @oneblink/apps 0.1
// Project: https://github.com/baz/oneblink/apps
// Definitions by: OneBlink Developers <https://github.com/oneblink>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.9

import type {
  NoU,
  GenericObject,
  UserProfile,
  QueryParameters,
} from './typescript/misc'
import * as FormTypes from './typescript/forms'
import * as SubmissionEventTypes from './typescript/submissionEvents'
import { createInstance } from 'localforage'

declare namespace offlineService {
  function isOffline(): boolean
}

declare namespace authService {
  function init(options: { oAuthClientId: string; useSAML: boolean }): void
  function getUserFriendlyName(): string | null
  function getIssuerFromJWT(jwt: string | NoU): string | void
  function isAuthorised(formsAppId: number): Promise<boolean>
  function requestAccess(formsAppId: number): Promise<void>
  function login(): Promise<string>
  function handleAuthentication(): Promise<string>
  function isLoggedIn(): boolean
  function getIdToken(): Promise<string | undefined>
  function getUserProfile(): UserProfile | null
  function logout(): Promise<void>
}

declare class OneBlinkAppsError extends Error {
  title: string
  isOffline: boolean
  requiresAccessRequest: boolean
  requiresLogin: boolean
  httpStatusCode: number | undefined
  originalError: Error | undefined

  constructor(
    message: string,
    options?: {
      title?: string
      isOffline?: boolean
      requiresAccessRequest?: boolean
      requiresLogin?: boolean
      httpStatusCode?: number
      originalError?: Error
    }
  )
}
declare namespace draftService {
  function registerDraftsListener(
    listener: (drafts: FormTypes.FormsAppDraft[]) => unknown
  ): () => void
  function addDraft(
    newDraft: FormTypes.NewFormsAppDraft,
    draftSubmission: FormTypes.DraftSubmission,
    accessKey: NoU | string
  ): Promise<void>
  function updateDraft(
    draft: FormTypes.FormsAppDraft,
    draftSubmission: FormTypes.DraftSubmission,
    accessKey: NoU | string
  ): Promise<void>
  function getDrafts(): Promise<FormTypes.FormsAppDraft[]>
  function getDraftAndData(
    draftId: NoU | string
  ): Promise<{
    draft: FormTypes.FormsAppDraft
    draftData: { [key: string]: unknown }
  } | null>
  function deleteDraft(draftId: string, formsAppId: number): Promise<void>
  function syncDrafts(options: {
    formsAppId: number
    throwError?: boolean
  }): Promise<void>
}

declare namespace paymentService {
  function handlePaymentQuerystring(
    query: QueryParameters
  ): Promise<{
    transaction: {
      isSuccess: boolean
      errorMessage: string | NoU
      id: string | NoU
      creditCardMask: string | NoU
      amount: number | NoU
    }
    submissionResult: FormTypes.FormSubmissionResult
  }>
  function handlePaymentSubmissionEvent(
    formSubmission: FormTypes.FormSubmission,
    paymentSubmissionEvent: SubmissionEventTypes.PaymentSubmissionEvent
  ): Promise<FormTypes.FormSubmissionResult | void>
}

declare namespace prefillService {
  function removePrefillFormData(prefillFormDataId: string): Promise<void>
  function getPrefillFormData<T extends GenericObject>(
    formId: number,
    prefillFormDataId: string | NoU
  ): Promise<T | null>
}

declare function useTenantCivicPlus(): void
declare function useTenantOneBlink(): void

declare namespace jobService {
  function getJobs(
    formsAppId: number,
    jobsLabel: string
  ): Promise<FormTypes.FormsAppJob[]>
  function ensurePrefillFormDataExists(
    jobs: FormTypes.FormsAppJob[]
  ): Promise<void>
}

declare namespace submissionService {
  function submit(options: {
    formSubmission: FormTypes.FormSubmission
    accessKey?: string
    paymentReceiptUrl?: string
    submissionId?: string
  }): Promise<FormTypes.FormSubmissionResult>

  function executePostSubmissionAction(
    submissionResult: FormTypes.FormSubmissionResult,
    push: (url: string) => void
  ): Promise<void>

  function cancelForm(): Promise<void>

  function getPendingQueueSubmissions(): Promise<
    FormTypes.PendingFormSubmissionResult[]
  >

  function deletePendingQueueSubmission(pendingTimestamp: string): Promise<void>

  function registerPendingQueueListener(
    listener: (
      pendingFormSubmissionResults: FormTypes.PendingFormSubmissionResult[]
    ) => unknown
  ): () => void

  function processPendingQueue(): Promise<void>
}

declare namespace autoSaveService {
  function getAutoSaveData<T>(
    formId: number,
    autoSaveKey: string | NoU
  ): Promise<T | null>

  function upsertAutoSaveData<T extends GenericObject>(
    formId: number,
    autoSaveKey: string | NoU,
    model: T
  ): Promise<T>

  function deleteAutoSaveData(
    formId: number,
    autoSaveKey: string | NoU
  ): Promise<void>
}

declare namespace notificationService {
  function isSubscribed(): Promise<boolean>
  function subscribe(formsAppId: number): Promise<boolean>
  function unsubscribe(formsAppId: number): Promise<void>
}

declare namespace formService {
  function getForms(formsAppId: number): Promise<FormTypes.Form[]>

  function getForm(formsAppId: number, formId: number): Promise<FormTypes.Form>

  function getFormElementLookups(
    organisationId: string,
    formsAppEnvironmentId: number
  ): Promise<Array<FormTypes.FormElementLookup & { url: string }>>

  function getFormElementLookupById(
    organisationId: string,
    formsAppEnvironmentId: number,
    formElementLookupId: number
  ): Promise<(FormTypes.FormElementLookup & { url: string }) | void>

  function getFormElementOptionsSets(
    organisationId: string,
    formsAppEnvironmentId: number
  ): Promise<Array<FormTypes.FormElementDynamicOptionSet & { url: string }>>

  function getFormElementOptionsSetById(
    organisationId: string,
    formsAppEnvironmentId: number,
    dynamicOptionsSetId: number
  ): Promise<(FormTypes.FormElementDynamicOptionSet & { url: string }) | void>

  function getFormElementDynamicOptions(
    form: FormTypes.Form,
    element: FormTypes.FormElement
  ): Promise<FormTypes.ChoiceElementOption[] | void>

  function forEachFormElement(
    elements: FormTypes.FormElement[],
    forEach: (
      element: FormTypes.FormElement,
      elements: FormTypes.FormElement[]
    ) => void
  ): void

  function findFormElement(
    elements: FormTypes.FormElement[],
    predicate: (
      element: FormTypes.FormElement,
      elements: FormTypes.FormElement[]
    ) => boolean,
    parentElements?: FormTypes.FormElement[]
  ): FormTypes.FormElement | void
}

declare type localForageInstance = ReturnType<typeof createInstance>
export {
  offlineService,
  authService,
  draftService,
  paymentService,
  prefillService,
  jobService,
  submissionService,
  autoSaveService,
  notificationService,
  formService,
  OneBlinkAppsError,
  FormTypes,
  SubmissionEventTypes,
  useTenantCivicPlus,
  useTenantOneBlink,
  localForageInstance,
}
