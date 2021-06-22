import { EventListeners, CognitoIdentityServiceProvider } from 'aws-sdk'
import { parseQueryString } from './query-string'
import Sentry from '../Sentry'

interface AWSAuthenticationResult {
  AccessToken: string
  ExpiresIn: number
  IdToken: string
  TokenType: string
  RefreshToken?: string
}

export type AWSCognitoAuthChallenge = {
  ChallengeName:
    | 'SMS_MFA'
    | 'PASSWORD_VERIFIER'
    | 'CUSTOM_CHALLENGE'
    | 'DEVICE_SRP_AUTH'
    | 'DEVICE_PASSWORD_VERIFIER'
    | 'NEW_PASSWORD_REQUIRED'
  Session: string
  ChallengeParameters: { [key: string]: string }
  AuthenticationResult?: AWSAuthenticationResult
}

// @ts-expect-error
const unsignedAWSRequest = async (request) => {
  request.removeListener('validate', EventListeners.Core.VALIDATE_CREDENTIALS)
  // @ts-expect-error
  request.removeListener('sign', EventListeners.Core.SIGN)

  return request.promise()
}

export default class AWSCognitoClient {
  clientId: string
  cognitoIdentityServiceProvider: CognitoIdentityServiceProvider
  loginDomain: string | void
  redirectUri: string | void
  listeners: Array<() => unknown>

