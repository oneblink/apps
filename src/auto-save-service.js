// @flow
'use strict'

import utilsService from './services/utils'

const defaultAutoSaveKey = 'NO_AUTO_SAVE_KEY'

function getAutoSaveKey(formId, autoSaveKey) {
  return `AUTO_SAVE_${formId}_${autoSaveKey || defaultAutoSaveKey}`
}

export async function getAutoSaveData /* :: <T> */(
  formId /* : number */,
  autoSaveKey /* : ?string */,
) /* : Promise<T | null> */ {
  const key = getAutoSaveKey(formId, autoSaveKey)
  return utilsService.getLocalForageItem(key)
}

export async function upsertAutoSaveData /* :: <T: {}> */(
  formId /* : number */,
  autoSaveKey /* : ?string */,
  model /* : T */,
) /* : Promise<T> */ {
  const key = getAutoSaveKey(formId, autoSaveKey)
  return utilsService.setLocalForageItem(key, model)
}

export async function deleteAutoSaveData /* :: <T> */(
  formId /* : number */,
  autoSaveKey /* : ?string */,
) /* : Promise<void> */ {
  const key = getAutoSaveKey(formId, autoSaveKey)
  return utilsService.removeLocalForageItem(key)
}
