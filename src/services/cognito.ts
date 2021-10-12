import jwtDecode from 'jwt-decode'

import AWSCognitoClient from './AWSCognitoClient'

import * as offlineService from '../offline-service'
import { userService } from '@oneblink/sdk-core'
import { MiscTypes } from '@oneblink/types'

interface CognitoServiceData {
  oAuthClientId: string
  loginDomain: string
  region: string
  redirectUri: string
  logoutUri: string
}

const CONTINUE_TO = 'continueTo'

let awsCognitoClient: null | AWSCognitoClient = null

function init(cognitoServiceData: CognitoServiceData) {
  console.log('Initiating CognitoIdentityServiceProvider', cognitoServiceData)

  awsCognitoClient = new AWSCognitoClient({
    clientId: cognitoServiceData.oAuthClientId,
    region: cognitoServiceData.region,
    loginDomain: cognitoServiceData.loginDomain,
    redirectUri: cognitoServiceData.redirectUri,
    logoutUri: cognitoServiceData.logoutUri,
  })
}

function registerAuthListener(listener: () => unknown): () => void {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to register a listener.',
    )
  }
  return awsCognitoClient.registerListener(listener)
}

async function loginUsernamePassword(username: string, password: string) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to login.',
    )
  }
  console.log('Attempting sign using username', username)
  return awsCognitoClient.loginUsernamePassword(username, password)
}

async function loginHostedUI(identityProviderName?: string): Promise<void> {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to login.',
    )
  }
  const continueTo = `${window.location.pathname}${window.location.search}`
  localStorage.setItem(CONTINUE_TO, continueTo)

  return awsCognitoClient.loginHostedUI(identityProviderName)
}

async function handleAuthentication(): Promise<string> {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to handle authentication in URL.',
    )
  }

  const continueTo = localStorage.getItem(CONTINUE_TO) || '/'
  if (isLoggedIn()) {
    console.log('Already authenticated, redirecting to:', continueTo)
    return continueTo
  }

  localStorage.removeItem(CONTINUE_TO)

  await awsCognitoClient.handleAuthentication()

  return continueTo
}

async function changePassword(existingPassword: string, newPassword: string) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before attempting to change passwords.',
    )
  }

  return await awsCognitoClient.changePassword(existingPassword, newPassword)
}

async function forgotPassword(username: string) {
  if (!awsCognitoClient) {
    throw new Error(
      '"authService" has not been initiated. You must call the init() function before starting the forgot password process.',
    )
  }

  return await awsCognitoClient.forgotPassword(username)
}

function logoutHostedUI(): void {
  if (awsCognitoClient) {
    awsCognitoClient.logoutHostedUI()
  }
}

async function logout() {
  if (awsCognitoClient) {
    await awsCognitoClient.logout()
  }
}

function isLoggedIn(): boolean {
  return !!(awsCognitoClient && awsCognitoClient._getRefreshToken())
}

async function getCognitoIdToken(): Promise<string | void> {
  if (!awsCognitoClient) {
    return
  }

  if (offlineService.isOffline()) {
    return awsCognitoClient._getIdToken()
  }

  return await awsCognitoClient.getIdToken()
}

function getUserProfile(): MiscTypes.UserProfile | null {
  if (!awsCognitoClient) {
    return null
  }
  const idToken = awsCognitoClient._getIdToken()
  if (!idToken) {
    return null
  }

  const jwtToken = jwtDecode(idToken)
  return userService.parseUserProfile(jwtToken) || null
}

export function getUsername(): string | undefined {
  const profile = getUserProfile()
  if (!profile) {
    return undefined
  }

  return profile.username
}

export {
  init,
  registerAuthListener,
  loginUsernamePassword,
  loginHostedUI,
  handleAuthentication,
  changePassword,
  forgotPassword,
  logoutHostedUI,
  logout,
  isLoggedIn,
  getCognitoIdToken,
  getUserProfile,
}
