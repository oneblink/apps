import { parseQueryString } from './query-string'

export function getUserToken() {
  const query = parseQueryString(window.location.search.substring(1))

  return query.userToken
}
