import OneBlinkAppsError from '../services/errors/oneBlinkAppsError'
import { isOffline } from '../offline-service'
import {
  fetchJSON,
  getRequest,
  HTTPError,
  postRequest,
  searchRequest,
} from '../services/fetch'
import tenants from '../tenants'
import {
  GeoscapeTypes,
  PointTypes,
  CivicaTypes,
  FormTypes,
  MiscTypes,
  APINSWTypes,
} from '@oneblink/types'
import Sentry from '../Sentry'
import { add } from 'date-fns'

/**
 * Search for geoscape addresses based on a partial address.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const result = await formService.searchGeoscapeAddresses(formId, {
 *   query: '123 N',
 *   maxNumberOfResults: 10
 *   stateTerritory: 'NSW'
 * })
 * ```
 *
 * @param formId
 * @param queryParams
 * @param abortSignal
 * @returns
 */
export async function searchGeoscapeAddresses(
  formId: number,
  queryParams: {
    query: string
    maxNumberOfResults?: number
    stateTerritory?: string
    dataset?: string
    addressType?: 'physical' | 'mailing' | 'all'
    excludeAliases?: boolean
  },
  abortSignal?: AbortSignal,
): Promise<GeoscapeTypes.GeoscapeAddressesSearchResult> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/geoscape/addresses`,
      queryParams,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          "Please contact your administrator to ensure this application's configuration has been completed successfully.",
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Get the details for a single geoscape address based on the Id of a geoscape
 * address resource.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const addressId = 'ABC123'
 * const result = await formService.getGeoscapeAddress(formId, addressId)
 * ```
 *
 * @param formId
 * @param addressId
 * @param abortSignal
 * @returns
 */
export async function getGeoscapeAddress(
  formId: number,
  addressId: string,
  abortSignal?: AbortSignal,
): Promise<GeoscapeTypes.GeoscapeAddress> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/geoscape/addresses/${addressId}`,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          "Please contact your administrator to ensure this application's configuration has been completed successfully.",
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Search for Point addresses based on a partial address.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const result = await formService.searchPointAddresses(formId, {
 *   address: '123 N',
 *   maxNumberOfResults: 10
 *   stateTerritory: 'NSW'
 * })
 * ```
 *
 * @param formId
 * @param queryParams
 * @param abortSignal
 * @returns
 */
export async function searchPointAddresses(
  formId: number,
  queryParams: {
    address: string
    maxNumberOfResults?: number
    stateTerritory?: string
    dataset?: string
    addressType?: 'physical' | 'mailing' | 'all'
  },
  abortSignal?: AbortSignal,
): Promise<PointTypes.PointAddressesSearchResult> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/point/addresses`,
      queryParams,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          "Please contact your administrator to ensure this application's configuration has been completed successfully.",
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Get the details for a single Point address based on the Id of a Point address resource.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const addressId = 'ABC123'
 * const result = await formService.getPointAddress(formId, addressId)
 * ```
 *
 * @param formId
 * @param addressId
 * @param abortSignal
 * @returns
 */
export async function getPointAddress(
  formId: number,
  addressId: string,
  abortSignal?: AbortSignal,
): Promise<PointTypes.PointAddress> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/point/addresses/${addressId}`,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          "Please contact your administrator to ensure this application's configuration has been completed successfully.",
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Search for street names in Civica
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const queryParams = {
 *   search: '1 Station ',
 *   top: 10,
 * }
 * const result = await formService.searchCivicaStreetNames(
 *   formId,
 *   queryParams,
 * )
 * ```
 *
 * @param formId
 * @param queryParams
 * @param abortSignal
 * @returns
 */
export async function searchCivicaStreetNames(
  formId: number,
  queryParams: {
    search?: string
    top?: number
  },
  abortSignal?: AbortSignal,
): Promise<CivicaTypes.CivicaStreetName[]> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/civica/streetregister/streetnames`,
      queryParams,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          "Please contact your administrator to ensure this application's configuration has been completed successfully.",
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Get titles codes from Civica name register
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const results = await formService.getCivicaTitleCodes(formId)
 * ```
 *
 * @param formId
 * @param abortSignal
 * @returns
 */
export async function getCivicaTitleCodes(
  formId: number,
  abortSignal?: AbortSignal,
): Promise<FormTypes.ChoiceElementOption[]> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/civica/nameregister/titlecodes`,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          "Please contact your administrator to ensure this application's configuration has been completed successfully.",
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Get BSB record based on a BSB number codes from Civica name register
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const bsb = '123-321'
 * const results = await formService.getBSBRecord(formId, bsb)
 * ```
 *
 * @param formId
 * @param bsb
 * @param abortSignal
 * @returns
 */
