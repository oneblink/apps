import { formElementsService } from '@oneblink/sdk-core'
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
import { FormTypes, FreshdeskTypes } from '@oneblink/types'
import Sentry from './Sentry'
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
 * @returns
 */
async function getForms(formsAppId: number): Promise<FormTypes.Form[]> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/forms`
  return searchRequest<{ forms: FormTypes.Form[] }>(url, {
    injectForms: true,
  })
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
 * @returns
 */
async function getForm(
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
 * @returns
 */
async function getFormElementLookups(
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
 * @returns
 */
async function getFormElementLookupById(
  organisationId: string,
  formsAppEnvironmentId: number,
  formElementLookupId: number,
): Promise<(FormTypes.FormElementLookup & { url: string | null }) | void> {
  return getFormElementLookups(organisationId, formsAppEnvironmentId).then(
    (formElementLookups) =>
      formElementLookups.find(
        (formElementLookup) => formElementLookup.id === formElementLookupId,
      ),
  )
}

async function getFormElementOptionsSets(
  organisationId: string,
  abortSignal?: AbortSignal,
): Promise<Array<FormTypes.FormElementDynamicOptionSet>> {
  const { formElementDynamicOptionSets } = await searchRequest(
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
      ok: true
      options: FormTypes.ChoiceElementOption[]
    }
  | {
      ok: false
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
  const freshdeskFieldOptionsResults =
    await getFormElementFreshdeskFieldOptions(input, abortSignal)
  const forms = Array.isArray(input) ? input : [input]
  if (!forms.length) {
    return freshdeskFieldOptionsResults
  }

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
  if (!formElementOptionsSetIds.length) {
    return freshdeskFieldOptionsResults
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
      const formElementDynamicOptionSetEnvironment =
        formElementOptionsSet.environments.find(
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
            signal: abortSignal,
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

          const choiceElementOptions =
            formElementsService.parseFormElementOptionsSet(result.options)
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
                const predicateElement = formElementsService.findFormElement(
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
        },
      )

      return optionsForElementId
    },
    freshdeskFieldOptionsResults,
  )
}

async function getFormElementFreshdeskFieldOptions(
  input: FormTypes.Form | FormTypes.Form[],
  abortSignal?: AbortSignal,
): Promise<Array<LoadFormElementOptionsResult>> {
  const forms = Array.isArray(input) ? input : [input]

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
              ok: false,
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
              ok: false,
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
            ok: true,
            elementId: element.id,
            options: options.map(({ label, value }) => ({
              id: value.toString(),
              value: value.toString(),
              label,
            })),
          })
        },
      )

      return optionsForElementId
    },
    [],
  )
}

export {
  LoadFormElementOptionsResult,
  getForms,
  getForm,
  getFormElementLookups,
  getFormElementLookupById,
  getFormElementDynamicOptions,
}
