import { v4 as uuidv4 } from 'uuid'
import _orderBy from 'lodash.orderby'
import utilsService from './services/utils'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { getUsername, isLoggedIn } from './services/cognito'
import { getFormsKeyId } from './auth-service'
import { getFormSubmissionDrafts, uploadDraftData } from './services/api/drafts'
import { getPendingQueueSubmissions } from './services/pending-queue'
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
  PendingFormSubmission,
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
  pendingSubmissions: PendingFormSubmission[],
): Promise<LocalFormSubmissionDraft[]> {
  const localFormSubmissionDrafts: LocalFormSubmissionDraft[] =
    localDraftsStorage.unsyncedDraftSubmissions.map((draftSubmission) => ({
      formsAppId: draftSubmission.formsAppId,
      formId: draftSubmission.definition.id,
      externalId: draftSubmission.externalId,
      jobId: draftSubmission.jobId,
      previousFormSubmissionApprovalId:
        draftSubmission.previousFormSubmissionApprovalId,
      taskId: draftSubmission.taskCompletion?.task.taskId,
      taskGroupInstanceId:
        draftSubmission.taskCompletion?.taskGroupInstance?.taskGroupInstanceId,
      taskActionId: draftSubmission.taskCompletion?.taskAction.taskActionId,
      draftSubmission,
      versions: undefined,
    }))

  for (const formSubmissionDraft of localDraftsStorage.syncedFormSubmissionDrafts) {
    if (
      !pendingSubmissions.some(
        (sub) => sub.formSubmissionDraftId === formSubmissionDraft.id,
      )
    ) {
      try {
        const draftSubmission = await getDraftSubmission(formSubmissionDraft)
        localFormSubmissionDrafts.push({
          ...formSubmissionDraft,
          draftSubmission,
        })
      } catch (err) {
        console.warn(
          `Could not fetch draft submission for draft: ${formSubmissionDraft.id}`,
          err,
        )
        localFormSubmissionDrafts.push({
          ...formSubmissionDraft,
          draftSubmission: undefined,
        })
      }
    }
  }

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
    await generateLocalFormSubmissionDraftsFromStorage(localDraftsStorage, [])
  for (const draftsListener of draftsListeners) {
    draftsListener(localFormSubmissionDrafts)
  }
}