export async function getBSBRecord(
  formId: number,
  bsb: string,
  abortSignal?: AbortSignal,
): Promise<MiscTypes.BSBRecord> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/bsb-records/${bsb}`,
      abortSignal,
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'The BSB number you have entered does not exist.',
          {
            originalError: error,
            title: 'Unknown BSB Number',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

const API_NSW_LIQUOR_LICENCE_TOKEN_KEY = 'API_NSW_LIQUOR_LICENCE_TOKEN'
function getAPINSWLiquorLicenceTokenFromStorage() {
  const localStorageValue = localStorage.getItem(
    API_NSW_LIQUOR_LICENCE_TOKEN_KEY,
  )
  if (localStorageValue) {
    try {
      return JSON.parse(
        localStorageValue,
      ) as APINSWTypes.LiquorLicenceAccessTokenResponse
    } catch {
      // ignore JSON parse error
    }
  }
}

async function getAPINSWLiquorLicenceToken(
  formId: number,
  abortSignal?: AbortSignal,
) {
  const liquorLicenceAccessTokenResponse =
    getAPINSWLiquorLicenceTokenFromStorage()
  if (liquorLicenceAccessTokenResponse) {
    const now = new Date()
    const issuedAt = new Date(
      parseInt(liquorLicenceAccessTokenResponse.issued_at),
    )
    const expiresAt = add(issuedAt, {
      seconds: parseInt(liquorLicenceAccessTokenResponse.expires_in),
    })
    if (expiresAt > now) {
      return liquorLicenceAccessTokenResponse
    }
  }

  const result =
    await postRequest<APINSWTypes.LiquorLicenceAccessTokenResponse>(
      `${tenants.current.apiOrigin}/forms/${formId}/api-nsw/liquor/access-token`,
      abortSignal,
    )
  localStorage.setItem(API_NSW_LIQUOR_LICENCE_TOKEN_KEY, JSON.stringify(result))
  return result
}

/**
 * Search for API.NSW Liquor licences based on a partial text search.
 *
 * #### Example
 *
 * ```js
 * const result = await formService.searchAPINSWLiquorLicences({
 *   formId: 1,
 *   search: 'SMITH',
 * })
 * ```
 *
 * @param options
 * @param abortSignal
 * @returns
 */
export async function searchAPINSWLiquorLicences(
  {
    formId,
    searchText,
  }: {
    formId: number
    searchText: string
  },
  abortSignal?: AbortSignal,
): Promise<APINSWTypes.LiquorLicenceBrowseResults> {
  try {
    const apiNSWLiquorLicenceToken = await getAPINSWLiquorLicenceToken(
      formId,
      abortSignal,
    )
    return await fetchJSON<APINSWTypes.LiquorLicenceBrowseResults>(
      `https://api.onegov.nsw.gov.au/liquorregister/v1/browse?searchText=${searchText}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          apikey: apiNSWLiquorLicenceToken.client_id,
          Authorization: `Bearer ${apiNSWLiquorLicenceToken.access_token}`,
        },
        signal: abortSignal,
      },
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          "Please contact your administrator to ensure this application's configuration has been completed successfully.",
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}

/**
 * Get the details for a single  API.NSW Liquor licence based on the licenceID.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const licenceId = '1-RL22KV'
 * const result = await formService.getAPINSWLiquorLicence(formId, licenceId)
 * ```
 *
 * @param formId
 * @param licenceId
 * @param abortSignal
 * @returns
 */
export async function getAPINSWLiquorLicence(
  formId: number,
  licenceId: string,
  abortSignal?: AbortSignal,
): Promise<APINSWTypes.LiquorLicenceDetails> {
  try {
    const apiNSWLiquorLicenceToken = await getAPINSWLiquorLicenceToken(
      formId,
      abortSignal,
    )
    return await fetchJSON<APINSWTypes.LiquorLicenceDetails>(
      `https://api.onegov.nsw.gov.au/liquorregister/v1/details?licenceid=${licenceId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          apikey: apiNSWLiquorLicenceToken.client_id,
          Authorization: `Bearer ${apiNSWLiquorLicenceToken.access_token}`,
        },
        signal: abortSignal,
      },
    )
  } catch (err) {
    if (!abortSignal?.aborted) {
      Sentry.captureException(err)
    }
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError('Please login and try again.', {
          originalError: error,
          requiresLogin: true,
          httpStatusCode: error.status,
        })
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          "Please contact your administrator to ensure this application's configuration has been completed successfully.",
          {
            originalError: error,
            title: 'Unknown Application',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}
