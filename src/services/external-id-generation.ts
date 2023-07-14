import { FormSubmission } from '../types/submissions'
import serverRequest from './serverRequest'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import { generateExternalId } from '../form-service'

export default async function externalIdGeneration(
  formSubmission: FormSubmission,
): Promise<{
  externalId: string | null
}> {
  try {
    if (
      formSubmission.definition.externalIdGenerationOnSubmit?.type ===
      'RECEIPT_ID'
    ) {
      if (formSubmission.externalId) {
        console.log(
          'Skipping generating an externalId based on receipt components and using',
          formSubmission.externalId,
        )
        return {
          externalId: formSubmission.externalId,
        }
      }
      return {
        externalId: generateExternalId(
          formSubmission.definition.externalIdGenerationOnSubmit.configuration
            .receiptComponents,
        ),
      }
    }

    const result = await serverRequest(
      formSubmission.definition.externalIdGenerationOnSubmit,
      {
        externalIdUrlSearchParam: formSubmission.externalId,
        formsAppId: formSubmission.formsAppId,
        formId: formSubmission.definition.id,
        draftId: formSubmission.draftId ? formSubmission.draftId : null,
        preFillFormDataId: formSubmission.preFillFormDataId,
        jobId: formSubmission.jobId,
        previousFormSubmissionApprovalId:
          formSubmission.previousFormSubmissionApprovalId ?? null,
      },
    )
    if (!result) {
      console.log(
        'Skipping generating an externalId based on URL and using',
        formSubmission.externalId,
      )
      return {
        externalId: formSubmission.externalId,
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
  } catch (error) {
    if (/Failed to fetch/.test((error as Error).message)) {
      throw new OneBlinkAppsError(
        'We encountered a network related issue. Please ensure you are connected to the internet before trying again. If the problem persists, contact your administrator.',
        {
          title: 'Connectivity Issues',
          originalError: error as Error,
          isOffline: true,
        },
      )
    }
    throw error
  }
}
