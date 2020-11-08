import jwtDecode from 'jwt-decode'

import { getCognitoIdToken } from './cognito'

import { MiscTypes } from '@oneblink/types'
let formsKeyToken: string | MiscTypes.NoU = null

export function setFormsKeyToken(jwtToken: string | MiscTypes.NoU): void {
  formsKeyToken = jwtToken || null
}

export function getFormsKeyId(): string | void {
  if (formsKeyToken) {
    console.log('Attempting to decode JWT')
    try {
      const tokenPayload = jwtDecode(formsKeyToken) as { iss: string }
      return tokenPayload.iss
    } catch (error) {
      console.warn('Could not decode JWT', error)
    }
  }
}

export async function getIdToken() {
  if (formsKeyToken) {
    return formsKeyToken
  }

  try {
    return await getCognitoIdToken()
  } catch (error) {
    if (!error.requiresLogin) {
      throw error
    }
  }
}
