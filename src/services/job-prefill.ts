import OneBlinkAppsError from './errors/oneBlinkAppsError'
import utilsService from './utils'
import { downloadPreFillFormData } from './api/prefill'
import { FormTypes, MiscTypes } from '@oneblink/types'

export function getPrefillKey(prefillFormDataId: string) {
  return `V2_PREFILL_${prefillFormDataId}`
}

function get<T>(prefillFormDataId: string): Promise<T | null> {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.getLocalForageItem(key)
}

// eslint-disable-next-line
function set<T extends object>(
  prefillFormDataId: string,
  model: T,
): Promise<T> {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.setLocalForageItem(key, model)
}

// eslint-disable-next-line
export async function getPrefillFormData<T extends object>(
  formId: number,
  prefillFormDataId: string | MiscTypes.NoU,
): Promise<T | null> {
  if (!prefillFormDataId) {
    return null
  }

  return get<T>(prefillFormDataId)
    .then((prefillData) => {
      if (prefillData) return prefillData

      return downloadPreFillFormData<T>(
        formId,
        prefillFormDataId,
      ).then((downloadedPrefillData) =>
        set<T>(prefillFormDataId, downloadedPrefillData),
      )
    })
    .catch((error) => {
      console.warn(
        'An error occurred attempting to retrieve prefill data',
        error,
      )
      throw new OneBlinkAppsError(
        'The prefill data associated to this form is no longer available.',
        {
          originalError: error,
          title: 'Prefill Data Unavailable',
        },
      )
    })
}

export async function ensurePrefillFormDataExists(
  jobs: FormTypes.FormsAppJob[],
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
    await getPrefillFormData(formId, preFillFormDataId).catch((error) =>
      console.warn('Suppressing error retrieving prefill data for jobs', error),
    )
  }
}
