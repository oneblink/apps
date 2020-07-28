// @flow
'use strict'

import * as offlineService from './src/offline-service'
import * as authService from './src/auth-service'
import * as draftService from './src/draft-service'
import * as prefillService from './src/prefill-service'
import OneBlinkAppsError from './src/services/errors/oneBlinkAppsError'
import tenants from './src/tenants'

export const useTenantCivicPlus = tenants.useCivicPlus
export const useTenantOneBlink = tenants.useOneBlink

export {
  offlineService,
  OneBlinkAppsError,
  authService,
  draftService,
  prefillService,
}
