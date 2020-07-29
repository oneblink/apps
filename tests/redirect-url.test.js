// @flow
'use strict'

import replaceElementValues from '../src/services/replace-custom-values'

// $FlowFixMe
const definition /* : Form */ = {
  id: 1,
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
}
describe('Form redirect URL', () => {
  test('should replace all instances of {ELEMENT} with correct property value', () => {
    const url = 'https://some-url.com?name={ELEMENT:name}&home={ELEMENT:home}'

    const submissionResult = {
      ...baseSubmissionResult,
      submission: {
        name: 'blinkybill',
        home: 'gosford',
      },
    }

    const result = replaceElementValues(url, submissionResult)

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

    const result = replaceElementValues(url, submissionResult)

    expect(result).toEqual(
      'https://some-url.com?name=blinkybill&koala=blinkybill'
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

    const result = replaceElementValues(url, submissionResult)

    expect(result).toEqual('https://some-url.com?name=blinkybill')
  })
})
