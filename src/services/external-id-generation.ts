import { FormTypes, SubmissionTypes } from '@oneblink/types'
import serverRequest from './serverRequest'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import { generateExternalId } from '../form-service'

export default async function externalIdGeneration(
  endpoint: FormTypes.Form['externalIdGeneration'],
  payload: {
    formsAppId: number
    formId: number
    externalIdUrlSearchParam: string | null
    draftId: string | null
    preFillFormDataId: string | null
    jobId: string | null
    previousFormSubmissionApprovalId: string | null
  },
): Promise<{
  externalId: string | null
  submission?: SubmissionTypes.S3SubmissionData['submission']
  elements?: FormTypes.FormElement[]
}> {
  if (endpoint?.type === 'RECEIPT_ID') {
    return {
      externalId:
        payload.externalIdUrlSearchParam ||
        generateExternalId(endpoint.configuration.receiptComponents),
    }
  }
  const result = await serverRequest(endpoint, payload)
  if (!result) {
    console.log(
      'Skipping generating an externalId and using',
      payload.externalIdUrlSearchParam,
    )
    return {
      externalId: payload.externalIdUrlSearchParam,
    }
  }
  const { url, response } = result

  if (!response.ok) {
    const data = await response.text()
    console.log(
      'Response from form generate externalId endpoint:',
      url,
      response.status,
      data,
    )
    let json: ReturnType<typeof JSON.parse>
    try {
      json = JSON.parse(data)
    } catch (err) {
      // Nothing
    }
    if (response.status === 400 && json && json.message) {
      throw new OneBlinkAppsError(json.message, {
        httpStatusCode: response.status,
      })
    }
    throw new OneBlinkAppsError(
      'Receipt generation failed. We received an invalid response from the receipt generation url.',
      {
        originalError: new Error(data),
        httpStatusCode: response.status,
      },
    )
  }

  const data = await response.json()
  console.log('Generated externalId from URL', url, data)
  return data
}
