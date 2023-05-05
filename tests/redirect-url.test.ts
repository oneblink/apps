import { FormTypes } from '@oneblink/types'
import replaceInjectablesWithSubmissionValues from '../src/services/replaceInjectablesWithSubmissionValues'

describe('Form redirect URL', () => {
  const definition: FormTypes.Form = {
    id: 1,
    name: 'string',
    description: 'string',
    organisationId: 'string',
    formsAppEnvironmentId: 1,
    formsAppIds: [],
    elements: [],
    isAuthenticated: false,
    isMultiPage: false,
    postSubmissionAction: 'FORMS_LIBRARY',
    cancelAction: 'FORMS_LIBRARY',
    submissionEvents: [],
    tags: [],
    createdAt: 'string',
    updatedAt: 'string',
  }
  const baseSubmissionResult = {
    formsAppId: 1,
    definition,
    jobId: null,
    draftId: null,
    externalId: null,
    preFillFormDataId: null,
    submissionId: null,
    submissionTimestamp: null,
    payment: null,
    scheduling: null,
    captchaTokens: [],
    isInPendingQueue: false,
    isOffline: false,
    isUploadingAttachments: false,
  }

  test('should replace all instances of {ELEMENT} with correct property value', () => {
    const url = 'https://some-url.com?name={ELEMENT:name}&home={ELEMENT:home}'

    const submissionResult = {
      ...baseSubmissionResult,
      submission: {
        name: 'blinkybill',
        home: 'gosford',
      },
    }

    const result = replaceInjectablesWithSubmissionValues(url, submissionResult)

    expect(result).toEqual('https://some-url.com?name=blinkybill&home=gosford')
  })

  test('should replace all INDENTICAL instances of {ELEMENT} with correct property value', () => {
    const url = 'https://some-url.com?name={ELEMENT:name}&koala={ELEMENT:name}'

    const submissionResult = {
      ...baseSubmissionResult,
      definition,
      submission: {
        name: 'blinkybill',
      },
    }

    const result = replaceInjectablesWithSubmissionValues(url, submissionResult)

    expect(result).toEqual(
      'https://some-url.com?name=blinkybill&koala=blinkybill',
    )
  })

  test('should replace only one(1) instance of {ELEMENT} with correct property value', () => {
    const url = 'https://some-url.com?name={ELEMENT:name}'

    const submissionResult = {
      ...baseSubmissionResult,
      definition,
      submission: {
        name: 'blinkybill',
      },
    }

    const result = replaceInjectablesWithSubmissionValues(url, submissionResult)

    expect(result).toEqual('https://some-url.com?name=blinkybill')
  })
})
