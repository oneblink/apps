import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  getIdToken,
  getFormsKeyId,
  setFormsKeyToken,
} from './services/forms-key'
import {
  init as initCognito,
  registerAuthListener,
  isLoggedIn,
  loginHostedUI,
  loginUsernamePassword,
  changePassword,
  forgotPassword,
  handleAuthentication,
  logout,
  getUserProfile,
} from './services/cognito'
import { getRequest, postRequest, HTTPError } from './services/fetch'
import tenants from './tenants'
import { getUserToken, setUserToken } from './services/user-token'
import { userService } from '@oneblink/sdk-core'

export {
  registerAuthListener,
  loginHostedUI,
  loginUsernamePassword,
  handleAuthentication,
  changePassword,
  forgotPassword,
  isLoggedIn,
  getIdToken,
  getUserProfile,
  logout,
  getFormsKeyId,
  setFormsKeyToken,
  getUserToken,
  setUserToken,
}
import Sentry from './Sentry'

export function init({ oAuthClientId }: { oAuthClientId: string }) {
  initCognito({
    region: tenants.current.awsRegion,
    loginDomain: tenants.current.loginDomain,
    oAuthClientId,
    redirectUri: window.location.origin + '/callback',
  })
}

export function getUserFriendlyName(): string | undefined {
  const profile = getUserProfile()
  if (!profile) {
    return
  }

  return userService.getUserFriendlyName(profile)
}

export async function isAuthorised(formsAppId: number): Promise<boolean> {
  if (getFormsKeyId()) {
    return true
  }

  const userProfile = getUserProfile()

  if (!userProfile) {
    return false
  }

  if (userProfile.isSAMLUser) {
    return true
  }

  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/my-forms-app-user`
  return getRequest(url)
    .then(() => true)
    .catch((error) => {
      if (error.status >= 400 && error.status < 500) {
        return false
      } else {
        Sentry.captureException(error)
        console.log(
          'Could not determine if the current user has access to this forms app',
          error,
        )
        return false
      }
    })
}

export async function requestAccess(formsAppId: number): Promise<void> {
  if (!isLoggedIn()) {
    throw new OneBlinkAppsError(
      'You must login before requesting access to this application',
      {
        requiresLogin: true,
      },
    )
  }

  try {
    const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/request-access`
    await postRequest(url)
  } catch (error) {
    Sentry.captureException(error)
    console.warn('Error while requesting access to forms app', error)
    if (!(error instanceof HTTPError)) throw error
    throw new OneBlinkAppsError(
      'Sorry, we could not request access automatically right now, please try again. If the problem persists, please contact your administrator yourself.',
      {
        originalError: error,
        title: 'Error Requesting Access',
        httpStatusCode: error.status,
      },
    )
  }
}

export async function isAdministrator(formsAppId: number): Promise<boolean> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/my-forms-app-user`
  const appUser = await getRequest<{ groups: string[] }>(url)
  return appUser.groups.some((group) => group === 'oneblink:administrator')
}
