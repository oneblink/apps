import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { saveAs } from 'file-saver'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  generateHeaders,
  searchRequest,
  postRequest,
  HTTPError,
} from './services/fetch'
import tenants from './tenants'

/** Filter for a single property in a Form Store Record */
export type FormStoreFilter<T> = {
  $regex?: string
  $options?: string
  $eq?: T
  $gte?: T
  $gt?: T
  $lt?: T
  $lte?: T
  $in?: string[]
  $elemMatch?: {
    $in?: string[]
  }
}

/** Filters available for filter Form Store Records */
export type FormStoreFilters = {
  /** Sort the results by multiple properties */
  sorting?: Array<{ property: string; direction: 'ascending' | 'descending' }>
  /** Filter results by the date/time they were submitted */
  dateTimeSubmitted?: FormStoreFilter<string>
  /** Filter results by the user that submitted */
  submittedBy?: FormStoreFilter<string>
  /** Filter results by the submissionId, must be a valid GUID */
  submissionId?: FormStoreFilter<string>
  /** Filter results by the externalId */
  externalId?: FormStoreFilter<string>
  /** Filter results by the submission data */
  submission?: Record<string, FormStoreFilter<unknown> | undefined>
}

/**
 * Get the available form elements for a form to display form store records
 *
 * #### Example
 *
 * ```js
 * const formId = 1
 * const { formElements } = await formStoreService.getFormStoreDefinition(
 *   formId,
 * )
 * ```
 *
 * @param formId The identified of the form you want to get the definition of
 * @param abortSignal An AbortSignal to abort the request
 * @returns
 */
export async function getFormStoreDefinition(
  formId: number,
  abortSignal?: AbortSignal,
): Promise<{ formElements: FormTypes.FormElementWithName[] }> {
  try {
    return await searchRequest(
      `${tenants.current.apiOrigin}/form-store/elements`,
      {
        formId,
      },
      abortSignal,
    )
  } catch (err) {
    const error = err as HTTPError
    throw new OneBlinkAppsError(error.message, {
      httpStatusCode: error.status,
    })
  }
}

/**
 * Search for Form Store Records
 *
 * #### Example
 *
 * ```js
 * const { formStoreRecords } =
 *   await formStoreService.searchFormStoreRecords({
 *     formId: 1,
 *     paging: {
 *       limit: 50,
 *       offset: 0,
 *     },
 *   })
 * ```
 *
 * @param searchParameters Search parameters for filtering, sorting, and paging
 * @param abortSignal An AbortSignal to abort the request
 * @returns
 */
export async function searchFormStoreRecords(
  searchParameters: {
    formId: number
    paging: {
      limit: number
      offset: number
    }
    filters?: FormStoreFilters
  },
  abortSignal: AbortSignal,
): Promise<{
  formStoreRecords: SubmissionTypes.FormStoreRecord[]
  meta: { limit: number; offset: number; nextOffset?: number }
}> {
  try {
    const { submissions, meta } = await postRequest(
      `${tenants.current.apiOrigin}/form-store`,
      {
        sorting: searchParameters.filters?.sorting,
        ...searchParameters,
      },
      abortSignal,
    )
    return {
      formStoreRecords: submissions,
      meta,
    }
  } catch (err) {
    const error = err as HTTPError
    throw new OneBlinkAppsError(error.message, {
      httpStatusCode: error.status,
    })
  }
}

/**
 * Export Form Store Records as a CSV file. This function will download the file
 * automatically.
 *
 * #### Example
 *
 * ```js
 * await formStoreService.exportFormStoreRecords({
 *   formId: 1,
 * })
 * ```
 *
 * @param fileName Name of the file to download. ".csv" will be added to the end
 *   of the file name if not passed
 * @param searchParameters Search parameters for filtering, sorting, and including columns
 * @param abortSignal An AbortSignal to abort the request
 * @returns
 */
export async function exportFormStoreRecords(
  fileName: string,
  searchParameters: {
    formId: number
    filters?: FormStoreFilters
    includeColumns?: string[]
  },
  abortSignal?: AbortSignal,
): Promise<void> {
  if (!fileName.toLowerCase().endsWith('.csv')) {
    fileName += '.csv'
  }
  const headers = await generateHeaders()
  headers.Accept = 'text/csv'
  const response = await fetch(
    `${tenants.current.apiOrigin}/form-store/export`,
    {
      method: 'POST',
      headers,
      mode: 'cors',
      cache: 'default',
      body: JSON.stringify(searchParameters),
      signal: abortSignal,
    },
  )
  if (response.ok) {
    const blob = await response.blob()
    saveAs(blob, fileName)
  } else {
    const body = await response.json()
    throw new OneBlinkAppsError(body.message, {
      httpStatusCode: response.status,
    })
  }
}
