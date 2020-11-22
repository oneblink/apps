import * as queryString from 'query-string'

import { getIdToken } from './forms-key'
import { getUserToken } from './user-token'

async function generateHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  // Check auth service for a token if user is logged in
  const idToken = await getIdToken()
  if (idToken) {
    return {
      ...headers,
      Authorization: `Bearer ${idToken}`,
    }
  }
  const userToken = getUserToken()
  if (userToken) {
    return {
      ...headers,
      'X-OneBlink-User-Token': (userToken as unknown) as string,
    }
  }

  return headers
}

export class HTTPError extends Error {
  status: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.status = statusCode
  }
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)

  if (response.status === 204) {
    // @ts-expect-error
    return
  }

  const body = await response.json()
  if (response.ok) {
    return body
  }

  throw new HTTPError(response.status, body.message)
}

export async function searchRequest<T>(
  url: string,
  searchParameters?: queryString.StringifiableRecord,
): Promise<T> {
  const queryStringParams = queryString.stringify(searchParameters || {})
  const body = await getRequest<T>(`${url}?${queryStringParams}`)
  return body
}

export async function getRequest<T>(url: string): Promise<T> {
  const options = {
    method: 'GET',
    headers: await generateHeaders(),
  }

  return fetchJSON(url, options)
}

export async function postRequest<OutT>(
  url: string,
  resource?: unknown,
): Promise<OutT> {
  const opts = {
    method: 'POST',
    headers: await generateHeaders(),
    body: JSON.stringify(resource),
  }

  return fetchJSON(url, opts)
}

export async function putRequest<OutT>(
  url: string,
  resource: unknown,
): Promise<OutT> {
  const opts = {
    method: 'PUT',
    headers: await generateHeaders(),
    body: JSON.stringify(resource),
  }

  return fetchJSON(url, opts)
}

export async function deleteRequest(url: string): Promise<void> {
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
