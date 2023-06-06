import { FormTypes } from '@oneblink/types'
import { generateHeaders } from './fetch'

function getOBApi(apiId: string, apiEnv: string): string {
  if (apiEnv.toLowerCase() === 'prod') {
    return apiId
  }
  const arr = apiId.split('.')
  arr[0] += `-${apiEnv}`
  return arr.join('.')
}

export default async function serverRequest(
  endpoint: FormTypes.Form['serverValidation'],
  payload: Record<string, unknown>,
): Promise<{ response: Response; url: string } | void> {
  if (!endpoint) return

  const url =
    endpoint.type === 'CALLBACK'
      ? endpoint.configuration.url
      : `https://${getOBApi(
          endpoint.configuration.apiId,
          endpoint.configuration.apiEnvironment,
        )}${endpoint.configuration.apiEnvironmentRoute}`

  const headers = await generateHeaders()
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  return { response, url }
}
