import { formElementsService } from '@oneblink/sdk-core'
import { FormTypes, FreshdeskTypes } from '@oneblink/types'
import { customAlphabet } from 'nanoid/non-secure'
import { format } from 'date-fns'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { isOffline } from './offline-service'
import { isLoggedIn } from './services/cognito'
import {
  generateHeaders,
  HTTPError,
  searchRequest,
  getRequest,
} from './services/fetch'
import tenants from './tenants'

import Sentry from './Sentry'
import { ReceiptDateFormat } from '@oneblink/types/typescript/forms'
export * from './services/integration-elements'

/**
 * Get an array of OneBlink Forms.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const forms = await formService.getForms(formAppId)
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
async function getForms(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<FormTypes.Form[]> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms`
  return searchRequest<{ forms: FormTypes.Form[] }>(
    url,
    {
      injectForms: true,
    },
    abortSignal,
  )
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

/**
 * Get a OneBlink Form.
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const formsAppId = 1 // `formsAppId` is optional
 * const form = await formService.getForm(formId, formAppId)
 * ```
 *
 * @param formId
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
async function getForm(
  formId: number,
  formsAppId?: number,
  abortSignal?: AbortSignal,
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

        return getForms(formsAppId, abortSignal)
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

/**
 * Get an array of OneBlink Form Element Lookups.
 *
 * #### Example
 *
 * ```js
 * const organisationId = '1234567890ABCDEFG'
 * const formsAppEnvironmentId = 1
 * const formElementLookups = await formService.getFormElementLookups(
 *   organisationId,
 *   formsAppEnvironmentId,
 * )
 * ```
 *
 * @param organisationId
 * @param formsAppEnvironmentId
 * @param abortSignal
 * @returns
 */
async function getFormElementLookups(
  organisationId: string,
  formsAppEnvironmentId: number,
  abortSignal?: AbortSignal,
): Promise<
  Array<
    FormTypes.FormElementLookup & {
      url: string | null
      records: FormTypes.FormElementLookupStaticDataRecord[] | null
    }
  >
