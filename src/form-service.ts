import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { isLoggedIn } from './services/cognito'
import { getRequest, searchRequest } from './services/fetch'
import tenants from './tenants'
import { FormTypes, GeoscapeTypes } from '@oneblink/types'

export async function getForms(formsAppId: number): Promise<FormTypes.Form[]> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms`
  return getRequest<{ forms: FormTypes.Form[] }>(url)
    .then(({ forms }) => forms)
    .catch((error) => {
      console.error('Error retrieving forms', error)

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
          throw new OneBlinkAppsError(
            'We could not find the application you are looking for. Please contact your administrator to ensure the application configuration has been completed successfully.',
            {
              originalError: error,
              title: 'Unknown Application',
              requiresAccessRequest: true,
              httpStatusCode: error.status,
            },
          )
        }
        default: {
          throw new OneBlinkAppsError(
            'An unknown error has occurred. Please contact support if the problem persists.',
            {
              originalError: error,
            },
          )
        }
      }
    })
}

export async function getForm(
  formsAppId: number,
  formId: number,
): Promise<FormTypes.Form> {
  return (
    searchRequest<FormTypes.Form>(
      `${tenants.current.apiOrigin}/forms/${formId}`,
      {
        injectForms: true,
      },
    )
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
            },
          )
        }

        switch (error.status) {
          case 401: {
            throw new OneBlinkAppsError(
              'The form you are attempting to complete requires authentication. Please login and try again.',
              {
                originalError: error,
                requiresLogin: true,
                httpStatusCode: error.status,
              },
            )
          }
          case 403: {
            throw new OneBlinkAppsError(
              'You do not have access to complete this form. Please contact your administrator to gain the correct level of access.',
              {
                originalError: error,
                requiresAccessRequest: true,
                httpStatusCode: error.status,
              },
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
              },
            )
          }
        }
      })
  )
}

export async function getFormElementLookups(
  organisationId: string,
  formsAppEnvironmentId: number,
): Promise<Array<FormTypes.FormElementLookup & { url: string | null }>> {
  return searchRequest<{ formElementLookups: FormTypes.FormElementLookup[] }>(
    `${tenants.current.apiOrigin}/form-element-lookups`,
    {
      organisationId,
    },
  )
    .then((data) =>
      data.formElementLookups.map((formElementLookup) => ({
        ...formElementLookup,
        url: formElementLookup.environments.reduce(
          (url: null | string, formElementLookupEnvironment) => {
            if (
              !url &&
              formElementLookupEnvironment.formsAppEnvironmentId ===
                formsAppEnvironmentId
            ) {
              return formElementLookupEnvironment.url
            }
            return url
          },
          null,
        ),
      })),
    )
    .catch((error) => {
      console.warn(
        `Error retrieving form element lookups for organisationId ${organisationId}`,
        error,
      )
      throw error
    })
}

export async function getFormElementLookupById(
  organisationId: string,
  formsAppEnvironmentId: number,
  formElementLookupId: number,
): Promise<(FormTypes.FormElementLookup & { url: string | null }) | void> {
  return getFormElementLookups(
    organisationId,
    formsAppEnvironmentId,
  ).then((formElementLookups) =>
    formElementLookups.find(
      (formElementLookup) => formElementLookup.id === formElementLookupId,
    ),
  )
}

async function getFormElementOptionsSets(
  organisationId: string,
): Promise<Array<FormTypes.FormElementDynamicOptionSet>> {
  const { formElementDynamicOptionSets } = await searchRequest(
    `${tenants.current.apiOrigin}/form-element-options/dynamic`,
    {
      organisationId,
    },
  )
  return formElementDynamicOptionSets
}

export async function getFormElementDynamicOptions(
  input: FormTypes.Form | FormTypes.Form[],
): Promise<
  Array<{ elementId: string; options: FormTypes.ChoiceElementOption[] }>
> {
  const forms = Array.isArray(input) ? input : [input]
  if (!forms.length) {
    return []
  }

  // Get the options sets id for each element
  const formElementOptionsSetIds = forms.reduce((ids: number[], form) => {
    forEachFormElementWithOptions(form.elements, (el) => {
      if (
        // Ignore elements that have options as we don't need to fetch these again
        !Array.isArray(el.options) &&
        el.optionsType === 'DYNAMIC' &&
        typeof el.dynamicOptionSetId === 'number'
      ) {
        ids.push(el.dynamicOptionSetId)
      }
    })
    return ids
  }, [])

  if (!formElementOptionsSetIds.length) {
    return []
  }

  // Get the options sets for all the ids
  const allFormElementOptionsSets = await getFormElementOptionsSets(
    forms[0].organisationId,
  )
  const formElementOptionsSets = allFormElementOptionsSets.filter(({ id }) =>
    formElementOptionsSetIds.includes(id || 0),
  )
  if (!formElementOptionsSetIds.length) {
    return []
  }

  // Get the options for all the options sets
  const results = await Promise.all(
    formElementOptionsSets.map(async (formElementOptionsSet) => {
      const url = formElementOptionsSet.environments.reduce(
        (url: string | null, formElementDynamicOptionSetEnvironment) => {
          if (
            !url &&
            formElementDynamicOptionSetEnvironment.formsAppEnvironmentId ===
              forms[0].formsAppEnvironmentId
          ) {
            return formElementDynamicOptionSetEnvironment.url
          }
          return url
        },
        null,
      )
      if (!url) {
        return
      }
      try {
        const options = await getRequest(url)
        return {
          formElementOptionsSetId: formElementOptionsSet.id,
          options,
        }
      } catch (error) {
        console.warn('Error getting dynamic options from ' + url, error)
      }
    }),
  )

  return forms.reduce(
    (
      optionsForElementId: Array<{
        elementId: string
        options: FormTypes.ChoiceElementOption[]
      }>,
      form,
    ) => {
      forEachFormElementWithOptions(form.elements, (element) => {
        const result = results.find(
          (result) =>
            // It wants us to check for element types with an dynamicOptionSetId property.
            // This will be undefined if not an element with options, and we don't
            // want to have to come back here and add types when adding more types
            result &&
            !Array.isArray(element.options) &&
            element.dynamicOptionSetId === result.formElementOptionsSetId,
        )
        if (!result || !Array.isArray(result.options)) {
          return
        }

        try {
          const options = result.options.map((option, index) => {
            option = option || {}
            const optionsMap = (option.attributes || []).reduce(
              // @ts-expect-error
              (memo, { label, value }) => {
                if (
                  !element.attributesMapping ||
                  !Array.isArray(element.attributesMapping)
                ) {
                  return memo
                }
                const attribute = element.attributesMapping.find(
                  (map) => map.attribute === label,
                )
                if (!attribute) return memo

                const elementId = attribute.elementId
                const predicateElement = findFormElement(
                  form.elements,
                  (el) => el.id === elementId,
                )
                if (
                  !predicateElement ||
                  (predicateElement.type !== 'select' &&
                    predicateElement.type !== 'autocomplete' &&
                    predicateElement.type !== 'checkboxes' &&
                    predicateElement.type !== 'radio')
                ) {
                  return memo
                }

                let predicateElementOptions = predicateElement.options
                if (!predicateElementOptions) {
                  const predicateElementResult = results.find(
                    (result) =>
                      result &&
                      predicateElement.dynamicOptionSetId ===
                        result.formElementOptionsSetId,
                  )
                  if (predicateElementResult) {
                    // @ts-expect-error
                    predicateElementOptions = predicateElementResult.options
                  } else {
                    predicateElementOptions = []
                  }
                }

                const predicateOption = predicateElementOptions.find(
                  (option) => option.value === value,
                )
                if (elementId && predicateOption) {
                  memo[elementId] = memo[elementId] || {
                    elementId,
                    optionIds: [],
                  }
                  memo[elementId].optionIds.push(
                    predicateOption.id || predicateOption.value,
                  )
                  element.conditionallyShowOptionsElementIds =
                    element.conditionallyShowOptionsElementIds || []
                  element.conditionallyShowOptionsElementIds.push(elementId)
                }
                return memo
              },
              {},
            )

            return {
              id: option.value || index,
              value: option.value || index,
              label: option.label || index,
              colour: option.colour || undefined,
              attributes: Object.keys(optionsMap).map((key) => optionsMap[key]),
            }
          })
          optionsForElementId.push({
            options,
            elementId: element.id,
          })
        } catch (error) {
          console.warn('Could not validate dynamic options', result, error)
        }
      })

      return optionsForElementId
    },
    [],
  )
}

export function forEachFormElement(
  elements: FormTypes.FormElement[],
  forEach: (
    element: FormTypes.FormElement,
    elements: FormTypes.FormElement[],
  ) => void,
): void {
  findFormElement(elements, (formElement, parentElements) => {
    forEach(formElement, parentElements)
    return false
  })
}

function forEachFormElementWithOptions(
  elements: FormTypes.FormElement[],
  forEach: (
    elementWithOptions: FormTypes.FormElementWithOptions,
    elements: FormTypes.FormElement[],
  ) => void,
): void {
  findFormElement(elements, (formElement, parentElements) => {
    if (
      formElement.type === 'select' ||
      formElement.type === 'autocomplete' ||
      formElement.type === 'checkboxes' ||
      formElement.type === 'radio'
    ) {
      forEach(formElement, parentElements)
    }
    return false
  })
}

export function findFormElement(
  elements: FormTypes.FormElement[],
  predicate: (
    element: FormTypes.FormElement,
    elements: FormTypes.FormElement[],
  ) => boolean,
  parentElements: FormTypes.FormElement[] = [],
): FormTypes.FormElement | void {
  for (const element of elements) {
    if (predicate(element, parentElements)) {
      return element
    }

    if (
      (element.type === 'repeatableSet' ||
        element.type === 'page' ||
        element.type === 'form' ||
        element.type === 'infoPage') &&
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
          },
        )
      }
    }
  }
}
