import _differenceBy from 'lodash.differenceby'
import { v4 as uuidv4 } from 'uuid'

import utilsService from './services/utils'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { getUsername, isLoggedIn } from './services/cognito'
import { getFormsKeyId, getUserProfile } from './auth-service'
import {
  uploadDraftData,
  putDrafts,
  PutDraftsPayload,
} from './services/api/drafts'
import { getPendingQueueSubmissions } from './services/pending-queue'
import {
  getDraftData,
  saveDraftData,
  removeDraftData,
  ensureDraftsDataExists,
  ensureDraftsDataIsUploaded,
} from './services/draft-data-store'
import { FormTypes, MiscTypes, SubmissionTypes } from '@oneblink/types'
import Sentry from './Sentry'
import { DraftSubmission } from './types/submissions'
import { ProgressListener } from './services/s3Submit'

interface DraftsData {
  createdAt?: string
  updatedAt?: string
  drafts: SubmissionTypes.FormsAppDraft[]
}

function errorHandler(error: Error): Error {
  console.error('Local Forage Error', error)
  if (/The serialized value is too large/.test(error.message)) {
    return new OneBlinkAppsError(
      'It seems you have run out of space. Please delete some of your drafts to allow new drafts to be created or existing drafts to be updated.',
      {
        originalError: error,
      },
    )
  }

  return error
}

const draftsListeners: Array<
  (draft: SubmissionTypes.FormsAppDraft[]) => unknown
> = []

/**
 * Register a listener function that will be passed an array of Drafts when a
 * draft is added, updated or deleted.
 *
 * #### Example
 *
 * ```js
 * const listener = async (drafts) => {
 *   // use drafts here...
 * }
 * const deregister = await draftService.registerDraftsListener(listener)
 *
 * // When no longer needed, remember to deregister the listener
 * deregister()
 * ```
 *
 * @param listener
 * @returns
 */
export function registerDraftsListener(
  listener: (draft: SubmissionTypes.FormsAppDraft[]) => unknown,
): () => void {
  draftsListeners.push(listener)

  return () => {
    const index = draftsListeners.indexOf(listener)
    if (index !== -1) {
      draftsListeners.splice(index, 1)
    }
  }
}

function executeDraftsListeners(draftsData: DraftsData) {
  console.log('Drafts have been updated', draftsData)
  for (const draftsListener of draftsListeners) {
    draftsListener(draftsData.drafts)
  }
}

async function upsertDraftByKey(
  draft: SubmissionTypes.FormsAppDraft,
  draftSubmission: DraftSubmission,
): Promise<string> {
  if (!draftSubmission.keyId) {
    throw new Error('Could not create draft for key without a keyId')
  }

  if (isOffline()) {
    throw new OneBlinkAppsError('Drafts cannot be saved while offline.', {
      isOffline: true,
    })
  }

  if (!draft.draftId) {
    draft.draftId = uuidv4()
  }

  return uploadDraftData(draft, draftSubmission)
}

/**
 * Add a Draft to the local store and sync it with remote drafts. Will also
 * handle cleaning up auto save data (if the `autoSaveKey` property is passed).
 *
 * #### Example
 *
 * ```js
 * const draft = {
 *   draftId: 'd3aeb944-d0b3-11ea-87d0-0242ac130003',
 *   title: 'I Will Finish This Later',
 *   formId: 1,
 *   externalId: 'external'
 *   jobId: '0ac41494-723b-4a5d-90bb-534b8360f31d',
 *   previousFormSubmissionApprovalId: '7fa79583-ec45-4ffc-8f72-4be80ef2c2b7',
 * }
 * const data = {
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here'
 *   },
 *   definition: OneBlinkForm,
 * }
 * await draftService.addDraft(
 *   draft,
 *   data,
 * )
 * ```
 *
 * @param options
 * @returns
 */
export async function addDraft({
  newDraft,
  draftSubmission,
  autoSaveKey,
  onProgress,
}: {
  newDraft: SubmissionTypes.NewFormsAppDraft
  draftSubmission: DraftSubmission
  autoSaveKey?: string
  onProgress?: ProgressListener
}): Promise<void> {
  const draft: SubmissionTypes.FormsAppDraft = {
    ...newDraft,
    draftId: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  draftSubmission.keyId = getFormsKeyId() || undefined
  if (draftSubmission.keyId) {
    await upsertDraftByKey(draft, draftSubmission)
    return
  }

  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError(
      'You cannot add drafts until you have logged in. Please login and try again.',
      {
        requiresLogin: true,
      },
    )
  }

  const userProfile = getUserProfile() || undefined
  draft.updatedBy = userProfile
  draft.createdBy = userProfile

  try {
    // Push draft data to s3 (should also update local storage draft data)
    // add drafts to array in local storage
    // sync local storage drafts with server
    // draftId will be set as draftDataId if data cannot be uploaded
    const draftDataId = await saveDraftData({
      draft,
      draftSubmission,
      autoSaveKey,
      onProgress,
    })
    const draftsData = await getDraftsData()
    draftsData.drafts.push({
      ...draft,
      draftDataId,
    })
    await utilsService.localForage.setItem(`DRAFTS_${username}`, draftsData)
    executeDraftsListeners(draftsData)
    syncDrafts({
      throwError: false,
      formsAppId: draftSubmission.formsAppId,
    })
  } catch (err) {
    Sentry.captureException(err)
    throw errorHandler(err as Error)
  }
}

