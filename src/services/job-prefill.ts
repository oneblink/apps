import utilsService from './utils'
import { downloadPreFillFormData } from './api/prefill'
import { MiscTypes, SubmissionTypes } from '@oneblink/types'

export function getPrefillKey(prefillFormDataId: string) {
  return `V2_PREFILL_${prefillFormDataId}`
}

function get<T>(prefillFormDataId: string): Promise<T | null> {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.getLocalForageItem(key)
}

function set<T extends Record<string, unknown>>(
  prefillFormDataId: string,
  model: T,
): Promise<T> {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.setLocalForageItem(key, model)
}

export async function getPrefillFormData<T extends Record<string, unknown>>(
  formId: number,
  prefillFormDataId: string | MiscTypes.NoU,
): Promise<T | null> {
  if (!prefillFormDataId) {
    return null
  }

  return get<T>(prefillFormDataId).then((prefillData) => {
    if (prefillData) return prefillData

    return downloadPreFillFormData<T>(formId, prefillFormDataId).then(
      (downloadedPrefillData) =>
        set<T>(prefillFormDataId, downloadedPrefillData),
    )
  })
}

export async function ensurePrefillFormDataExists(
  jobs: SubmissionTypes.FormsAppJob[],
): Promise<void> {
  if (!jobs.length) {
    return
  }

  const keys = await utilsService.localForage.keys()
  for (const { formId, preFillFormDataId } of jobs) {
    if (
      !preFillFormDataId ||
      keys.some((key) => key === getPrefillKey(preFillFormDataId))
    ) {
      continue
    }
    try {
      await getPrefillFormData(formId, preFillFormDataId)
    } catch (error) {
      console.warn('Suppressing error retrieving prefill data for jobs', error)
    }
  }
}
