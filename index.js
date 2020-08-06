// @flow
'use strict'

import * as offlineService from './src/offline-service'
import * as authService from './src/auth-service'
import * as draftService from './src/draft-service'
import * as prefillService from './src/prefill-service'
import * as paymentService from './src/payment-service'
import * as jobService from './src/job-service'
import * as submissionService from './src/submission-service'
import * as autoSaveService from './src/auto-save-service'
import * as notificationService from './src/notification-service'
import * as formService from './src/form-service'
import OneBlinkAppsError from './src/services/errors/oneBlinkAppsError'
import tenants from './src/tenants'

export const useTenantCivicPlus = () => tenants.useCivicPlus()
export const useTenantOneBlink = () => tenants.useOneBlink()

export {
  OneBlinkAppsError,
  offlineService,
  authService,
  draftService,
  prefillService,
  paymentService,
  jobService,
  submissionService,
  autoSaveService,
  notificationService,
  formService,
}
