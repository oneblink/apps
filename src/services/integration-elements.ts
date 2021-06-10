import OneBlinkAppsError from '../services/errors/oneBlinkAppsError'
import { isOffline } from '../offline-service'
import { getRequest, searchRequest } from '../services/fetch'
import tenants from '../tenants'
import { GeoscapeTypes, PointTypes, CivicaTypes } from '@oneblink/types'
import Sentry from '../Sentry'

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
  } catch (error) {
    Sentry.captureException(error)
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
  } catch (error) {
    Sentry.captureException(error)
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
  } catch (error) {
    Sentry.captureException(error)
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
  } catch (error) {
    Sentry.captureException(error)
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
  } catch (error) {
    Sentry.captureException(error)
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

export async function getCivicaTitleCodes(
  formId: number,
  abortSignal?: AbortSignal,
): Promise<{ label: string; value: string }[]> {
  try {
    return await getRequest(
      `${tenants.current.apiOrigin}/forms/${formId}/civica/nameregister/titlecodes`,
      abortSignal,
    )
  } catch (error) {
    Sentry.captureException(error)
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
