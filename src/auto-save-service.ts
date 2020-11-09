import { MiscTypes } from '@oneblink/types'
import utilsService from './services/utils'

const defaultAutoSaveKey = 'NO_AUTO_SAVE_KEY'

function getAutoSaveKey(formId: number, autoSaveKey: string | MiscTypes.NoU) {
  return `AUTO_SAVE_${formId}_${autoSaveKey || defaultAutoSaveKey}`
}

export async function getAutoSaveData<T>(
  formId: number,
  autoSaveKey: string | MiscTypes.NoU,
): Promise<T | null> {
  const key = getAutoSaveKey(formId, autoSaveKey)
  return utilsService.getLocalForageItem(key)
}

// eslint-disable-next-line
export async function upsertAutoSaveData<T extends object>(
  formId: number,
  autoSaveKey: string | MiscTypes.NoU,
  model: T,
): Promise<T> {
  const key = getAutoSaveKey(formId, autoSaveKey)
  return utilsService.setLocalForageItem(key, model)
}

export async function deleteAutoSaveData(
  formId: number,
  autoSaveKey: string | MiscTypes.NoU,
): Promise<void> {
  const key = getAutoSaveKey(formId, autoSaveKey)
  return utilsService.removeLocalForageItem(key)
}
