import { AWSTypes } from '@oneblink/types'
import { HTTPError, postRequest } from '../fetch'
import { downloadPreFillS3Data } from '../s3Submit'
import tenants from '../../tenants'
import Sentry from '../../Sentry'
import { isOffline } from '../../offline-service'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'

export async function downloadPreFillFormData<T>(
  formId: number,
  preFillFormDataId: string,
): Promise<T> {
  let data
  try {
    const url = `${tenants.current.apiOrigin}/forms/${formId}/pre-fill-retrieval-credentials/${preFillFormDataId}`
    console.log(
      'Attempting to get Credentials to download pre fill form data',
      url,
    )
    data = await postRequest<AWSTypes.FormS3Credentials>(url)
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error retrieving pre-fill credentials', err)
    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'The application you are attempting to view requires authentication. Please login and try again.',
          {
            originalError: error,
            requiresLogin: true,
            httpStatusCode: error.status,
          },
        )
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
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
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
  console.log('Attempting to download pre fill form data:', data)
  return downloadPreFillS3Data(data)
}
