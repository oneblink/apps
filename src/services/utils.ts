import { createInstance } from 'localforage'
import _cloneDeep from 'lodash.clonedeep'

const localForage = createInstance({
  name: 'OneBlinkForms',
  storeName: 'FORMS_V1',
  description: 'Store of forms related data',
})

function getLocalForageKeys(keyPrefix: string): Promise<string[]> {
  return localForage
    .keys()
    .then((keys) => keys.filter((key) => key.startsWith(keyPrefix)))
}

function setValuesOnData<T>(items: Array<UnknownObject | undefined>, data?: T) {
  if (!data) {
    return null
  }
  Object.keys(data).forEach((property) => {
    // @ts-expect-error
    const value = data[property]

    if (typeof value === 'string') {
      const item = items.find((item) => item && item.key === value)
      if (item) {
        // @ts-expect-error
        data[property] = item.value
      }
    } else if (value !== null && typeof value === 'object') {
      setValuesOnData(items, value)
    }
  })
  return data
}

async function getLocalForageItem<T>(key: string): Promise<T | null> {
  const localForageKeys = await getLocalForageKeys(key)

  const items = []
  for (const localForageKey of localForageKeys) {
    // @ts-expect-error
    const item: UnknownObject | undefined = await localForage.getItem(
      localForageKey,
    )
    items.push(item)
  }
  const rootItem = items.find((item) => item && item.key === key)
  if (!rootItem || !rootItem.value) {
    return null
  }
  return setValuesOnData(items, rootItem.value as T)
}

function generateKeyValuesReducer<T>(
  key: string,
  data: T,
  initialKeyValues: {
    keys: string[]
    items: Array<{
      key: string
      value: T
    }>
  },
) {
  Object.keys(data).reduce((keyValues, property) => {
    // @ts-expect-error
    const value = data[property]
    if (typeof value === 'string' && value.length > 25000) {
      const newKey = `${key}_${property}`
      keyValues.keys.push(newKey)
      keyValues.items.push({
        key: newKey,
        // @ts-expect-error
        value,
      })
      // @ts-expect-error
      data[property] = newKey
    } else if (value !== null && typeof value === 'object') {
      generateKeyValuesReducer(`${key}_${property}`, value, keyValues)
    }
    return keyValues
  }, initialKeyValues)
}

// eslint-disable-next-line
async function setLocalForageItem<T extends object>(
  key: string,
  originalData: T,
): Promise<T> {
  const data: T = _cloneDeep(originalData)
  await removeLocalForageItem(key)
  const keyValues = {
    keys: [key],
    items: [{ key, value: data }],
  }
  generateKeyValuesReducer(key, data, keyValues)
  for (const keyToSet of keyValues.keys) {
    const index = keyValues.keys.findIndex((k) => k === keyToSet)
    const item = keyValues.items[index]
    if (item) {
      await localForage.setItem(keyToSet, item)
    }
  }
  return originalData
}

async function removeLocalForageItem(key: string): Promise<void> {
  const keysToDelete = await getLocalForageKeys(key)
  for (const keyToDelete of keysToDelete) {
    await localForage.removeItem(keyToDelete)
  }
}

export default {
  localForage,
  getLocalForageItem,
  setLocalForageItem,
  removeLocalForageItem,
}
