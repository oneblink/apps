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
import { getRequest, postRequest } from './services/fetch'
import tenants from './tenants'
import { getUserToken, setUserToken } from './services/user-token'

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

export function init({ oAuthClientId }: { oAuthClientId: string }) {
  initCognito({
    region: tenants.current.awsRegion,
    loginDomain: tenants.current.loginDomain,
    oAuthClientId,
    redirectUri: window.location.origin + '/callback',
  })
}

export function getUserFriendlyName(): string | null {
  const profile = getUserProfile()
  if (!profile) {
    return null
  }

  if (profile.fullName) {
    return profile.fullName
  }

  if (profile.firstName || profile.lastName) {
    return [profile.firstName, profile.lastName].filter((str) => str).join(' ')
  }

  if (profile.email) {
    return profile.email
  }

  return profile.username
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
    console.warn('Error while requesting access to forms app', error)
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