  constructor({
    clientId,
    region,
    loginDomain,
    redirectUri,
  }: {
    clientId: string
    region: string
    redirectUri?: string
    loginDomain?: string
  }) {
    if (!clientId) {
      throw new TypeError('"clientId" is required in constructor')
    }
    if (!region) {
      throw new TypeError('"region" is required in constructor')
    }

    this.listeners = []
    this.redirectUri = redirectUri
    this.loginDomain = loginDomain
    this.clientId = clientId
    this.cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
      region,
    })
  }

  // Local Storage Keys
  get EXPIRES_AT() {
    return `COGNITO_${this.clientId}_EXPIRES_AT`
  }
  get ACCESS_TOKEN() {
    return `COGNITO_${this.clientId}_ACCESS_TOKEN`
  }
  get ID_TOKEN() {
    return `COGNITO_${this.clientId}_ID_TOKEN`
  }
  get REFRESH_TOKEN() {
    return `COGNITO_${this.clientId}_REFRESH_TOKEN`
  }
  get STATE() {
    return `COGNITO_${this.clientId}_STATE`
  }
  get PKCE_CODE_VERIFIER() {
    return `COGNITO_${this.clientId}_PKCE_CODE_VERIFIER`
  }

  _executeListeners() {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (error) {
        Sentry.captureException(error)
        // Ignore error from listeners
        console.warn('AWSCognitoClient listener error', error)
      }
    }
  }

  _storeAuthenticationResult(authenticationResult: AWSAuthenticationResult) {
    // Take off 5 seconds to ensure a request does not become unauthenticated mid request
    const expiresAt = authenticationResult.ExpiresIn * 1000 + Date.now() - 5000
    localStorage.setItem(this.EXPIRES_AT, expiresAt.toString())
    localStorage.setItem(this.ACCESS_TOKEN, authenticationResult.AccessToken)
    localStorage.setItem(this.ID_TOKEN, authenticationResult.IdToken)
    if (authenticationResult.RefreshToken) {
      localStorage.setItem(
        this.REFRESH_TOKEN,
        authenticationResult.RefreshToken,
      )
    }

    this._executeListeners()
  }

  _removeAuthenticationResult() {
    localStorage.removeItem(this.EXPIRES_AT)
    localStorage.removeItem(this.ACCESS_TOKEN)
    localStorage.removeItem(this.ID_TOKEN)
    localStorage.removeItem(this.REFRESH_TOKEN)

    this._executeListeners()
  }

  _getAccessToken(): string | undefined {
    return localStorage.getItem(this.ACCESS_TOKEN) || undefined
  }

  _getIdToken(): string | undefined {
    return localStorage.getItem(this.ID_TOKEN) || undefined
  }

  _getRefreshToken(): string | undefined {
    return localStorage.getItem(this.REFRESH_TOKEN) || undefined
  }

  _isSessionValid(): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT)
    if (!expiresAt) {
      return false
    }
    return parseInt(expiresAt, 10) > Date.now()
  }

  async _refreshSession(): Promise<void> {
    if (this._isSessionValid()) {
      return
    }

    const refreshToken = this._getRefreshToken()
    if (!refreshToken) {
      return
    }

    try {
      const result = await unsignedAWSRequest(
        this.cognitoIdentityServiceProvider.initiateAuth({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },
        }),
      )
      this._storeAuthenticationResult(result.AuthenticationResult)
    } catch (error) {
      Sentry.captureException(error)
      console.warn('Error while attempting to refresh session', error)
      this._removeAuthenticationResult()
      throw error
    }
  }

  registerListener(listener: () => unknown): () => void {
    this.listeners.push(listener)

    return () => {
      const index = this.listeners.indexOf(listener)
      if (index !== -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  async loginUsernamePassword(
    username: string,
    password: string,
  ): Promise<((newPassword: string) => Promise<void>) | void> {
    const loginResult = await unsignedAWSRequest(
      this.cognitoIdentityServiceProvider.initiateAuth({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      }),
    )

    if (loginResult.AuthenticationResult) {
      this._storeAuthenticationResult(loginResult.AuthenticationResult)
      return
    }

    if (loginResult.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      return async (newPassword) => {
        const resetPasswordResult = await unsignedAWSRequest(
          this.cognitoIdentityServiceProvider.respondToAuthChallenge({
            ChallengeName: loginResult.ChallengeName,
            ClientId: this.clientId,
            Session: loginResult.Session,
            ChallengeResponses: {
              USERNAME: username,
              NEW_PASSWORD: newPassword,
            },
          }),
        )

        this._storeAuthenticationResult(
          resetPasswordResult.AuthenticationResult,
        )
      }
    }

    throw new Error('Could not authenticate user.')
  }

  async loginHostedUI(identityProviderName: string | void): Promise<void> {
    const loginDomain = this.loginDomain
    const redirectUri = this.redirectUri
    if (!loginDomain || !redirectUri) {
      throw new TypeError(
        '"loginDomain" or "redirectUri" was not passed to constructor. Both are required before attempting to login.',
      )
    }

    // Create and store a random "state" value
    const state = generateRandomString()
    localStorage.setItem(this.STATE, state)

    // Create and store a new PKCE code_verifier (the plaintext random secret)
    const codeVerifier = generateRandomString()
    localStorage.setItem(this.PKCE_CODE_VERIFIER, codeVerifier)

    // Hash and base64-urlencode the secret to use as the challenge
    const code_challenge = await pkceChallengeFromVerifier(codeVerifier)

    // @ts-ignore Jest seems to have a problem with this?
    window.location.href =
      `https://${loginDomain}/oauth2/authorize` +
      '?response_type=code' +
      '&client_id=' +
      encodeURIComponent(this.clientId) +
      '&state=' +
      encodeURIComponent(state) +
      '&scope=' +
      encodeURIComponent('openid email profile aws.cognito.signin.user.admin') +
      '&redirect_uri=' +
      encodeURIComponent(redirectUri) +
      '&code_challenge=' +
      encodeURIComponent(code_challenge) +
      '&code_challenge_method=S256' +
      (identityProviderName
        ? '&identity_provider=' + encodeURIComponent(identityProviderName)
        : '')
  }

  async handleAuthentication(): Promise<void> {
    const loginDomain = this.loginDomain
    const redirectUri = this.redirectUri
    if (!loginDomain || !redirectUri) {
      throw new TypeError(
        '"loginDomain" or "redirectUri" was not passed to constructor. Both are required before attempting to handle a login.',
      )
    }

    const query = parseQueryString(window.location.search.substring(1))

    // Check if the server returned an error string
    if (typeof query.error === 'string') {
      throw new Error(
        `${query.error} - ${
          typeof query.error_description === 'string'
            ? query.error_description
            : 'An unknown error has occurred.'
        }`,
      )
    }

    const code = query.code
    if (typeof code !== 'string') {
      throw new Error('"code" was not including in query string to parse')
    }

    if (localStorage.getItem(this.STATE) !== query.state) {
      throw new Error('Invalid login')
    }

    const code_verifier = localStorage.getItem(this.PKCE_CODE_VERIFIER)

    // Clean these up since we don't need them anymore
    localStorage.removeItem(this.STATE)
    localStorage.removeItem(this.PKCE_CODE_VERIFIER)

    // Exchange the authorization code for an access token
    const result: Record<string, unknown> = await new Promise(
      (resolve, reject) => {
        sendPostRequest(
          `https://${loginDomain}/oauth2/token`,
          {
            grant_type: 'authorization_code',
            code,
            client_id: this.clientId,
            redirect_uri: redirectUri,
            code_verifier,
          },
          resolve,
          (error) => {
            reject(
              new Error(
                error.error_description ||
                  error.message ||
                  'An unknown error has occurred while processing authentication code',
              ),
            )
          },
        )
      },
    )

    this._storeAuthenticationResult({
      AccessToken: result.access_token as string,
      ExpiresIn: result.expires_in as number,
      IdToken: result.id_token as string,
      TokenType: result.token_type as string,
      RefreshToken: result.refresh_token as string,
    })
  }

  async changePassword(
    existingPassword: string,
    newPassword: string,
  ): Promise<void> {
    const accessToken = await this.getAccessToken()
    await unsignedAWSRequest(
      this.cognitoIdentityServiceProvider.changePassword({
        AccessToken: accessToken || '',
        PreviousPassword: existingPassword,
        ProposedPassword: newPassword,
      }),
    )
  }

  async forgotPassword(
    username: string,
  ): Promise<(code: string, password: string) => Promise<void>> {
    await unsignedAWSRequest(
      this.cognitoIdentityServiceProvider.forgotPassword({
        ClientId: this.clientId,
        Username: username,
      }),
    )

    return async (code, password) => {
      await unsignedAWSRequest(
        this.cognitoIdentityServiceProvider.confirmForgotPassword({
          ClientId: this.clientId,
          ConfirmationCode: code,
          Password: password,
          Username: username,
        }),
      )
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this._getRefreshToken()
      // Refresh session to allow access token to perform sign out
      if (refreshToken) {
        await this._refreshSession()
      }

      const accessToken = this._getAccessToken()
      if (accessToken) {
        await unsignedAWSRequest(
          this.cognitoIdentityServiceProvider.globalSignOut({
            AccessToken: accessToken,
          }),
        )
      }
    } catch (error) {
      Sentry.captureException(error)
      if (!error.requiresLogin) {
        throw error
      }
    } finally {
      this._removeAuthenticationResult()
    }
  }

  async getIdToken(): Promise<string | undefined> {
    await this._refreshSession()

    return this._getIdToken()
  }

  async getAccessToken(): Promise<string | undefined> {
    await this._refreshSession()

    return this._getAccessToken()
  }
}

//////////////////////////////////////////////////////////////////////
// GENERAL HELPER FUNCTIONS

// Make a POST request and parse the response as JSON
function sendPostRequest(
  url: string,
  params: Record<string, unknown>,
  success: (value: Record<string, unknown>) => void,
  error: (err: { message?: string; error_description?: string }) => void,
) {
  const request = new XMLHttpRequest()
  request.open('POST', url, true)
  request.setRequestHeader(
    'Content-Type',
    'application/x-www-form-urlencoded; charset=UTF-8',
  )
  request.onload = function () {
    let body = {}
    try {
      body = JSON.parse(request.response)
    } catch (e) {
      Sentry.captureException(e)
      // Do nothing
    }

    if (request.status == 200) {
      success(body)
    } else {
      error(body)
    }
  }
  request.onerror = function () {
    error({})
  }
  const body = Object.keys(params)
    .reduce((keys: string[], key) => {
      if (params[key]) {
        keys.push(key + '=' + params[key])
      }
      return keys
    }, [])
    .join('&')
  request.send(body)
}

//////////////////////////////////////////////////////////////////////
// PKCE HELPER FUNCTIONS

// Generate a secure random string using the browser crypto functions
function generateRandomString() {
  const array = new Uint32Array(28)
  window.crypto.getRandomValues(array)
  return Array.from(array, (dec) => ('0' + dec.toString(16)).substr(-2)).join(
    '',
  )
}

// Calculate the SHA256 hash of the input text.
// Returns a promise that resolves to an ArrayBuffer
function sha256(plain: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

// Base64-urlencodes the input string
function base64urlencode(str: ArrayBuffer) {
  // Convert the ArrayBuffer to string using Uint8 array to conver to what btoa accepts.
  // btoa accepts chars only within ascii 0-255 and base64 encodes them.
  // Then convert the base64 encoded to base64url encoded
  //   (replace + with -, replace / with _, trim trailing =)
  // @ts-expect-error
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
async function pkceChallengeFromVerifier(v: string) {
  const hashed = await sha256(v)
  return base64urlencode(hashed)
}
