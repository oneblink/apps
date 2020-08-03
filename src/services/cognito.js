// @flow
'use strict'

import {
  CognitoAuth,
  CognitoIdToken,
  CognitoAccessToken,
} from 'amazon-cognito-auth-js'
import store from 'local-storage'

import utilsService from './utils'
import * as offlineService from '../offline-service'

let cognitoAuth = null

export function init(
  {
    oAuthClientId,
    loginDomain,
    samlIdentityProviderName,
  } /* : {
  oAuthClientId: string,
  loginDomain: string,
  samlIdentityProviderName: ?string,
} */
) {
  const origin = window.location.origin
  const authData = {
    ClientId: oAuthClientId || 'UNKNOWN',
    AppWebDomain: loginDomain,
    TokenScopesArray: ['openid', 'email', 'profile'],
    RedirectUriSignIn: origin + '/callback',
    RedirectUriSignOut: origin,
    IdentityProvider: samlIdentityProviderName,
  }

  console.log('Initiating CognitoAuth', authData)
  cognitoAuth = new CognitoAuth(authData)

  // Request a "refresh_token" as well as "id_token" and "access_token"
  cognitoAuth.useCodeGrantFlow()
}

function createUserHandler(auth, deferred, continueTo) {
  return {
    onSuccess: function (cognitoAuthSession) {
      console.log('Successfully created CognitoAuthSession', cognitoAuthSession)
      // Have to set setUser manually after a successful sign in
      // to ensure on sign out, tokens are cleared from storage.
      // See: https://github.com/aws/amazon-cognito-auth-js/issues/36
      auth.setUser(auth.getCurrentUser())

      store.remove('continueTo')
      deferred.resolve(continueTo)
    },
    onFailure: function (err) {
      console.error('Failed to create CognitoAuthSession', err)
      deferred.reject(err)
    },
  }
}

export function login() /* : Promise<string> */ {
  // The following method will attempt to get a user session from storage or
  // navigate to the sign in screen if the user session has expired.
  const continueTo = `${window.location.pathname}${window.location.search}`
  store.set('continueTo', continueTo)
  console.log('Creating CognitoAuthSession from sign in or cached session data')

  return new Promise((resolve, reject) => {
    if (!cognitoAuth) {
      reject(
        new Error(
          '"authService" has not been initiated. You must call the init() function before attempting to login.'
        )
      )
      return
    }

    cognitoAuth.userhandler = createUserHandler(
      cognitoAuth,
      { resolve, reject },
      continueTo
    )

    // Open Hosted Login page
    cognitoAuth.getSession()
  })
}

export async function handleAuthentication() /* : Promise<string> */ {
  console.log('Attempting to create CognitoAuthSession from URL')
  const continueTo = store.get('continueTo') || '/'
  if (isLoggedIn()) {
    console.log('Already authenticated, redirecting to:', continueTo)
    store.remove('continueTo')
    return continueTo
  }

  // The redirect back to this application after a successful sign in
  // will include the tokens after a "?". This will attempt to store
  // for later use
  console.log('Creating CognitoAuthSession from hash in URL')

  return new Promise((resolve, reject) => {
    if (!cognitoAuth) {
      reject(
        new Error(
          '"authService" has not been initiated. You must call the init() function before attempting to handle authentication in URL.'
        )
      )
      return
    }
    cognitoAuth.userhandler = createUserHandler(
      cognitoAuth,
      { resolve, reject },
      continueTo
    )

    cognitoAuth.parseCognitoWebResponse(
      `${window.location.pathname}${window.location.search}`
    )
  })
}

export function logout() {
  console.log('Logging out...')
  return utilsService.localForage
    .clear()
    .catch((error) =>
      console.warn('Could not clear localForage before logging out', error)
    )
    .then(() => {
      if (cognitoAuth) {
        cognitoAuth.signOut()
      }
    })
}

export function isLoggedIn() /* : boolean */ {
  return (
    !!cognitoAuth &&
    !!cognitoAuth.getSignInUserSession().getRefreshToken().getToken()
  )
}

