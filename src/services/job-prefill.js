// @flow
'use strict'

import OneBlinkAppsError from './errors/oneBlinkAppsError'
import utilsService from './utils'
import { downloadPreFillFormData } from './api/prefill'

export function getPrefillKey(prefillFormDataId /* : string */) {
  return `V2_PREFILL_${prefillFormDataId}`
}

function get /* :: <T> */(
  prefillFormDataId /*: string */
) /* : Promise<T | null> */ {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.getLocalForageItem(key)
}

function set /* :: <T: {}> */(
  prefillFormDataId /*: string */,
  model /* : T */
) /* : Promise<T> */ {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.setLocalForageItem(key, model)
}

export async function getPrefillFormData /* :: <T: {}> */(
  formId /* : number */,
  prefillFormDataId /* : ?string */
) /* : Promise<T | null> */ {
  if (!prefillFormDataId) {
    return null
  }

  return get(prefillFormDataId)
    .then((prefillData) => {
      if (prefillData) return prefillData

      return downloadPreFillFormData(
        formId,
        prefillFormDataId
      ).then((downloadedPrefillData) =>
        set(prefillFormDataId, downloadedPrefillData)
      )
    })
    .catch((error) => {
      console.warn(
        'An error occurred attempting to retrieve prefill data',
        error
      )
      throw new OneBlinkAppsError(
        'The prefill data associated to this form is no longer available.',
        {
          originalError: error,
          title: 'Prefill Data Unavailable',
        }
      )
    })
}

export async function ensurePrefillFormDataExists(
  jobs /* : FormsAppJob[] */
) /* : Promise<void> */ {
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
      console.warn('Suppressing error retrieving prefill data for jobs', error)
    )
  }
}
