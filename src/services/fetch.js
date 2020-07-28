// @flow

import queryString from 'query-string'

import { getIdToken } from './cognito'

let faasToken = null

export function init({ faasKey } /* : {
  faasKey: ?string
} */) {
  faasToken = faasKey
}

async function generateHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  // Check for a token for FaaS
  if (faasToken) {
    return {
      ...headers,
      Authorization: `Bearer ${faasToken}`,
    }
  }

  // Check auth service for a token if user is logged in
  const idToken = await getIdToken()
  if (idToken) {
    return {
      ...headers,
      Authorization: `Bearer ${idToken}`,
    }
  }

  return headers
}

export class HTTPError extends Error {
  /* ::
  status: number
  */

  constructor(statusCode /* : number */, message /* : string */) {
    super(message)
    this.status = statusCode
  }
}

async function fetchJSON(url, options) {
  const response = await fetch(url, options)

  if (response.status === 204) {
    return
  }

  const body = await response.json()
  if (response.ok) {
    return body
  }

  throw new HTTPError(response.status, body.message)
}

export async function searchRequest /* :: <T> */(
  url /* : string */,
  searchParameters /* : { [key: string]: any } */
) /* : Promise<T> */ {
  const queryStringParams = queryString.stringify(searchParameters || {})
  const body = await getRequest(`${url}?${queryStringParams}`)
  return body
}

export async function getRequest /* :: <T> */(
  url /* : string */
) /* : Promise<T> */ {
  const options = {
    method: 'GET',
    headers: await generateHeaders(),
  }

  // $FlowFixMe
  return fetchJSON(url, options)
}

export async function postRequest /* :: <T, OutT> */(
  url /* : string */,
  resource /* : T */
) /* : Promise<OutT> */ {
  const opts = {
    method: 'POST',
    headers: await generateHeaders(),
    body: JSON.stringify(resource),
  }

  // $FlowFixMe
  return fetchJSON(url, opts)
}

export async function putRequest /* :: <T, OutT> */(
  url /* : string */,
  resource /* : T */
) /* : Promise<OutT> */ {
  const opts = {
    method: 'PUT',
    headers: await generateHeaders(),
    body: JSON.stringify(resource),
  }

  // $FlowFixMe
  return fetchJSON(url, opts)
}

export async function deleteRequest(url /* : string */) /* : Promise<void> */ {
  const opts = {
    method: 'DELETE',
    headers: await generateHeaders(),
  }

  const res = await fetch(url, opts)
  if (!res.ok) {
    const errorPayload = await res.json()
    throw new HTTPError(res.status, errorPayload.message)
  }
}
