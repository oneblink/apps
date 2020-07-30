// @flow
'use strict'

import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { isLoggedIn } from './services/cognito'
import { getRequest, searchRequest } from './services/fetch'
import tenants from './tenants'

export async function getForms(
  formsAppId /* : number */
) /* : Promise<Form[]> */ {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms`
  return getRequest(url)
    .then(({ forms }) => forms)
    .catch((error) => {
      console.error('Error retrieving forms', error)

      if (isOffline()) {
        throw new OneBlinkAppsError(
          'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
          {
            originalError: error,
            isOffline: true,
          }
        )
      }
      switch (error.status) {
        case 401: {
          throw new OneBlinkAppsError(
            'The application you are attempting to view requires authentication. Please contact your administrator to gain credentials for access.',
            {
              originalError: error,
              requiresLogin: true,
              httpStatusCode: error.status,
            }
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            'You do not have access to this application. Please contact your administrator to gain the correct level of access.',
            {
              originalError: error,
              requiresAccessRequest: true,
              httpStatusCode: error.status,
            }
          )
        }
        case 400:
        case 404: {
          throw new OneBlinkAppsError(
            'We could not find the application you are looking for. Please contact your administrator to ensure the application configuration has been completed successfully.',
            {
              originalError: error,
              title: 'Unknown Application',
              requiresAccessRequest: true,
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

export async function getForm(
  formsAppId /* : number */,
  formId /* : number */
) /* : Promise<Form> */ {
  return (
    searchRequest(`${tenants.current.apiOrigin}/forms/${formId}`, {
      injectForms: true,
    })
      // If we could not find a form by Id for any reason,
      // we will try and get it from cache from the all forms endpoint
      .catch((error) => {
        return getForms(formsAppId)
          .catch(() => {
            // Ignore getForms() error and throw the error from attempt to get form by id
            throw error
          })
          .then((forms) => {
            const form = forms.find((form) => form.id === formId)
            if (form) {
              return form
            }
            throw error
          })
      })
      .catch((error) => {
        console.warn(`Error retrieving form ${formId} from API`, error)
        if (isOffline()) {
          throw new OneBlinkAppsError(
            'You are currently offline and do not have a local copy of this form available, please connect to the internet and try again',
            {
              originalError: error,
              isOffline: true,
            }
          )
        }

        switch (error.status) {
          case 401: {
            throw new OneBlinkAppsError(
              'The form you are attempting to complete requires authentication. Please contact your administrator to gain credentials for access.',
              {
                originalError: error,
                requiresLogin: true,
                httpStatusCode: error.status,
              }
            )
          }
          case 403: {
            throw new OneBlinkAppsError(
              'You do not have access to complete this form. Please contact your administrator to gain the correct level of access.',
              {
                originalError: error,
                requiresAccessRequest: true,
                httpStatusCode: error.status,
              }
            )
          }
          case 400:
          case 404: {
            let message =
              'We could not find the form you are looking for. Please contact your administrator to ensure your form configuration has been completed successfully.'
            const requiresLogin = !isLoggedIn()
            if (requiresLogin) {
              message +=
                ' Try logging in if you believe this form requires authentication.'
            }
            throw new OneBlinkAppsError(message, {
              originalError: error,
              title: 'Unknown Form',
              httpStatusCode: error.status,
              requiresLogin,
            })
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
  )
}

export async function getFormElementLookups(
  organisationId /* : string  */,
  formsAppEnvironmentId /* : number */
) /* : Promise<Array<FormElementLookup & { url: string }>> */ {
  return searchRequest(`${tenants.current.apiOrigin}/form-element-lookups`, {
    organisationId,
  })
    .then((data) =>
      data.formElementLookups.map((formElementLookup) => ({
        ...formElementLookup,
        url: formElementLookup.environments.reduce(
          (url, formElementLookupEnvironment) => {
            if (
              !url &&
              formElementLookupEnvironment.formsAppEnvironmentId ===
                formsAppEnvironmentId
            ) {
              return formElementLookupEnvironment.url
            }
            return url
          },
          null
        ),
      }))
    )
    .catch((error) => {
      console.warn(
        `Error retrieving form element lookups for organisationId ${organisationId}`,
        error
      )
      throw error
    })
}

export async function getFormElementLookupById(
  organisationId /* : string  */,
  formsAppEnvironmentId /* : number */,
  formElementLookupId /* : number */
) /* : Promise<FormElementLookup & { url: string } | void> */ {
  return getFormElementLookups(
    organisationId,
    formsAppEnvironmentId
  ).then((formElementLookups) =>
    formElementLookups.find(
      (formElementLookup) => formElementLookup.id === formElementLookupId
    )
  )
}

export async function getFormElementOptionsSets(
  organisationId /* : string  */,
  formsAppEnvironmentId /* : number */
) /* : Promise<Array<FormElementDynamicOptionSet & { url: string }>> */ {
  return searchRequest(
    `${tenants.current.apiOrigin}/form-element-options/dynamic`,
    {
      organisationId,
    }
  )
    .then((data) =>
      data.formElementDynamicOptionSets.map((formElementDynamicOptionSet) => ({
        ...formElementDynamicOptionSet,
        url: formElementDynamicOptionSet.environments.reduce(
          (url, formElementDynamicOptionSetEnvironment) => {
            if (
              !url &&
              formElementDynamicOptionSetEnvironment.formsAppEnvironmentId ===
                formsAppEnvironmentId
            ) {
              return formElementDynamicOptionSetEnvironment.url
            }
            return url
          },
          null
        ),
      }))
    )
    .catch((error) => {
      console.warn(
        `Error retrieving dynamic options sets for organisationId ${organisationId}`,
        error
      )
      throw error
    })
}

export async function getFormElementOptionsSetById(
  organisationId /* : string  */,
  formsAppEnvironmentId /* : number */,
  dynamicOptionsSetId /* : number */
) /* : Promise<FormElementDynamicOptionSet & { url: string } | void> */ {
  return getFormElementOptionsSets(
    organisationId,
    formsAppEnvironmentId
  ).then((dynamicOptionsSets) =>
    dynamicOptionsSets.find(
      (dynamicOptionsSet) => dynamicOptionsSet.id === dynamicOptionsSetId
    )
  )
}

export async function getFormElementDynamicOptions(
  form /* : Form */,
  element /* : FormElement */
) /* : Promise<ChoiceElementOption[] | void> */ {
  // $FlowFixMe
  if (!element.optionsType || element.optionsType === 'CUSTOM') {
    return
  }

  if (element.optionsType !== 'DYNAMIC' || !element.dynamicOptionSetId) {
    return
  }

  const dynamicOptionSetId = element.dynamicOptionSetId

  const dynamicOptionsSet = await getFormElementOptionsSetById(
    form.organisationId,
    form.formsAppEnvironmentId,
    dynamicOptionSetId
  )
  if (!dynamicOptionsSet) {
    throw new Error(
      'Could not find Dynamic Options Set for Id: ' + dynamicOptionSetId
    )
  }

  return getRequest(dynamicOptionsSet.url).then((res) => res.data)
}

export function forEachFormElement(
  elements /* : FormElement[] */,
  forEach /* : (FormElement, FormElement[]) => void */
) /* : void */ {
  findFormElement(elements, (formElement, parentElements) => {
    forEach(formElement, parentElements)
    return false
  })
}

export function findFormElement(
  elements /* : FormElement[] */,
  predicate /* : (FormElement, FormElement[]) => boolean */,
  parentElements /* : FormElement[] */ = []
) /* : FormElement | void */ {
  for (const element of elements) {
    if (predicate(element, parentElements)) {
      return element
    }

    if (
      (element.type === 'repeatableSet' || element.type === 'page') &&
      Array.isArray(element.elements)
    ) {
      const nestedElement = findFormElement(element.elements, predicate, [
        ...parentElements,
        element,
      ])

      if (nestedElement) {
        return nestedElement
      }
    }
  }
}
