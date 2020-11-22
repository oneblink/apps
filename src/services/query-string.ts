// Parse a query string into an object
export function parseQueryString(string: string) {
  if (string == '') {
    return {}
  }
  const segments = string.split('&').map((s) => s.split('='))
  const queryString: UnknownObject = {}
  segments.forEach((s) => (queryString[s[0]] = s[1]))
  return queryString
}
