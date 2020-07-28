// @flow
'use strict'

import localForage from 'localforage'

import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import utilsService from './services/utils'
import { downloadPreFillFormData } from './services/api/prefill'

function getPrefillKey(prefillFormDataId) {
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

export async function removePrefillFormData(
  prefillFormDataId /* : string */
) /* : Promise<void> */ {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.removeLocalForageItem(key)
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
