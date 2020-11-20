import { parseQueryString } from './query-string'

import { MiscTypes } from '@oneblink/types'
let userToken: string | MiscTypes.NoU = null

export function setUserToken(token: string | MiscTypes.NoU): void {
  userToken = token || null
}

export function getUserToken() {
  if (userToken) {
    return userToken
  }
  return getQueryStringToken()
}

function getQueryStringToken() {
  const query = parseQueryString(window.location.search.substring(1))

  return query.userToken
}