export async function getCognitoIdToken() /* : Promise<string | void> */ {
  if (!isLoggedIn()) {
    return
  }

  if (!cognitoAuth) {
    return
  }

  const session = cognitoAuth.getSignInUserSession()

  // Need to check if token needs refreshing before getting the id token
  if (session.isValid() || offlineService.isOffline()) {
    return session.getIdToken().getJwtToken()
  } else {
    console.log(
      'Session has expired, attempting to refresh token (may redirect to login screen)'
    )

    return new Promise((resolve, reject) => {
      const deferred = {
        resolve,
        reject,
      }
      // This code was taken from the github:aws/amazon-cognito-auth-js package
      // Until this PR https://github.com/aws/amazon-cognito-auth-js/pull/179
      // gets accepted we will be able to use the SDK again.
      // We need this to ensure that multiple calls to refresh session are
      // possible and all promises are resolved or rejected.
      // Right now the `userhandler` function is a property on the `CognitoAuth`
      // class and it is changed to a different value if multiple
      // `refreshSession()` functions are running. This means the one that first
      // set `userhandler` will never resolve or reject.

      if (!cognitoAuth) {
        return resolve()
      }

      const url = cognitoAuth
        .getCognitoConstants()
        .DOMAIN_SCHEME.concat(
          cognitoAuth.getCognitoConstants().COLONDOUBLESLASH,
          cognitoAuth.getAppWebDomain(),
          cognitoAuth.getCognitoConstants().SLASH,
          cognitoAuth.getCognitoConstants().DOMAIN_PATH_TOKEN
        )

      const header = cognitoAuth.getCognitoConstants().HEADER
      const body = {
        grant_type: cognitoAuth.getCognitoConstants().REFRESHTOKEN,
        client_id: cognitoAuth.getClientId(),
        redirect_uri: cognitoAuth.RedirectUriSignIn,
        refresh_token: cognitoAuth
          .getSignInUserSession()
          .getRefreshToken()
          .getToken(),
      }

      cognitoAuth.makePOSTRequest(
        header,
        body,
        url,
        (jsonData) => {
          if (!cognitoAuth) {
            return resolve()
          }

          const jsonDataObject = JSON.parse(jsonData)
          if (
            Object.prototype.hasOwnProperty.call(
              jsonDataObject,
              cognitoAuth.getCognitoConstants().ERROR
            )
          ) {
            const URL = cognitoAuth.getFQDNSignIn()
            const continueTo = `${window.location.pathname}${window.location.search}`
            store.set('continueTo', continueTo)
            cognitoAuth.launchUri(URL)
          } else {
            if (
              Object.prototype.hasOwnProperty.call(
                jsonDataObject,
                cognitoAuth.getCognitoConstants().IDTOKEN
              )
            ) {
              cognitoAuth.signInUserSession.setIdToken(
                new CognitoIdToken(jsonDataObject.id_token)
              )
            }
            if (
              Object.prototype.hasOwnProperty.call(
                jsonDataObject,
                cognitoAuth.getCognitoConstants().ACCESSTOKEN
              )
            ) {
              cognitoAuth.signInUserSession.setAccessToken(
                new CognitoAccessToken(jsonDataObject.access_token)
              )
            }
            cognitoAuth.cacheTokensScopes()
            const newIdToken = cognitoAuth
              .getSignInUserSession()
              .getIdToken()
              .getJwtToken()
            deferred.resolve(newIdToken)
          }
          console.log('Successfully refreshed session. Returning new token...')
        },
        (response) => {
          try {
            // https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
            // If refresh_token has expired (or been revoked) the response from the endpoint
            // to exchange a refresh_token for an access_token and an id_token will
            // return { "error": "invalid_grant" }, however, the SDK will not parse the
            // JSON yet...for now we have to handle it manually by checking for "invalid_grant"
            const responsePayload = JSON.parse(response)
            if (responsePayload.error === 'invalid_grant') {
              return logout()
            }
          } catch (e) {
            // do nothing...
          }
          console.warn('Could not catch and handle error for Cognito SDK')
          deferred.reject(response)
        }
      )
    })
  }
}

export function getUserProfile() /* : {
  isSAMLUser: boolean,
  providerType: string,
  providerUserId: string,
  userId: string,
  username: string,
  email: ?string,
  firstName: ?string,
  lastName: ?string,
  fullName: ?string,
  picture: ?string,
  role: ?string,
  supervisor: ?{
    fullName: ?string,
    email: ?string,
    providerUserId: ?string,
  },
} | null */ {
  if (!isLoggedIn()) {
    return null
  }

  if (!cognitoAuth) {
    return null
  }

  const userProfile = cognitoAuth
    .getSignInUserSession()
    .getIdToken()
    .decodePayload()
  if (!userProfile) {
    return null
  }

  const user = {
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
      user.username = user.providerUserId
    }
  }

  return user
}

export function getUsername() /* : string | null */ {
  const profile = getUserProfile()
  if (!profile) {
    return null
  }

  return profile.username
}