async function upsertDraftByKey(
  draftSubmission: DraftSubmission,
  onProgress?: ProgressListener,
  abortSignal?: AbortSignal,
): Promise<void> {
  if (isOffline()) {
    throw new OneBlinkAppsError('Drafts cannot be saved while offline.', {
      isOffline: true,
    })
  }

  await uploadDraftData(draftSubmission, onProgress, abortSignal)
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
async function addDraft({
  draftSubmissionInput,
  autoSaveKey,
  onProgress,
  abortSignal,
}: {
  draftSubmissionInput: DraftSubmissionInput
  autoSaveKey?: string
  onProgress?: ProgressListener
  abortSignal?: AbortSignal
}): Promise<void> {
  const draftSubmission: DraftSubmission = {
    ...draftSubmissionInput,
    createdAt: new Date().toISOString(),
    formSubmissionDraftId: uuidv4(),
  }
  const keyId = getFormsKeyId() || undefined
  if (keyId) {
    await upsertDraftByKey(draftSubmission, onProgress, abortSignal)
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

  try {
    // Push draft data to s3 (should also update local storage draft data)
    // add drafts to array in local storage
    // sync local storage drafts with server
    const formSubmissionDraftVersion = await saveDraftSubmission({
      draftSubmission,
      autoSaveKey,
      onProgress,
    })
    const localDraftsStorage = await getLocalDrafts()
    if (formSubmissionDraftVersion) {
      const formSubmissionDrafts = await getFormSubmissionDrafts(
        draftSubmission.formsAppId,
        abortSignal,
      )
      localDraftsStorage.syncedFormSubmissionDrafts = formSubmissionDrafts
    } else {
      localDraftsStorage.unsyncedDraftSubmissions.push(draftSubmission)
    }
    await setDrafts(localDraftsStorage)
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
async function updateDraft({
  formSubmissionDraftId,
  draftSubmissionInput,
  autoSaveKey,
  onProgress,
  abortSignal,
}: {
  formSubmissionDraftId: string
  draftSubmissionInput: DraftSubmissionInput
  autoSaveKey?: string
  onProgress?: ProgressListener
  abortSignal?: AbortSignal
}): Promise<void> {
  const draftSubmission: DraftSubmission = {
    ...draftSubmissionInput,
    createdAt: new Date().toISOString(),
    formSubmissionDraftId,
  }

  const keyId = getFormsKeyId()
  if (keyId) {
    await upsertDraftByKey(draftSubmission, onProgress, abortSignal)
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
      localDraftsStorage.syncedFormSubmissionDrafts =
        await getFormSubmissionDrafts(draftSubmission.formsAppId, abortSignal)
      // Remove draft from unsynced incase it was created offline
      localDraftsStorage.unsyncedDraftSubmissions =
        localDraftsStorage.unsyncedDraftSubmissions.filter(
          (unsyncedDraftSubmission) =>
            unsyncedDraftSubmission.formSubmissionDraftId !==
            formSubmissionDraftId,
        )
    } else {
      let updated = false
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

      if (!updated) {
        localDraftsStorage.unsyncedDraftSubmissions.push(draftSubmission)
      }
    }

    await setDrafts(localDraftsStorage)

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
  // Get list of pending submissions
  const [localDraftsStorage, pendingSubmissions] = await Promise.all([
    getLocalDrafts(),
    getPendingQueueSubmissions(),
  ])
  // Remove drafts that are in the pending queue
  return generateLocalFormSubmissionDraftsFromStorage(
    localDraftsStorage,
    pendingSubmissions,
  )
}

async function tryGetFormSubmissionDrafts(
  formsAppId: number,
  abortSignal: AbortSignal | undefined,
) {
  const localDraftsStorage = await getLocalDrafts()
  try {
    localDraftsStorage.syncedFormSubmissionDrafts =
      await getFormSubmissionDrafts(formsAppId, abortSignal)
    await setDrafts(localDraftsStorage)
  } catch (error) {
    if (!(error instanceof OneBlinkAppsError) || !error.isOffline) {
      throw error
    }
  }
  return localDraftsStorage.syncedFormSubmissionDrafts
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

  const formSubmissionDrafts = await tryGetFormSubmissionDrafts(
    formsAppId,
    abortSignal,
  )

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

    await setDrafts(localDraftsStorage)

    syncDrafts({
      throwError: false,
      formsAppId,
    })
  } catch (err) {
    Sentry.captureException(err)
    throw errorHandler(err as Error)
  }
}

async function setDrafts(
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
    localDraftsStorage.syncedFormSubmissionDrafts =
      await getFormSubmissionDrafts(formsAppId, abortSignal)
    await setDrafts(localDraftsStorage)

    console.log(
      'Ensuring all draft data is available for offline use for synced drafts',
      localDraftsStorage.syncedFormSubmissionDrafts,
    )
    if (localDraftsStorage.syncedFormSubmissionDrafts.length) {
      for (const formSubmissionDraft of localDraftsStorage.syncedFormSubmissionDrafts) {
        await getDraftSubmission(formSubmissionDraft, abortSignal).catch(
          (error) => {
            console.warn('Could not download Draft Data as JSON', error)
          },
        )
      }
    }

    console.log(
      `Attempting to upload ${localDraftsStorage.unsyncedDraftSubmissions.length} local unsycned drafts(s).`,
    )
    if (localDraftsStorage.unsyncedDraftSubmissions.length) {
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
      await setDrafts(localDraftsStorage)
    }

    console.log(
      'Removing local draft data for deleted drafts',
      localDraftsStorage.deletedFormSubmissionDrafts,
    )
    if (localDraftsStorage.deletedFormSubmissionDrafts.length) {
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
      await setDrafts(localDraftsStorage)
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
  addDraft,
  updateDraft,
  getDraftAndData,
  getDrafts,
  deleteDraft,
  syncDrafts,
  getLatestFormSubmissionDraftVersion,
  LocalFormSubmissionDraft,
}
