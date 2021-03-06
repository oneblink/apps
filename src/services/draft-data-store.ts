import OneBlinkAppsError from './errors/oneBlinkAppsError'
import utilsService from './utils'

import { uploadDraftData, downloadDraftData } from './api/drafts'
import { MiscTypes, SubmissionTypes } from '@oneblink/types'
function getDraftDataKey(draftDataId: string) {
  return `DRAFT_DATA_${draftDataId}`
}

async function getLocalDraftData(
  draftDataId: MiscTypes.NoU | string,
): Promise<SubmissionTypes.DraftSubmission | null> {
  if (!draftDataId) {
    return null
  }
  const key = getDraftDataKey(draftDataId)
  return utilsService.getLocalForageItem(key)
}

async function setLocalDraftData(
  draftDataId: string,
  model: SubmissionTypes.DraftSubmission,
): Promise<SubmissionTypes.DraftSubmission> {
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

export function saveDraftData(
  draft: SubmissionTypes.FormsAppDraft,
  draftSubmission: SubmissionTypes.DraftSubmission,
  defaultDraftDataId: string,
): Promise<string> {
  return uploadDraftData(draft, draftSubmission)
    .catch((error: Error) => {
      // Ignoring all errors here as we don't want draft submission data
      // being saved to the cloud to prevent drafts from being saved on the device
      console.warn('Could not upload Draft Data as JSON', error)
      return defaultDraftDataId
    })
    .then((draftDataId) =>
      setLocalDraftData(draftDataId, draftSubmission).then(() => draftDataId),
    )
}

export async function getDraftData(
  formId: number,
  draftDataId: string,
): Promise<SubmissionTypes.DraftSubmission> {
  return getLocalDraftData(draftDataId)
    .then((draftData) => {
      if (draftData) return draftData

      return downloadDraftData<SubmissionTypes.DraftSubmission>(
        formId,
        draftDataId,
      ).then((downloadedDraftData) =>
        setLocalDraftData(draftDataId, downloadedDraftData),
      )
    })
    .then((formSubmissionResult) => {
      if (!formSubmissionResult) {
        throw new Error('draft data does not exist')
      }
      return formSubmissionResult
    })
    .catch((error) => {
      console.warn('Could not download Draft Data as JSON', error)
      throw new OneBlinkAppsError(
        'The draft data associated to this form is no longer available',
        {
          title: 'Draft Data Unavailable',
          originalError: error,
        },
      )
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

export async function ensureDraftsDataIsUploaded(
  draftsData: SubmissionTypes.FormsAppDrafts,
) {
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
    const newDraftDataId = await saveDraftData(
      draft,
      draftSubmission,
      draft.draftId,
    )
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
