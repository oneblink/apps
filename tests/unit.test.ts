import {
  getPaymentElementValuePath,
  getPaymentValueFromPath,
} from '../dist/services/prepareSubmissionData'

const createTextElement = (name) => {
  const textElement = {
    id: name,
    name,
    type: 'text',
    conditionallyShow: false,
    isDataLookup: false,
    isElementLookup: false,
    label: 'Text',
    readOnly: false,
    required: false,
    requiresAllConditionallyShowPredicates: false,
  }
  return textElement
}
const createNumberElement = (name) => {
  const numberElement = {
    id: name,
    name,
    type: 'number',
    conditionallyShow: false,
    isDataLookup: false,
    isElementLookup: false,
    label: 'Number',
    readOnly: false,
    required: false,
    requiresAllConditionallyShowPredicates: false,
    isSlider: false,
  }
  return numberElement
}
const createSectionElement = (name, elements) => {
  const sectionsElement = {
    id: name,
    name,
    type: 'section',
    conditionallyShow: false,
    label: 'Section',
    requiresAllConditionallyShowPredicates: false,
    elements,
    isCollapsed: false,
  }
  return sectionsElement
}
const form = {
  cancelAction: 'BACK',
  createdAt: '2021-06-16 00:00:00',
  updatedAt: '2021-06-16 00:00:00',
  description: '',
  formsAppEnvironmentId: 1,
  formsAppIds: [],
  id: 1,
  isAuthenticated: false,
  isInfoPage: false,
  isMultiPage: false,
  name: 'Form',
  organisationId: '123',
  postSubmissionAction: 'BACK',
  submissionEvents: [],
  tags: [],
  elements: [
    createTextElement('A'),
    createSectionElement('B', [
      createTextElement('B_A'),
      createSectionElement('B_B', [
        createTextElement('B_B_A'),
        createTextElement('B_B_B'),
        createNumberElement('B_B_C'),
      ]),
      createSectionElement('B_C', [
        createNumberElement('B_C_A'),
        createTextElement('B_C_B'),
        createSectionElement('B_C_C', [createTextElement('B_C_C_A')]),
      ]),
    ]),
    createTextElement('C'),
    createNumberElement('D'),
  ],
}
const submission = {
  A: 'AText',
  B: {
    B_A: 'B_AText',
    B_B: {
      B_B_A: 'B_B_AText',
      B_B_B: 'B_B_BText',
      B_B_C: 123,
    },
    B_C: {
      B_C_A: 0,
      B_C_B: 'B_C_BText',
      B_C_C: {
        B_C_C_A: 'B_C_C_AText',
      },
    },
  },
  C: 'CText',
  D: 5,
}

describe('findPaymentElementValue()', () => {
  test('should return a nested element value within a submission object', () => {
    const elementName = 'D'
    const valuePath = getPaymentElementValuePath(elementName, form.elements)
    expect(valuePath).toStrictEqual([elementName])
    const value = getPaymentValueFromPath(valuePath, submission)
    expect(value).toBe(5)
  })
  test('should return a nested element value within a submission object', () => {
    const elementName = 'B_C_C_A'
    const valuePath = getPaymentElementValuePath(elementName, form.elements)
    expect(valuePath).toStrictEqual(['B', 'B_C', 'B_C_C', elementName])
    const value = getPaymentValueFromPath(valuePath, submission)
    expect(value).toBe('B_C_C_AText')
  })

  test('`getPaymentValueFromPath` should return undefined when given an invalid path', () => {
    const value = getPaymentValueFromPath(
      ['B', 'B_C', 'B_A_C', 'B_C_C_A'],
      submission,
    )
    expect(value).toBe(undefined)
  })
})
