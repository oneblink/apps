import { v4 as uuidv4 } from 'uuid'
import _orderBy from 'lodash.orderby'
import utilsService from './services/utils'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { getUsername, isLoggedIn } from './services/cognito'
import { getFormsKeyId } from './auth-service'
import { getFormSubmissionDrafts, uploadDraftData } from './services/api/drafts'
import {
  getPendingQueueSubmissions,
  deletePendingQueueSubmission,
} from './services/pending-queue'
import {
  deleteDraftData,
  getDraftSubmission,
  getLatestFormSubmissionDraftVersion,
  getLocalDraftSubmission,
  removeLocalDraftSubmission,
  saveDraftSubmission,
} from './services/draft-data-store'
import { SubmissionTypes } from '@oneblink/types'
import Sentry from './Sentry'
import {
  DraftSubmission,
  DraftSubmissionInput,
  LocalFormSubmissionDraft,
  ProgressListener,
} from './types/submissions'

function generateDraftsKey(username: string) {
  return `V2_DRAFTS_${username}`
}

interface LocalDraftsStorage {
  deletedFormSubmissionDrafts: SubmissionTypes.FormSubmissionDraft[]
  unsyncedDraftSubmissions: DraftSubmission[]
  syncedFormSubmissionDrafts: SubmissionTypes.FormSubmissionDraft[]
}

