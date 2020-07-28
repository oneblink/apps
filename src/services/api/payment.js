// @flow
'use strict'

import { postRequest } from '../fetch'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'

const generatePaymentConfiguration = (
  url /* : string */,
  payload /* : mixed */
) /* : Promise<{ hostedFormUrl: string, submissionId: string }> */ => {
  console.log('Attempting to generate payment configuration', url)
  return postRequest(url, payload).catch((error) => {
    console.warn(
      'Error occurred while attempting to generate configuration for payment',
      error
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot make payments until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          }
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access make payments. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          }
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the configuration required to make a payment. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          }
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
          }
        )
      }
    }
  })
}

const verifyPaymentTransaction = /* :: <T> */ (
  url /* : string */,
  payload /* : mixed */
) /* : Promise<T> */ => {
  console.log('Attempting to verify payment transaction', url)
  return postRequest(url, payload).catch((error) => {
    console.warn(
      'Error occurred while attempting to verify a transaction',
      error
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot verify a transaction until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          }
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to verify your transactions. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          }
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the configuration required to verify your transaction. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          }
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
          }
        )
      }
    }
  })
}

const acknowledgeCPPayTransaction = (
  formId /* : FormId */,
  payload /* : mixed */
) /* : Promise<void> */ => {
  const url = `/forms/${formId}/cp-pay-acknowledge`
  console.log('Attempting to acknowledge CP Pay transaction', url)
  return postRequest(url, payload).catch((error) => {
    console.warn(
      'Error occurred while attempting to acknowledge a CP Pay transaction',
      error
    )
    switch (error.status) {
      case 401: {
        throw new OneBlinkAppsError(
          'You cannot acknowledge a transaction until you have logged in. Please login and try again.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresLogin: true,
          }
        )
      }
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to acknowledge your transactions. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            httpStatusCode: error.status,
            requiresAccessRequest: true,
          }
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the configuration required to acknowledge your transaction. Please contact your administrator to ensure your application configuration has been completed successfully.',
          {
            originalError: error,
            httpStatusCode: error.status,
          }
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
          }
        )
      }
    }
  })
}

export {
  generatePaymentConfiguration,
  acknowledgeCPPayTransaction,
  verifyPaymentTransaction,
}