/**
 * Update a Draft in the local store and sync it with remote drafts. Will also
 * handle cleaning up auto save data (if the `autoSaveKey` property is passed).
 *
 * #### Example
 *
 * ```js
 * const draft = {
 *   draftId: 'd3aeb944-d0b3-11ea-87d0-0242ac130003',
 *   title: 'I Will Finish This Later',
 *   formId: 1,
 *   externalId: 'external'
 *   jobId: '0ac41494-723b-4a5d-90bb-534b8360f31d',
 *   previousFormSubmissionApprovalId: '7fa79583-ec45-4ffc-8f72-4be80ef2c2b7',
 * }
 * const data = {
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here'
 *   },
 *   definition: OneBlinkForm,
 * }
 * await draftService.updateDraft(
 *   draft,
 *   data,
 * )
 * ```
 *
 * @param options
 * @returns
 */
export async function updateDraft({
  draft,
  draftSubmission,
  autoSaveKey,
  onProgress,
}: {
  draft: SubmissionTypes.FormsAppDraft
  draftSubmission: DraftSubmission
  autoSaveKey?: string
  onProgress?: ProgressListener
}): Promise<void> {
  const now = new Date().toISOString()
  draftSubmission.keyId = getFormsKeyId() || undefined
  draft.updatedAt = undefined
  if (draftSubmission.keyId) {
    await upsertDraftByKey(draft, draftSubmission)
    return
  }

  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError(
      'You cannot update drafts until you have logged in. Please login and try again.',
      {
        requiresLogin: true,
      },
    )
  }
  try {
    const draftsData = await getDraftsData()
    const existingDraft = draftsData.drafts.find(
      (d) => d.draftId === draft.draftId,
    )
    if (!existingDraft) {
      console.log('Could not find existing draft to update in drafts', {
        draft,
        draftsData,
      })
    } else {
      await removeDraftData(existingDraft.draftDataId)
      // draftId will be set as draftDataId if data cannot be uploaded
      const draftDataId = await saveDraftData({
        draft,
        draftSubmission,
        autoSaveKey,
        onProgress,
      })
      existingDraft.draftDataId = draftDataId
      existingDraft.title = draft.title
      existingDraft.updatedAt = now
      existingDraft.updatedBy = getUserProfile() || undefined
      await utilsService.localForage.setItem(`DRAFTS_${username}`, draftsData)
      executeDraftsListeners(draftsData)
    }
    syncDrafts({
      throwError: false,
      formsAppId: draftSubmission.formsAppId,
    })
  } catch (err) {
    Sentry.captureException(err)
    throw errorHandler(err as Error)
  }
}

async function getDraftsData(): Promise<DraftsData> {
  const username = getUsername()
  if (!username) {
    return {
      drafts: [],
    }
  }
  return utilsService.localForage
    .getItem(`DRAFTS_${username}`)
    .then((data) => (data as DraftsData) || { drafts: [] })
    .catch((err) => {
      Sentry.captureException(err)
      throw errorHandler(err)
    })
}

/**
 * Get an array of Drafts for the currently logged in user.
 *
 * #### Example
 *
 * ```js
 * const drafts = await draftService.getDrafts()
 * ```
 *
 * @returns
 */
export async function getDrafts(): Promise<SubmissionTypes.FormsAppDraft[]> {
  // Get list of pending submissions
  const [draftsData, pendingSubmissions] = await Promise.all([
    getDraftsData(),
    getPendingQueueSubmissions(),
  ])
  // Remove drafts that are in the pending queue
  return draftsData.drafts.filter(
    (draft) => !pendingSubmissions.some((sub) => sub.draftId === draft.draftId),
  )
}

/**
 * Get a single Draft and the associated submission data.
 *
 * #### Example
 *
 * ```js
 * const draftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003'
 * const { draft, draftData, lastElementUpdated } =
 *   await draftService.getDraftAndData(draftId)
 * // use "draftData" to prefill a from
 * ```
 *
 * @param draftId
 * @returns
 */
