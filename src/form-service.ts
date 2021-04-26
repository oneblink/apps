import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { isLoggedIn } from './services/cognito'
import { generateHeaders, getRequest, searchRequest } from './services/fetch'
import tenants from './tenants'
import { FormTypes, GeoscapeTypes, PointTypes } from '@oneblink/types'
import Sentry from './Sentry'

export async function getForms(formsAppId: number): Promise<FormTypes.Form[]> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms`
  return getRequest<{ forms: FormTypes.Form[] }>(url)
    .then(({ forms }) => forms)
    .catch((error) => {
      Sentry.captureException(error)
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
              httpStatusCode: error.status,
            },
          )
        }
      }
    })
}

export async function getForm(
  formId: number,
  formsAppId?: number,
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
        if (typeof formsAppId !== 'number' || Number.isNaN(formsAppId)) {
          throw error
        }

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
        Sentry.captureException(error)
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
                httpStatusCode: error.status,
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
      Sentry.captureException(error)
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

export function parseFormElementOptionsSet(
  data: unknown,
): FormTypes.ChoiceElementOption[] {
  if (!Array.isArray(data)) {
    return []
  }
  return data.reduce(
    (
      options: FormTypes.ChoiceElementOption[],
      record: unknown,
      index: number,
    ) => {
      if (typeof record === 'string') {
        options.push({
          id: index.toString(),
          value: record,
          label: record,
        })
      } else if (typeof record === 'object') {
        const option = record as Record<string, unknown>
        const value =
          typeof option.value === 'string' && option.value
            ? option.value
            : index.toString()
        const id =
          typeof option.id === 'string' && option.id ? option.id : value
        const label =
          typeof option.label === 'string' && option.label
            ? option.label
            : value
        const colour =
          typeof option.colour === 'string' && option.colour
            ? option.colour
            : undefined
        options.push({
          ...option,
          id,
          value,
          label,
          colour,
        })
      }
      return options
    },
    [],
  )
}

export type LoadFormElementDynamicOptionsResult =
  | {
      ok: true
      elementId: string
      options: FormTypes.ChoiceElementOption[]
    }
  | {
      ok: false
      elementId: string
      error: OneBlinkAppsError
    }

export async function getFormElementDynamicOptions(
  input: FormTypes.Form | FormTypes.Form[],
): Promise<Array<LoadFormElementDynamicOptionsResult>> {
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
  const organisationId = forms[0].organisationId
  const allFormElementOptionsSets = await getFormElementOptionsSets(
    organisationId,
  )

  const formElementOptionsSets = allFormElementOptionsSets.filter(({ id }) =>
    formElementOptionsSetIds.includes(id || 0),
  )
  if (!formElementOptionsSetIds.length) {
    return []
  }

  const formsAppEnvironmentId = forms[0].formsAppEnvironmentId
  const formElementOptionsSetUrls = formElementOptionsSets.reduce<
    Array<{
      formElementOptionsSetId: number
      formElementOptionsSetName: string
      formElementOptionsSetUrl?: string
    }>
  >((memo, formElementOptionsSet) => {
    const formElementOptionsSetId = formElementOptionsSet.id
    if (formElementOptionsSetId) {
      const formElementDynamicOptionSetEnvironment = formElementOptionsSet.environments.find(
        (environment) =>
          environment.formsAppEnvironmentId === formsAppEnvironmentId,
      )

      memo.push({
        formElementOptionsSetId,
        formElementOptionsSetName: formElementOptionsSet.name,
        formElementOptionsSetUrl: formElementDynamicOptionSetEnvironment?.url,
      })
    }

    return memo
  }, [])

  // Get the options for all the options sets
  const results = await Promise.all(
    formElementOptionsSetUrls.map<
      Promise<
        | {
            ok: true
            formElementOptionsSetId: number
            options: unknown
          }
        | {
            ok: false
            error: OneBlinkAppsError
            formElementOptionsSetId: number
          }
      >
    >(
      async ({
        formElementOptionsSetId,
        formElementOptionsSetName,
        formElementOptionsSetUrl,
      }) => {
        if (!formElementOptionsSetUrl) {
          return {
            ok: false,
            formElementOptionsSetId,
            error: new OneBlinkAppsError(
              `Options set configuration has not been completed yet. Please contact your administrator to rectify the issue.`,
              {
                title: 'Misconfigured Options Set',
                originalError: new Error(
                  JSON.stringify(
                    {
                      formElementOptionsSetId,
                      formElementOptionsSetName,
                      formsAppEnvironmentId,
                    },
                    null,
                    2,
                  ),
                ),
              },
            ),
          }
        }
        try {
          const headers = await generateHeaders()
          const response = await fetch(formElementOptionsSetUrl, {
            headers,
          })

          if (!response.ok) {
            const text = await response.text()
            throw new Error(text)
          }

          const options = await response.json()
          return {
            ok: true,
            formElementOptionsSetId,
            options,
          }
        } catch (error) {
          Sentry.captureException(error)
          return {
            ok: false,
            formElementOptionsSetId,
            error: new OneBlinkAppsError(
              `Options could not be loaded. Please contact your administrator to rectify the issue.`,
              {
                title: 'Invalid Options Set Response',
                httpStatusCode: error.status,
                originalError: new OneBlinkAppsError(
                  JSON.stringify(
                    {
                      formElementOptionsSetId,
                      formElementOptionsSetName,
                      formElementOptionsSetUrl,
                      formsAppEnvironmentId,
                    },
                    null,
                    2,
                  ),
                  {
                    originalError: error,
                  },
                ),
              },
            ),
          }
        }
      },
    ),
  )

  return forms.reduce<Array<LoadFormElementDynamicOptionsResult>>(
    (optionsForElementId, form) => {
      forEachFormElementWithOptions(form.elements, (element) => {
        // Elements with options already can be ignored
        if (Array.isArray(element.options)) {
          return
        }

        const result = results.find(
          (result) =>
            element.optionsType === 'DYNAMIC' &&
            element.dynamicOptionSetId === result.formElementOptionsSetId,
        )
        if (!result) {
          optionsForElementId.push({
            ok: false,
            elementId: element.id,
            error: new OneBlinkAppsError(
              `Options set does not exist. Please contact your administrator to rectify the issue.`,
              {
                title: 'Missing Options Set',
                originalError: new Error(
                  JSON.stringify(
                    {
                      formsAppEnvironmentId,
                      element,
                    },
                    null,
                    2,
                  ),
                ),
              },
            ),
          })
          return
        }

        if (!result.ok) {
          optionsForElementId.push({
            ok: false,
            elementId: element.id,
            error: result.error,
          })
          return
        }

        const choiceElementOptions = parseFormElementOptionsSet(result.options)
        const options = choiceElementOptions.map((option) => {
          const optionsMap = (option.attributes || []).reduce(
            (
              memo: Record<
                string,
                {
                  elementId: string
                  optionIds: string[]
                }
              >,
              { label, value },
            ) => {
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
                  predicateElement.type !== 'radio' &&
                  predicateElement.type !== 'compliance')
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
            ...option,
            attributes: Object.keys(optionsMap).map((key) => optionsMap[key]),
          }
        })
        optionsForElementId.push({
          ok: true,
          options,
          elementId: element.id,
        })
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

export function forEachFormElementWithOptions(
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
      formElement.type === 'radio' ||
      formElement.type === 'compliance'
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