async function generateLocalFormSubmissionDraftsFromStorage(
  localDraftsStorage: LocalDraftsStorage,
): Promise<LocalFormSubmissionDraft[]> {
  // Get list of pending submissions
  const pendingSubmissions = await getPendingQueueSubmissions()
  const pendingSubmissionsDraftIds = pendingSubmissions.reduce<Set<string>>(
    (memo, pendingSubmission) => {
      if (pendingSubmission.formSubmissionDraftId) {
        memo.add(pendingSubmission.formSubmissionDraftId)
      }
      return memo
    },
    new Set<string>(),
  )
  const deletedDraftIds = new Set(
    localDraftsStorage.deletedFormSubmissionDrafts.map(({ id }) => id),
  )

  const localFormSubmissionDraftsMap = new Map<
    string,
    LocalFormSubmissionDraft
  >()

  for (const draftSubmission of localDraftsStorage.unsyncedDraftSubmissions) {
    if (
      // Remove drafts that are in the pending queue
      !pendingSubmissionsDraftIds.has(draftSubmission.formSubmissionDraftId) &&
      // Remove any drafts deleted while offline
      !deletedDraftIds.has(draftSubmission.formSubmissionDraftId)
    ) {
      localFormSubmissionDraftsMap.set(draftSubmission.formSubmissionDraftId, {
        formsAppId: draftSubmission.formsAppId,
        formId: draftSubmission.definition.id,
        externalId: draftSubmission.externalId,
        jobId: draftSubmission.jobId,
        previousFormSubmissionApprovalId:
          draftSubmission.previousFormSubmissionApprovalId,
        taskId: draftSubmission.taskCompletion?.task.taskId,
        taskGroupInstanceId:
          draftSubmission.taskCompletion?.taskGroupInstance
            ?.taskGroupInstanceId,
        taskActionId: draftSubmission.taskCompletion?.taskAction.taskActionId,
        draftSubmission,
        versions: undefined,
      })
    }
  }

  for (const formSubmissionDraft of localDraftsStorage.syncedFormSubmissionDrafts) {
    if (
      // Unsycned version of draft takes priority over the synced version
      !localFormSubmissionDraftsMap.has(formSubmissionDraft.id) &&
      // Remove drafts that are in the pending queue
      !pendingSubmissionsDraftIds.has(formSubmissionDraft.id) &&
      // Remove any drafts deleted while offline
      !deletedDraftIds.has(formSubmissionDraft.id)
    ) {
      const draftSubmission = await getDraftSubmission(
        formSubmissionDraft,
      ).catch((err) => {
        console.warn(
          `Could not fetch draft submission for draft: ${formSubmissionDraft.id}`,
          err,
        )
        return undefined
      })
      localFormSubmissionDraftsMap.set(formSubmissionDraft.id, {
        ...formSubmissionDraft,
        draftSubmission,
      })
    }
  }

  const localFormSubmissionDrafts = Array.from(
    localFormSubmissionDraftsMap.values(),
  )

  return _orderBy(localFormSubmissionDrafts, (localFormSubmissionDraft) => {
    return (
      localFormSubmissionDraft.draftSubmission?.createdAt ||
      getLatestFormSubmissionDraftVersion(localFormSubmissionDraft.versions)
        ?.createdAt
    )
  })
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

const draftsListeners: Array<(drafts: LocalFormSubmissionDraft[]) => unknown> =
  []

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
function registerDraftsListener(
  listener: (drafts: LocalFormSubmissionDraft[]) => unknown,
): () => void {
  draftsListeners.push(listener)

  return () => {
    const index = draftsListeners.indexOf(listener)
    if (index !== -1) {
      draftsListeners.splice(index, 1)
    }
  }
}

async function executeDraftsListeners(localDraftsStorage: LocalDraftsStorage) {
  console.log('Drafts have been updated', localDraftsStorage)
  const localFormSubmissionDrafts =
    await generateLocalFormSubmissionDraftsFromStorage(localDraftsStorage)
  for (const draftsListener of draftsListeners) {
    draftsListener(localFormSubmissionDrafts)
  }
}

/**
 * Create or update a Draft in the local store and sync it with remote drafts.
 * Will also handle cleaning up auto save data (if the `autoSaveKey` property is
 * passed).
 *
 * #### Example
 *
 * ```js
 * const abortController = new AbortController()
 * const formSubmissionDraftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003' // pass `undefined` to create a new draft
 * const autoSaveKey = 'SET ME TO DELETE AUTOSAVE DATA AFTER SAVING DRAFT'
 * const draftSubmissionInput = {
 *   title: 1,
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here',
 *   },
 *   definition: {
 *     form: 'definition',
 *     goes: 'here',
 *   },
 * }
 * await draftService.upsertDraft({
 *   formSubmissionDraftId,
 *   autoSaveKey,
 *   draftSubmissionInput,
 *   abortSignal: abortController.signal,
 *   onProgress: (progress) => {
 *     // ...
 *   },
 * })
 * ```
 *
 * @param options
 * @returns
 */
async function upsertDraft({
  formSubmissionDraftId,
  draftSubmissionInput,
  autoSaveKey,
  onProgress,
  abortSignal,
  pendingTimestamp,
}: {
  formSubmissionDraftId: string | undefined
  draftSubmissionInput: DraftSubmissionInput
  autoSaveKey?: string
  onProgress?: ProgressListener
  abortSignal?: AbortSignal
  pendingTimestamp?: string
}): Promise<void> {
  const draftSubmission: DraftSubmission = {
    ...draftSubmissionInput,
    createdAt: new Date().toISOString(),
    formSubmissionDraftId: formSubmissionDraftId || uuidv4(),
  }

  const keyId = getFormsKeyId()
  if (keyId) {
    if (isOffline()) {
      throw new OneBlinkAppsError('Drafts cannot be saved while offline.', {
        isOffline: true,
      })
    }

    await uploadDraftData(draftSubmission, onProgress, abortSignal)
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
    const localDraftsStorage = await getLocalDrafts()

    const formSubmissionDraftVersion = await saveDraftSubmission({
      draftSubmission,
      autoSaveKey,
      onProgress,
    })
    if (formSubmissionDraftVersion) {
      console.log('Draft was saved on server', formSubmissionDraftVersion)
      localDraftsStorage.syncedFormSubmissionDrafts =
        await getFormSubmissionDrafts(draftSubmission.formsAppId, abortSignal)
      // Remove draft from unsynced incase it was created offline
      if (formSubmissionDraftId) {
        localDraftsStorage.unsyncedDraftSubmissions =
          localDraftsStorage.unsyncedDraftSubmissions.filter(
            (unsyncedDraftSubmission) =>
              unsyncedDraftSubmission.formSubmissionDraftId !==
              formSubmissionDraftId,
          )
      }
    } else {
      console.log(
        'Draft could not be saved on server, saving locally to sync later',
        draftSubmission,
      )
      let updated = false

      if (formSubmissionDraftId) {
        localDraftsStorage.unsyncedDraftSubmissions =
          localDraftsStorage.unsyncedDraftSubmissions.map(
            (unsyncedDraftSubmission) => {
              if (
                unsyncedDraftSubmission.formSubmissionDraftId ===
                formSubmissionDraftId
              ) {
                updated = true
                return draftSubmission
              }
              return unsyncedDraftSubmission
            },
          )
        // Remove draft from synced drafts incase it was retrieved while online
        localDraftsStorage.syncedFormSubmissionDrafts =
          localDraftsStorage.syncedFormSubmissionDrafts.filter(
            ({ id }) => id !== formSubmissionDraftId,
          )
      }

      if (!updated) {
        localDraftsStorage.unsyncedDraftSubmissions.push(draftSubmission)
      }
    }

    await setAndBroadcastDrafts(localDraftsStorage)

    if (pendingTimestamp) {
      await deletePendingQueueSubmission(pendingTimestamp)
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

async function getLocalDrafts(): Promise<LocalDraftsStorage> {
  const username = getUsername()
  if (username) {
    try {
      const localDraftsStorage =
        await utilsService.localForage.getItem<LocalDraftsStorage>(
          generateDraftsKey(username),
        )
      if (localDraftsStorage) {
        return localDraftsStorage
      }
    } catch (err) {
      Sentry.captureException(err)
      throw errorHandler(err as Error)
    }
  }

  return {
    unsyncedDraftSubmissions: [],
    syncedFormSubmissionDrafts: [],
    deletedFormSubmissionDrafts: [],
  }
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
async function getDrafts(): Promise<LocalFormSubmissionDraft[]> {
  const localDraftsStorage = await getLocalDrafts()
  return await generateLocalFormSubmissionDraftsFromStorage(localDraftsStorage)
}

async function tryGetFormSubmissionDrafts(
  formsAppId: number,
  abortSignal: AbortSignal | undefined,
) {
  try {
    return await getFormSubmissionDrafts(formsAppId, abortSignal)
  } catch (error) {
    if (!(error instanceof OneBlinkAppsError) || !error.isOffline) {
      throw error
    }
  }
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
async function getDraftAndData(
  formsAppId: number,
  formSubmissionDraftId: string | undefined | null,
  abortSignal: AbortSignal | undefined,
): Promise<DraftSubmission | undefined> {
  if (!formSubmissionDraftId) {
    return
  }

  let formSubmissionDrafts = await tryGetFormSubmissionDrafts(
    formsAppId,
    abortSignal,
  )
  const localDraftsStorage = await getLocalDrafts()
  if (formSubmissionDrafts) {
    localDraftsStorage.syncedFormSubmissionDrafts = formSubmissionDrafts
    await setAndBroadcastDrafts(localDraftsStorage)
  } else {
    formSubmissionDrafts = localDraftsStorage.syncedFormSubmissionDrafts
  }

  const formSubmissionDraft = formSubmissionDrafts.find(
    ({ id }) => id === formSubmissionDraftId,
  )
  if (!formSubmissionDraft) {
    return (await getLocalDraftSubmission(formSubmissionDraftId)) || undefined
  }

  return await getDraftSubmission(formSubmissionDraft)
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
async function deleteDraft(
  formSubmissionDraftId: string,
  formsAppId: number,
  abortSignal?: AbortSignal,
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
  try {
    await removeLocalDraftSubmission(formSubmissionDraftId)
    const localDraftsStorage = await getLocalDrafts()
    const formSubmissionDraft =
      localDraftsStorage.syncedFormSubmissionDrafts.find(
        ({ id }) => id === formSubmissionDraftId,
      )
    if (formSubmissionDraft) {
      const { hasDeletedRemoteDraft } = await deleteDraftData(
        formSubmissionDraftId,
        abortSignal,
      )
      localDraftsStorage.syncedFormSubmissionDrafts =
        localDraftsStorage.syncedFormSubmissionDrafts.filter(
          ({ id }) => id !== formSubmissionDraft.id,
        )
      if (!hasDeletedRemoteDraft) {
        localDraftsStorage.deletedFormSubmissionDrafts.push(formSubmissionDraft)
      }
    } else {
      console.log('Could not find existing draft in synced drafts to delete', {
        formSubmissionDraftId,
        localDraftsStorage,
      })
      const draftSubmission = localDraftsStorage.unsyncedDraftSubmissions.find(
        (draftSubmission) =>
          draftSubmission.formSubmissionDraftId === formSubmissionDraftId,
      )
      if (!draftSubmission) {
        return
      }

      localDraftsStorage.unsyncedDraftSubmissions =
        localDraftsStorage.unsyncedDraftSubmissions.filter(
          (draftSubmission) =>
            draftSubmission.formSubmissionDraftId !== formSubmissionDraftId,
        )
    }

    await setAndBroadcastDrafts(localDraftsStorage)

    syncDrafts({
      throwError: false,
      formsAppId,
    })
  } catch (err) {
    Sentry.captureException(err)
    throw errorHandler(err as Error)
  }
}

async function setAndBroadcastDrafts(
  localDraftsStorage: LocalDraftsStorage,
): Promise<void> {
  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError(
      'You cannot set your drafts until you have logged in. Please login and try again.',
      {
        requiresLogin: true,
      },
    )
  }
  await utilsService.localForage.setItem(
    generateDraftsKey(username),
    localDraftsStorage,
  )
  await executeDraftsListeners(localDraftsStorage)
}

let _isSyncingDrafts = false

/**
 * Force a sync of remote drafts with locally stored drafts. This function will
 * swallow all errors thrown unless `true` is passed for the `throwError`
 * property.
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
async function syncDrafts({
  formsAppId,
  throwError,
  abortSignal,
}: {
  /** The id of the OneBlink Forms App to sync drafts with */
  formsAppId: number
  /** `true` to throw errors while syncing */
  throwError?: boolean
  /** Signal to abort the requests */
  abortSignal?: AbortSignal
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
    let localDraftsStorage = await getLocalDrafts()
    if (localDraftsStorage.deletedFormSubmissionDrafts.length) {
      console.log(
        'Removing local draft data for deleted drafts',
        localDraftsStorage.deletedFormSubmissionDrafts,
      )
      const newDeletedFormSubmissionDrafts: SubmissionTypes.FormSubmissionDraft[] =
        []
      for (const formSubmissionDraft of localDraftsStorage.deletedFormSubmissionDrafts) {
        const { hasDeletedRemoteDraft } = await deleteDraftData(
          formSubmissionDraft.id,
          abortSignal,
        )
        if (!hasDeletedRemoteDraft) {
          newDeletedFormSubmissionDrafts.push(formSubmissionDraft)
        }
      }

      // Get local drafts again to ensure nothing has happened while processing
      localDraftsStorage = await getLocalDrafts()
      localDraftsStorage.deletedFormSubmissionDrafts =
        newDeletedFormSubmissionDrafts
    }

    if (localDraftsStorage.unsyncedDraftSubmissions.length) {
      console.log(
        `Attempting to upload ${localDraftsStorage.unsyncedDraftSubmissions.length} local unsynced drafts(s).`,
      )
      const newUnsyncedDraftSubmissions: DraftSubmission[] = []
      for (const draftSubmission of localDraftsStorage.unsyncedDraftSubmissions) {
        console.log(
          'Uploading draft data that was saved while offline',
          draftSubmission.title,
        )
        draftSubmission.backgroundUpload = false
        const formSubmissionDraftVersion = await saveDraftSubmission({
          draftSubmission,
          autoSaveKey: undefined,
          abortSignal,
        })
        if (!formSubmissionDraftVersion) {
          newUnsyncedDraftSubmissions.push(draftSubmission)
        }
      }
      // Get local drafts again to ensure nothing has happened while processing
      localDraftsStorage = await getLocalDrafts()
      localDraftsStorage.unsyncedDraftSubmissions = newUnsyncedDraftSubmissions
    }

    const formSubmissionDrafts = await tryGetFormSubmissionDrafts(
      formsAppId,
      abortSignal,
    )
    if (formSubmissionDrafts) {
      localDraftsStorage.syncedFormSubmissionDrafts = formSubmissionDrafts
    }

    await setAndBroadcastDrafts(localDraftsStorage)

    if (localDraftsStorage.syncedFormSubmissionDrafts.length) {
      console.log(
        'Ensuring all draft data is available for offline use for synced drafts',
        localDraftsStorage.syncedFormSubmissionDrafts,
      )
      for (const formSubmissionDraft of localDraftsStorage.syncedFormSubmissionDrafts) {
        await getDraftSubmission(formSubmissionDraft, abortSignal).catch(
          (error) => {
            console.warn('Could not download Draft Data as JSON', error)
          },
        )
      }
    }

    console.log('Finished syncing drafts.')
    _isSyncingDrafts = false
  } catch (error) {
    _isSyncingDrafts = false
    if (abortSignal?.aborted) {
      console.log('Syncing drafts has been aborted')
      return
    }
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

export {
  registerDraftsListener,
  upsertDraft,
  getDraftAndData,
  getDrafts,
  deleteDraft,
  syncDrafts,
  getLatestFormSubmissionDraftVersion,
  LocalFormSubmissionDraft,
}
