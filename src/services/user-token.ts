import { MiscTypes } from '@oneblink/types'
let userToken: string | MiscTypes.NoU = null

export function setUserToken(token: string | MiscTypes.NoU): void {
  userToken = token || null
}

export function getUserToken() {
  return userToken
}
