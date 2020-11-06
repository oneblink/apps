// @flow
'use strict'

import { createInstance } from 'localforage'
import _cloneDeep from 'lodash.clonedeep'

const localForage = createInstance({
  name: 'OneBlinkForms',
  storeName: 'FORMS_V1',
  description: 'Store of forms related data',
})

function getLocalForageKeys(keyPrefix) /* : Promise<string[]> */ {
  return localForage
    .keys()
    .then((keys) => keys.filter((key) => key.startsWith(keyPrefix)))
}

function setValuesOnData(items, data) {
  if (!data) {
    return null
  }
  Object.keys(data).forEach((property) => {
    const value = data[property]

    if (typeof value === 'string') {
      const item = items.find((item) => item && item.key === value)
      if (item) {
        data[property] = item.value
      }
    } else if (value !== null && typeof value === 'object') {
      setValuesOnData(items, value)
    }
  })
  return data
}

async function getLocalForageItem /* ::<T>*/(
  key /* : string */,
) /* : Promise<T | null> */ {
  const localForageKeys = await getLocalForageKeys(key)

  const items = []
  for (const localForageKey of localForageKeys) {
    const item = await localForage.getItem(localForageKey)
    items.push(item)
  }
  const rootItem = items.find((item) => item && item.key === key)
  if (!rootItem || !rootItem.value) {
    return null
  }
  return setValuesOnData(items, rootItem.value)
}

function generateKeyValuesReducer(key, data, initialKeyValues) {
  Object.keys(data).reduce((keyValues, property) => {
    const value = data[property]
    if (typeof value === 'string' && value.length > 25000) {
      const newKey = `${key}_${property}`
      keyValues.keys.push(newKey)
      keyValues.items.push({
        key: newKey,
        value,
      })
      data[property] = newKey
    } else if (value !== null && typeof value === 'object') {
      generateKeyValuesReducer(`${key}_${property}`, value, keyValues)
    }
    return keyValues
  }, initialKeyValues)
}

async function setLocalForageItem /*:: <T: {}> */(
  key /* : string */,
  originalData /* : T */,
) /* : Promise<T> */ {
  const data /* : T */ = _cloneDeep(originalData)
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

async function removeLocalForageItem(key /* : string */) /* : Promise<void> */ {
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