export async function getDraftAndData(
  draftId: string | MiscTypes.NoU,
): Promise<{
  draft: SubmissionTypes.FormsAppDraft
  draftData: DraftSubmission['submission']
  lastElementUpdated: FormTypes.FormElement | undefined
} | null> {
  if (!draftId) {
    return null
  }

  const draft = await getDrafts().then((drafts) =>
    drafts.find((draft) => draft.draftId === draftId),
  )
  if (!draft || !draft.formId || !draft.draftDataId) {
    return null
  }

  const draftSubmission = await getDraftData(draft.formId, draft.draftDataId)

  return {
    draftData: draftSubmission.submission,
    lastElementUpdated: draftSubmission.lastElementUpdated,
    draft,
  }
}

/**
 * Remove a draft from the local store and sync with remote drafts.
 *
 * #### Example
 *
 * ```js
 * const draftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003'
 * await draftService.deleteDraft(draftId)
 * ```
 *
 * @param draftId
 * @param formsAppId
 * @returns
 */
export async function deleteDraft(
  draftId: string,
  formsAppId: number,
): Promise<void> {
  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError(
      'You cannot delete drafts until you have logged in. Please login and try again.',
      {
        requiresLogin: true,
      },
    )
  }
  return getDraftsData()
    .then((draftsData) => {
      const draft = draftsData.drafts.find((draft) => draft.draftId === draftId)
      if (!draft) {
        console.log('Could not find existing draft to delete in drafts', {
          draftId,
          draftsData,
        })
        return
      }
      draftsData.drafts = draftsData.drafts.filter(
        (draft) => draft.draftId !== draftId,
      )
      return removeDraftData(draft.draftDataId)
        .then(() =>
          utilsService.localForage.setItem(`DRAFTS_${username}`, draftsData),
        )
        .then(() => executeDraftsListeners(draftsData))
        .then(() =>
          syncDrafts({
            throwError: false,
            formsAppId,
          }),
        )
    })
    .catch((err) => {
      Sentry.captureException(err)
      throw errorHandler(err)
    })
}

async function setDrafts(draftsData: PutDraftsPayload): Promise<void> {
  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError(
      'You cannot set your drafts until you have logged in. Please login and try again.',
      {
        requiresLogin: true,
      },
    )
  }
  await utilsService.localForage.setItem(`DRAFTS_${username}`, draftsData)
  executeDraftsListeners(draftsData)
}

let _isSyncingDrafts = false

/**
 * Force a sync of remote drafts with locally stored drafts. This function will
 * swallow all errors thrown unless `true` is passed for the `throwError` property.
 *
 * #### Example
 *
 * ```js
 * await draftService.syncDrafts({
 *   throwError: true,
 *   formsAppId: 1,
 * })
 * ```
 *
 * @param param0
 * @returns
 */
export async function syncDrafts({
  formsAppId,
  throwError,
}: {
  /** The id of the OneBlink Forms App to sync drafts with */
  formsAppId: number
  /** `true` to throw errors while syncing */
  throwError?: boolean
}): Promise<void> {
  if (!isLoggedIn()) {
    console.log('Drafts cannot be synced until user has logged in.')
    return
  }

  if (_isSyncingDrafts) {
    console.log('Application is currently syncing drafts.')
    return
  }
  _isSyncingDrafts = true

  console.log('Start attempting to sync drafts.')
  try {
    const localDraftsData = await getDraftsData()
    console.log(
      `Found ${localDraftsData.drafts.length} local drafts(s).`,
      localDraftsData,
    )
    const draftsData = await ensureDraftsDataIsUploaded(localDraftsData)
    const syncDraftsData = await putDrafts(draftsData, formsAppId)
    await setDrafts(syncDraftsData)
    console.log(
      'Ensuring all draft data is available for offline use for synced drafts',
      syncDraftsData,
    )
    await ensureDraftsDataExists(
      syncDraftsData.drafts.filter(
        (draft) => draft.draftId !== draft.draftDataId,
      ),
    )
    // Attempt to get drafts that have been deleted and
    // remove draft data from local storage
    const deletedLocalDrafts = _differenceBy(
      localDraftsData.drafts,
      syncDraftsData.drafts,
      'draftId',
    )
    console.log(
      'Removing local draft data for delete drafts',
      deletedLocalDrafts,
    )
    await Promise.all([
      deletedLocalDrafts.map(({ draftDataId }) => removeDraftData(draftDataId)),
    ])
    console.log('Finished syncing drafts.')
    _isSyncingDrafts = false
  } catch (error) {
    _isSyncingDrafts = false
    console.warn(
      'Error while attempting to sync and update local drafts',
      error,
    )
    if (!(error instanceof OneBlinkAppsError)) {
      Sentry.captureException(error)
    }
    if (throwError) {
      throw error
    }
  }
}
