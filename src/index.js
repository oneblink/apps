// @flow
'use strict'

import * as offlineService from './offline-service'
import * as authService from './auth-service'
import * as draftService from './draft-service'
import * as prefillService from './prefill-service'
import * as paymentService from './payment-service'
import * as jobService from './job-service'
import * as submissionService from './submission-service'
import * as autoSaveService from './auto-save-service'
import * as notificationService from './notification-service'
import * as formService from './form-service'
import localisationService from './localisation-service'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import tenants from './tenants'

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
  localisationService,
}
