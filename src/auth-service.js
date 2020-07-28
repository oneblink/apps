// @flow
'use strict'

import jwtDecode from 'jwt-decode'

import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  init as initCognito,
  isLoggedIn,
  login,
  handleAuthentication,
  getIdToken,
  logout,
  getUserProfile,
} from './services/cognito'
import { getRequest, postRequest } from './services/fetch'
import tenants from './tenants'

export {
  login,
  handleAuthentication,
  isLoggedIn,
  getIdToken,
  getUserProfile,
  logout,
}

let isInitialized = null

export function init(
  {
    oAuthClientId,
    useSAML,
  } /* : {
  oAuthClientId: string,
  useSAML: boolean,
} */
) {
  initCognito({
    loginDomain: tenants.current.loginDomain,
    oAuthClientId,
    samlIdentityProviderName: useSAML ? oAuthClientId : null,
  })
  isInitialized = true
}

export function getUserFriendlyName() /* : string | null */ {
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

export function getIssuerFromJWT(
  jwtToken /* : ?string */
) /* : string | void */ {
  if (jwtToken) {
    console.log('Attempting to decode JWT')
    try {
      const tokenPayload = jwtDecode(jwtToken)
      return tokenPayload.iss
    } catch (error) {
      console.warn('Could not decode JWT', error)
    }
  }
}

export async function isAuthorised(
  formsAppId /* : number */
) /* : Promise<boolean> */ {
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
          error
        )
        return false
      }
    })
}

export async function requestAccess(
  formsAppId /* : number */
) /* : Promise<void> */ {
  if (!isLoggedIn()) {
    throw new OneBlinkAppsError(
      'You must login before requesting access to this application',
      {
        requiresLogin: true,
      }
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
      }
    )
  }
}
