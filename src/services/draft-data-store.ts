import utilsService from './utils'

import {
  uploadDraftData,
  downloadDraftData,
  PutDraftsPayload,
} from './api/drafts'
import { MiscTypes, SubmissionTypes } from '@oneblink/types'
import Sentry from '../Sentry'
import { DraftSubmission } from '../types/submissions'
import { deleteAutoSaveData } from '../auto-save-service'
import { ProgressListener } from './s3Submit'
function getDraftDataKey(draftDataId: string) {
  return `DRAFT_DATA_${draftDataId}`
}

async function getLocalDraftData(
  draftDataId: MiscTypes.NoU | string,
): Promise<DraftSubmission | null> {
  if (!draftDataId) {
    return null
  }
  const key = getDraftDataKey(draftDataId)
  return utilsService.getLocalForageItem(key)
}

async function setLocalDraftData(
  draftDataId: string,
  model: DraftSubmission,
): Promise<DraftSubmission> {
  const key = getDraftDataKey(draftDataId)
  return utilsService.setLocalForageItem(key, model)
}

export async function removeDraftData(
  draftDataId: MiscTypes.NoU | string,
): Promise<void> {
  if (!draftDataId) {
    return
  }
  const key = getDraftDataKey(draftDataId)
  return utilsService.removeLocalForageItem(key)
}

export async function saveDraftData({
  draft,
  draftSubmission,
  autoSaveKey,
  onProgress,
}: {
  draft: SubmissionTypes.FormsAppDraft
  draftSubmission: DraftSubmission
  autoSaveKey: string | undefined
  onProgress?: ProgressListener
}): Promise<string> {
  let draftDataId: string
  const defaultDraftDataId = draft.draftId
  try {
    draftDataId = await uploadDraftData(draft, draftSubmission, onProgress)

    if (typeof autoSaveKey === 'string') {
      try {
        await deleteAutoSaveData(draftSubmission.definition.id, autoSaveKey)
      } catch (error) {
        console.warn('Error removing auto save data: ', error)
        Sentry.captureException(error)
      }
    }
  } catch (error) {
    Sentry.captureException(error)
    // Ignoring all errors here as we don't want draft submission data
    // being saved to the cloud to prevent drafts from being saved on the device
    console.warn('Could not upload Draft Data as JSON', error)
    draftDataId = defaultDraftDataId
  }
  await setLocalDraftData(draftDataId, draftSubmission)
  return draftDataId
}

export async function getDraftData(
  formId: number,
  draftDataId: string,
): Promise<DraftSubmission> {
  return getLocalDraftData(draftDataId)
    .then((draftData) => {
      if (draftData) return draftData

      return downloadDraftData<DraftSubmission>(formId, draftDataId).then(
        (downloadedDraftData) =>
          setLocalDraftData(draftDataId, downloadedDraftData),
      )
    })
    .then((formSubmissionResult) => {
      if (!formSubmissionResult) {
        throw new Error('draft data does not exist')
      }
      return formSubmissionResult
    })
}

export async function ensureDraftsDataExists(
  drafts: SubmissionTypes.FormsAppDraft[],
) {
  if (!Array.isArray(drafts)) {
    return
  }

  const keys = await utilsService.localForage.keys()
  for (const draft of drafts) {
    const draftDataId = draft.draftDataId
    if (
      !draft.formId ||
      !draftDataId ||
      keys.some((key) => key === getDraftDataKey(draftDataId))
    ) {
      return
    }
    await getDraftData(draft.formId, draftDataId).catch((error) => {
      console.warn('Could not download Draft Data as JSON', error)
    })
  }
}

export async function ensureDraftsDataIsUploaded(draftsData: PutDraftsPayload) {
  const newDrafts = []
  for (const draft of draftsData.drafts) {
    // draftId will be set as draftDataId if data cannot be uploaded
    if (draft.draftId !== draft.draftDataId) {
      newDrafts.push(draft)
      continue
    }

    const draftSubmission = await getLocalDraftData(draft.draftDataId)
    if (!draftSubmission) {
      continue
    }

    console.log('Uploading draft data that was saved while offline', draft)
    const newDraftDataId = await saveDraftData({
      draft,
      draftSubmission,
      autoSaveKey: undefined,
    })
    newDrafts.push(
      Object.assign({}, draft, {
        draftDataId: newDraftDataId,
      }),
    )
  }
  return {
    ...draftsData,
    drafts: newDrafts,
  }
}
