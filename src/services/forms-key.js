// @flow
'use strict'

import jwtDecode from 'jwt-decode'

import { getCognitoIdToken } from './cognito'

let formsKeyToken = null

export function setFormsKeyToken(
  jwtToken /* : string */
) /* : string | void */ {
  formsKeyToken = jwtToken
}

export function getFormsKeyId() /* : string | void */ {
  if (formsKeyToken) {
    console.log('Attempting to decode JWT')
    try {
      const tokenPayload = jwtDecode(formsKeyToken)
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
