import serverRequest from './serverRequest'
import { FormSubmission } from '../submission-service'
import Sentry from '../Sentry'
import OneBlinkAppsError from './errors/oneBlinkAppsError'

export default async function serverValidateForm(
  formSubmission: FormSubmission,
) {
  try {
    const result = await serverRequest(
      formSubmission.definition.serverValidation,
      {
        ...formSubmission,
        captchaTokens: undefined,
        definition: undefined,
        formId: formSubmission.definition.id,
      },
    )
    if (!result) return
    const { url, response } = result

    const data = await response.text()
    console.log(
      'Response from form validation endpoint:',
      url,
      response.status,
      data,
    )

    if (!response.ok) {
      Sentry.captureException(
        new Error(
          `Received ${response.status} status code from form validation endpoint`,
        ),
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
        'Form validation failed. We received an invalid response from the validation url',
        {
          originalError: new Error(data),
          httpStatusCode: response.status,
        },
      )
    }

    return
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
