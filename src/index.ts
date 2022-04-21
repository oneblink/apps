import * as offlineService from './offline-service'
import * as authService from './auth-service'
import * as draftService from './draft-service'
import * as prefillService from './prefill-service'
import * as paymentService from './payment-service'
import * as schedulingService from './scheduling-service'
import * as jobService from './job-service'
import * as submissionService from './submission-service'
import * as autoSaveService from './auto-save-service'
import * as notificationService from './notification-service'
import * as formService from './form-service'
import * as approvalsService from './approvals-service'
import * as formsAppService from './forms-app-service'
/**
 * ## Form Store Service
 *
 * Helper functions for handling Form Store Records
 *
 * ```js
 * import { formStoreService } from '@oneblink/apps'
 * ```
 */
import * as formStoreService from './form-store-service'
import localisationService from './localisation-service'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import tenants from './tenants'
import Sentry from './Sentry'

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
  formsAppService,
  formStoreService,
  localisationService,
  approvalsService,
  schedulingService,
  Sentry,
}
