import jwtDecode from 'jwt-decode'

import AWSCognitoClient from './AWSCognitoClient'

import utilsService from './utils'
import * as offlineService from '../offline-service'
import { MiscTypes } from '@oneblink/types'
import Sentry from '../Sentry'

interface CognitoServiceData {
  oAuthClientId: string
  loginDomain: string
  region: string
  redirectUri: string
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
  })

  const listener = () => {
    Sentry.setTag('username', getUsername() || undefined)
  }
  listener()
  registerAuthListener(listener)
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

async function loginHostedUI(identityProviderName: string): Promise<void> {
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

async function logout() {
  console.log('Logging out...')

  try {
    await utilsService.localForage.clear()
  } catch (error) {
    console.warn('Could not clear localForage before logging out', error)
  }

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

  const userProfile = jwtDecode(idToken) as {
    sub: string
    email: string
    given_name: string | MiscTypes.NoU
    family_name: string | MiscTypes.NoU
    name: string | MiscTypes.NoU
    preferred_username: string | MiscTypes.NoU
    picture: string | MiscTypes.NoU
    'custom:role': string | MiscTypes.NoU
    'custom:supervisor_name': string | MiscTypes.NoU
    'custom:supervisor_email': string | MiscTypes.NoU
    'custom:supervisor_user_id': string | MiscTypes.NoU
    identities:
      | MiscTypes.NoU
      | Array<{
          providerType: string
          userId: string
        }>
  }

  const user: MiscTypes.UserProfile = {
    isSAMLUser: false,
    providerType: 'Cognito',
    providerUserId: userProfile.sub,
    userId: userProfile.sub,
    email: userProfile.email,
    firstName: userProfile.given_name,
    lastName: userProfile.family_name,
    fullName: userProfile.name,
    picture: userProfile.picture,
    role: userProfile['custom:role'],
    username: userProfile.email,
    supervisor: undefined,
  }

  if (
    userProfile['custom:supervisor_name'] ||
    userProfile['custom:supervisor_email'] ||
    userProfile['custom:supervisor_user_id']
  ) {
    user.supervisor = {
      fullName: userProfile['custom:supervisor_name'],
      email: userProfile['custom:supervisor_email'],
      providerUserId: userProfile['custom:supervisor_user_id'],
    }
  }

  if (Array.isArray(userProfile.identities) && userProfile.identities.length) {
    user.providerType = userProfile.identities[0].providerType
    user.providerUserId = userProfile.identities[0].userId
    user.isSAMLUser = user.providerType === 'SAML'
    if (user.isSAMLUser) {
      user.username = userProfile.preferred_username || user.providerUserId
    }
  }

  return user
}

export function getUsername(): string | null {
  const profile = getUserProfile()
  if (!profile) {
    return null
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
  logout,
  isLoggedIn,
  getCognitoIdToken,
  getUserProfile,
}
