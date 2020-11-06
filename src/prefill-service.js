// @flow
'use strict'

import utilsService from './services/utils'
import { getPrefillKey, getPrefillFormData } from './services/job-prefill'

export async function removePrefillFormData(
  prefillFormDataId /* : string */,
) /* : Promise<void> */ {
  const key = getPrefillKey(prefillFormDataId)
  return utilsService.removeLocalForageItem(key)
}

export { getPrefillFormData }