> {
  return searchRequest<{ formElementLookups: FormTypes.FormElementLookup[] }>(
    `${tenants.current.apiOrigin}/form-element-lookups`,
    {
      organisationId,
    },
    abortSignal,
  )
    .then((data) =>
      data.formElementLookups.map((formElementLookup) => ({
        ...formElementLookup,
        url: getFormElementLookupUrl(formElementLookup, formsAppEnvironmentId),
        records: gotFormElementLookupRecords(
          formElementLookup,
          formsAppEnvironmentId,
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
function getFormElementLookupUrl(
  formElementLookup: FormTypes.FormElementLookup,
  formsAppEnvironmentId: number,
) {
  if (formElementLookup.type === 'STATIC_DATA') {
    return null
  }

  return formElementLookup.environments.reduce(
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
  )
}
function gotFormElementLookupRecords(
  formElementLookup: FormTypes.FormElementLookup,
  formsAppEnvironmentId: number,
) {
  if (formElementLookup.type !== 'STATIC_DATA') {
    return null
  }

  return formElementLookup.environments.reduce(
    (
      records: null | FormTypes.FormElementLookupStaticDataRecord[],
      formElementLookupEnvironment,
    ) => {
      if (
        !records &&
        formElementLookupEnvironment.formsAppEnvironmentId ===
          formsAppEnvironmentId
      ) {
        return formElementLookupEnvironment.records
      }
      return records
    },
    null,
  )
}

/**
 * Get a OneBlink Form Element Lookup.
 *
 * #### Example
 *
 * ```js
 * const organisationId = '1234567890ABCDEFG'
 * const formsAppEnvironmentId = 1
 * const formElementLookupId = 1
 * const formElementLookup = await formService.getFormElementLookupById(
 *   organisationId,
 *   formsAppEnvironmentId,
 *   formElementLookupId,
 * )
 * if (formElementLookup) {
 *   // Use lookup
 * }
 * ```
 *
 * @param organisationId
 * @param formsAppEnvironmentId
 * @param formElementLookupId
 * @param abortSignal
 * @returns
 */
async function getFormElementLookupById(
  organisationId: string,
  formsAppEnvironmentId: number,
  formElementLookupId: number,
  abortSignal?: AbortSignal,
): Promise<(FormTypes.FormElementLookup & { url: string | null }) | void> {
  return getFormElementLookups(
    organisationId,
    formsAppEnvironmentId,
    abortSignal,
  ).then((formElementLookups) =>
    formElementLookups.find(
      (formElementLookup) => formElementLookup.id === formElementLookupId,
    ),
  )
}

async function getFormElementOptionsSets(
  organisationId: string,
  abortSignal?: AbortSignal,
): Promise<Array<FormTypes.FormElementOptionSet>> {
  const { formElementDynamicOptionSets } = await searchRequest<{
    formElementDynamicOptionSets: Array<FormTypes.FormElementOptionSet>
  }>(
    `${tenants.current.apiOrigin}/form-element-options/dynamic`,
    {
      organisationId,
    },
    abortSignal,
  )
  return formElementDynamicOptionSets
}

type LoadFormElementOptionsResult = {
  elementId: string
} & (
  | {
      type: 'OPTIONS'
      options: FormTypes.ChoiceElementOption[]
    }
  | {
      type: 'SEARCH'
      url: string
      searchQuerystringParameter: string
    }
  | {
      type: 'ERROR'
      error: OneBlinkAppsError
    }
)

/**
 * Get a the options for a single Form or an array of Forms for Form Elements
 * that are using a OneBlink Form Element Options Set.
 *
 * #### Example
 *
 * ```js
 * const optionsForElementId =
 *   await formService.getFormElementDynamicOptions(form)
 *
 * // Set all the options for the required elements
 * for (const { elementId, options } of optionsForElementId.filter(
 *   ({ ok }) => ok,
 * )) {
 *   // BEWARE
 *   // this example does not accommodate for
 *   // nested elements in pages and repeatable sets
 *   // or for options sets that fail to load
 *   for (const formElement of form.elements) {
 *     if (formElement.id === elementId) {
 *       formElement.options = options
 *     }
 *   }
 * }
 * ```
 *
 * @param input
 * @param abortSignal
 * @returns
 */
async function getFormElementDynamicOptions(
  input: FormTypes.Form | FormTypes.Form[],
  abortSignal?: AbortSignal,
): Promise<Array<LoadFormElementOptionsResult>> {
  const forms = Array.isArray(input) ? input : [input]
  if (!forms.length) {
    return []
  }

  const freshdeskFieldOptionsResults =
    await getFormElementFreshdeskFieldOptions(forms, abortSignal)

  // Get the options sets id for each element
  const formElementOptionsSetIds = forms.reduce((ids: number[], form) => {
    formElementsService.forEachFormElementWithOptions(form.elements, (el) => {
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
    return freshdeskFieldOptionsResults
  }

  // Get the options sets for all the ids
  const organisationId = forms[0].organisationId
  const allFormElementOptionsSets = await getFormElementOptionsSets(
    organisationId,
    abortSignal,
  )

  const formElementOptionsSets = allFormElementOptionsSets.filter(({ id }) =>
    formElementOptionsSetIds.includes(id || 0),
  )
  if (!formElementOptionsSets.length) {
    return freshdeskFieldOptionsResults
  }

  const formsAppEnvironmentId = forms[0].formsAppEnvironmentId
  const staticOptionSets: Array<{
    formElementOptionsSetId: number
    formElementOptionsSetName: string
    formElementDynamicOptionSetEnvironment?: FormTypes.FormElementOptionSetEnvironmentStatic
  }> = []
  const formElementOptionsSetUrls = formElementOptionsSets.reduce<
    Array<{
      formElementOptionsSetId: number
      formElementOptionsSetName: string
      formElementOptionsSetUrl?: string
      searchQuerystringParameter: string | undefined
    }>
  >((memo, formElementOptionsSet) => {
    const formElementOptionsSetId = formElementOptionsSet.id
    if (formElementOptionsSetId) {
      if (formElementOptionsSet.type === 'STATIC') {
        const formElementDynamicOptionSetEnvironment =
          formElementOptionsSet.environments.find(
            (environment: FormTypes.FormElementOptionSetEnvironmentStatic) =>
              environment.formsAppEnvironmentId === formsAppEnvironmentId,
          )
        staticOptionSets.push({
          formElementOptionsSetId,
          formElementOptionsSetName: formElementOptionsSet.name,
          formElementDynamicOptionSetEnvironment,
        })
      } else {
        const formElementDynamicOptionSetEnvironment =
          formElementOptionsSet.environments.find(
            (environment: FormTypes.FormElementOptionSetEnvironmentUrl) =>
              environment.formsAppEnvironmentId === formsAppEnvironmentId,
          )
        memo.push({
          formElementOptionsSetId,
          formElementOptionsSetName: formElementOptionsSet.name,
          formElementOptionsSetUrl: formElementDynamicOptionSetEnvironment?.url,
          searchQuerystringParameter:
            formElementDynamicOptionSetEnvironment?.searchQuerystringParameter,
        })
      }
    }

    return memo
  }, [])

  // Get the options for all the options sets
  const results = await Promise.all(
    formElementOptionsSetUrls.map<
      Promise<
        {
          formElementOptionsSetId: number
        } & (
          | {
              type: 'OPTIONS'
              options: unknown
            }
          | {
              type: 'SEARCH'
              url: string
              searchQuerystringParameter: string
            }
          | {
              type: 'ERROR'
              error: OneBlinkAppsError
            }
        )
      >
    >(
      async ({
        formElementOptionsSetId,
        formElementOptionsSetName,
        formElementOptionsSetUrl,
        searchQuerystringParameter,
      }) => {
        if (!formElementOptionsSetUrl) {
          return {
            type: 'ERROR',
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

        if (searchQuerystringParameter) {
          return {
            type: 'SEARCH',
            formElementOptionsSetId,
            url: formElementOptionsSetUrl,
            searchQuerystringParameter,
          }
        }

        try {
          const headers = await generateHeaders()
          const response = await fetch(formElementOptionsSetUrl, {
            headers,
            signal: abortSignal,
          })

          if (!response.ok) {
            const text = await response.text()
            throw new Error(text)
          }

          const options = await response.json()
          return {
            type: 'OPTIONS',
            formElementOptionsSetId,
            options,
          }
        } catch (error) {
          Sentry.captureException(error)
          return {
            type: 'ERROR',
            formElementOptionsSetId,
            error: new OneBlinkAppsError(
              `Options could not be loaded. Please contact your administrator to rectify the issue.`,
              {
                title: 'Invalid Options Set Response',
                httpStatusCode: (error as HTTPError).status,
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
                    originalError: error as HTTPError,
                  },
                ),
              },
            ),
          }
        }
      },
    ),
  )

  // merge the static options with the URL option results
  for (const {
    formElementOptionsSetId,
    formElementDynamicOptionSetEnvironment,
    formElementOptionsSetName,
  } of staticOptionSets) {
    if (formElementDynamicOptionSetEnvironment) {
      results.push({
        type: 'OPTIONS',
        formElementOptionsSetId,
        options: formElementDynamicOptionSetEnvironment.options,
      })
    } else {
      results.push({
        type: 'ERROR',
        formElementOptionsSetId,
        error: new OneBlinkAppsError(
          `Options set environment configuration has not been completed yet. Please contact your administrator to rectify the issue.`,
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
      })
    }
  }

  return forms.reduce<Array<LoadFormElementOptionsResult>>(
    (optionsForElementId, form) => {
      formElementsService.forEachFormElementWithOptions(
        form.elements,
        (element) => {
          // Elements with options already can be ignored
          if (
            element.optionsType !== 'DYNAMIC' ||
            Array.isArray(element.options)
          ) {
            return
          }

          const result = results.find(
            (result) =>
              element.dynamicOptionSetId === result.formElementOptionsSetId,
          )
          if (!result) {
            optionsForElementId.push({
              type: 'ERROR',
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

          if (result.type === 'ERROR') {
            optionsForElementId.push({
              type: 'ERROR',
              elementId: element.id,
              error: result.error,
            })
            return
          }

          if (result.type === 'SEARCH') {
            optionsForElementId.push({
              type: 'SEARCH',
              elementId: element.id,
              url: result.url,
              searchQuerystringParameter: result.searchQuerystringParameter,
            })
            return
          }

          const choiceElementOptions =
            formElementsService.parseFormElementOptionsSet(
              result.options,
            ) as FormTypes.DynamicChoiceElementOption[]
          const options =
            choiceElementOptions.map<FormTypes.ChoiceElementOption>(
              (option) => {
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
                    const predicateElement =
                      formElementsService.findFormElement(
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

                    const predicateOption = predicateElementOptions?.find(
                      (option) => option.value === value,
                    )
                    memo[elementId] = memo[elementId] || {
                      elementId,
                      optionIds: [],
                    }
                    memo[elementId].optionIds.push(
                      predicateOption?.id || predicateOption?.value || value,
                    )
                    element.conditionallyShowOptionsElementIds =
                      element.conditionallyShowOptionsElementIds || []
                    element.conditionallyShowOptionsElementIds.push(elementId)
                    return memo
                  },
                  {},
                )

                return {
                  ...option,
                  attributes: Object.keys(optionsMap).map(
                    (key) => optionsMap[key],
                  ),
                } as FormTypes.ChoiceElementOption
              },
            )
          optionsForElementId.push({
            type: 'OPTIONS',
            options,
            elementId: element.id,
          })
        },
      )

      return optionsForElementId
    },
    freshdeskFieldOptionsResults,
  )
}

async function getFormElementFreshdeskFieldOptions(
  forms: FormTypes.Form[],
  abortSignal?: AbortSignal,
): Promise<Array<LoadFormElementOptionsResult>> {
  const freshdeskFieldNames = forms.reduce<string[]>((names, form) => {
    formElementsService.forEachFormElementWithOptions(form.elements, (el) => {
      if (
        // Ignore elements that have options as we don't need to fetch these again
        !Array.isArray(el.options) &&
        el.optionsType === 'FRESHDESK_FIELD' &&
        el.freshdeskFieldName
      ) {
        names.push(el.freshdeskFieldName)
      }
    })
    return names
  }, [])

  if (!freshdeskFieldNames.length) {
    return []
  }

  const allFreshdeskFields = await getRequest<FreshdeskTypes.FreshdeskField[]>(
    `${tenants.current.apiOrigin}/forms/${forms[0].id}/freshdesk-fields`,
    abortSignal,
  )
  const freshdeskFields = allFreshdeskFields.filter(({ name }) =>
    freshdeskFieldNames.includes(name),
  )
  if (!freshdeskFields.length) {
    return []
  }

  return forms.reduce<Array<LoadFormElementOptionsResult>>(
    (optionsForElementId, form) => {
      formElementsService.forEachFormElementWithOptions(
        form.elements,
        (element) => {
          // Elements with options already can be ignored
          if (
            element.optionsType !== 'FRESHDESK_FIELD' ||
            Array.isArray(element.options)
          ) {
            return
          }

          const freshdeskField = freshdeskFields.find(
            (freshdeskField) =>
              element.freshdeskFieldName === freshdeskField.name,
          )
          if (!freshdeskField) {
            optionsForElementId.push({
              type: 'ERROR',
              elementId: element.id,
              error: new OneBlinkAppsError(
                `Freshdesk Field does not exist. Please contact your administrator to rectify the issue.`,
                {
                  title: 'Missing Freshdesk Field',
                  originalError: new Error(JSON.stringify(element, null, 2)),
                },
              ),
            })
            return
          }
          const options = freshdeskField.options
          if (!Array.isArray(options)) {
            optionsForElementId.push({
              type: 'ERROR',
              elementId: element.id,
              error: new OneBlinkAppsError(
                `Freshdesk Field does not have options. Please contact your administrator to rectify the issue.`,
                {
                  title: 'Invalid Freshdesk Field',
                  originalError: new Error(
                    JSON.stringify({ element, freshdeskField }, null, 2),
                  ),
                },
              ),
            })
            return
          }

          optionsForElementId.push({
            type: 'OPTIONS',
            elementId: element.id,
            options: mapNestedOptions(options) || [],
          })
        },
      )

      return optionsForElementId
    },
    [],
  )
}

const mapNestedOptions = (
  options: FreshdeskTypes.FreshdeskFieldOption[] | undefined,
): FormTypes.ChoiceElementOption[] | undefined => {
  return options?.map<FormTypes.ChoiceElementOption>(
    ({ value, label, options: nestedOptions }) => ({
      id: value.toString(),
      value: value.toString(),
      label,
      options: mapNestedOptions(
        nestedOptions,
      ) as FormTypes.DynamicChoiceElementOption[],
    }),
  )
}

const dateFormatMap: Record<ReceiptDateFormat, string> = {
  dayOfMonth: 'dd',
  monthNumber: 'MM',
  yearShort: 'yy',
  year: 'yyyy',
}

function buildAlphabet(alphabetConfig: FormTypes.ReceiptRandomComponent) {
  let alphabet = ''
  // all letters except i o and l
  const allowedLetters = 'abcdefghjkmnpqrstuvwxyz'
  if (alphabetConfig.lowercase) {
    alphabet += allowedLetters
  }
  if (alphabetConfig.uppercase) {
    alphabet += allowedLetters.toUpperCase()
  }
  if (alphabetConfig.numbers) {
    // all numbers except 0
    alphabet += '123456789'
  }
  return alphabet
}

function generateExternalId(receiptComponents: FormTypes.ReceiptComponent[]) {
  const date = new Date()
  return receiptComponents.reduce((id: string, component) => {
    switch (component.type) {
      case 'text':
        return id + component.value
      case 'date': {
        const dateFormat = dateFormatMap[component.format]
        if (dateFormat) {
          return id + format(date, dateFormat)
        }
        break
      }
      case 'random': {
        const alphabet = buildAlphabet(component)
        if (alphabet) {
          const randomFunc = customAlphabet(alphabet, component.length)
          return id + randomFunc()
        }
        break
      }
    }
    return id
  }, '')
}

export {
  LoadFormElementOptionsResult,
  getForms,
  getForm,
  getFormElementLookups,
  getFormElementLookupById,
  getFormElementDynamicOptions,
  generateExternalId,
}
