import _differenceBy from 'lodash.differenceby'
import { v4 as uuidv4 } from 'uuid'

import utilsService from './services/utils'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { getUsername, isLoggedIn } from './services/cognito'
import { getFormsKeyId } from './auth-service'
import { uploadDraftData, putDrafts } from './services/api/drafts'
import { getPendingQueueSubmissions } from './services/pending-queue'
import {
  getDraftData,
  saveDraftData,
  removeDraftData,
  ensureDraftsDataExists,
  ensureDraftsDataIsUploaded,
} from './services/draft-data-store'
import { MiscTypes, SubmissionTypes } from '@oneblink/types'
import Sentry from './Sentry'
import { DraftSubmission } from './types/submissions'

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

export async function addDraft(
  newDraft: SubmissionTypes.NewFormsAppDraft,
  draftSubmission: DraftSubmission,
): Promise<void> {
  const draft: SubmissionTypes.FormsAppDraft = {
    ...newDraft,
    updatedAt: new Date().toISOString(),
    draftId: uuidv4(),
  }
  draftSubmission.keyId = getFormsKeyId() || undefined
  if (draftSubmission.keyId) {
    await upsertDraftByKey(draft, draftSubmission)
    return
  }

  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError('Must be logged in to manage drafts', {
      requiresLogin: true,
    })
  }
  // Push draft data to s3 (should also update local storage draft data)
  // add drafts to array in local storage
  // sync local storage drafts with server
  // draftId will be set as draftDataId if data cannot be uploaded
  return saveDraftData(draft, draftSubmission, draft.draftId)
    .then((draftDataId) => {
      return getDraftsData().then((draftsData) => {
        draftsData.drafts.push({
          ...draft,
          draftDataId,
        })
        return utilsService.localForage
          .setItem(`DRAFTS_${username}`, draftsData)
          .then(() => executeDraftsListeners(draftsData))
      })
    })
    .then(() =>
      syncDrafts({
        throwError: false,
        formsAppId: draftSubmission.formsAppId,
      }),
    )
    .catch((err) => {
      Sentry.captureException(err)
      throw errorHandler(err)
    })
}

export async function updateDraft(
  draft: SubmissionTypes.FormsAppDraft,
  draftSubmission: DraftSubmission,
): Promise<void> {
  draftSubmission.keyId = getFormsKeyId() || undefined
  if (draftSubmission.keyId) {
    await upsertDraftByKey(draft, draftSubmission)
    return
  }

  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError('Must be logged in to manage drafts', {
      requiresLogin: true,
    })
  }
  return getDraftsData()
    .then((draftsData) => {
      const existingDraft = draftsData.drafts.find(
        (d) => d.draftId === draft.draftId,
      )
      if (!existingDraft) {
        console.log('Could not find existing draft to update in drafts', {
          draft,
          draftsData,
        })
        return
      }

      return removeDraftData(existingDraft.draftDataId)
        .then(() =>
          // draftId will be set as draftDataId if data cannot be uploaded
          saveDraftData(draft, draftSubmission, draft.draftId),
        )
        .then((draftDataId) => {
          existingDraft.draftDataId = draftDataId
          existingDraft.title = draft.title
          existingDraft.updatedAt = new Date().toISOString()
          return utilsService.localForage
            .setItem(`DRAFTS_${username}`, draftsData)
            .then(() => executeDraftsListeners(draftsData))
        })
    })
    .then(() =>
      syncDrafts({
        throwError: false,
        formsAppId: draftSubmission.formsAppId,
      }),
    )
    .catch((err) => {
      Sentry.captureException(err)
      throw errorHandler(err)
    })
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

export async function getDraftAndData(
  draftId: string | MiscTypes.NoU,
): Promise<{
  draft: SubmissionTypes.FormsAppDraft
  draftData: DraftSubmission['submission']
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
    draft,
  }
}

export async function deleteDraft(
  draftId: string,
  formsAppId: number,
): Promise<void> {
  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError('Must be logged in to manage drafts', {
      requiresLogin: true,
    })
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

async function setDrafts(
  draftsData: SubmissionTypes.FormsAppDrafts,
): Promise<void> {
  const username = getUsername()
  if (!username) {
    throw new OneBlinkAppsError('Must be logged in to manage drafts', {
      requiresLogin: true,
    })
  }
  await utilsService.localForage.setItem(`DRAFTS_${username}`, draftsData)
  executeDraftsListeners(draftsData)
}

let _isSyncingDrafts = false

export async function syncDrafts({
  formsAppId,
  throwError,
}: {
  formsAppId: number
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
    Sentry.captureException(error)
    _isSyncingDrafts = false
    console.warn(
      'Error while attempting to sync and update local drafts',
      error,
    )
    if (throwError) {
      throw error
    }
  }
}
