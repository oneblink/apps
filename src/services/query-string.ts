// Parse a query string into an object
export function parseQueryString(str: string) {
  if (str == '') {
    return {}
  }
  const query = new URLSearchParams(str)
  return Object.fromEntries(query.entries())
}

export function formatQueryString(obj: Record<string, unknown>): string {
  const params = Object.entries(obj).reduce<Record<string, string>>(
    (memo, [key, value]) => {
      if (value) {
        memo[key] = String(value)
      }
      return memo
    },
    {},
  )
  return new URLSearchParams(params).toString()
}
