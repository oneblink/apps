import { FormTypes } from '@oneblink/types'
import { formElementsService } from '@oneblink/sdk-core'
import { FormSubmissionResult } from '../src/types/submissions'

describe('findPaymentElementValue()', () => {
  const createTextElement = (name: string) => {
    const textElement: FormTypes.TextElement = {
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
  const createNumberElement = (name: string) => {
    const numberElement: FormTypes.NumberElement = {
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
  const createSectionElement = (
    id: string,
    elements: FormTypes.FormElement[],
  ) => {
    const sectionsElement: FormTypes.SectionElement = {
      id,
      type: 'section',
      conditionallyShow: false,
      label: 'Section',
      requiresAllConditionallyShowPredicates: false,
      elements,
      isCollapsed: false,
    }
    return sectionsElement
  }
  const createPageElement = (
    id: string,
    elements: FormTypes.FormElement[],
  ): FormTypes.PageElement => {
    return {
      id,
      label: id,
      type: 'page',
      elements,
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
    }
  }
  const elements: FormTypes.FormElement[] = [
    createPageElement('Page1', [
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
    ]),
    createPageElement('Page2', [createTextElement('Page2Text')]),
  ]
  const submission: FormSubmissionResult['submission'] = {
    A: 'AText',
    B_A: 'B_AText',
    B_B_A: 'B_B_AText',
    B_B_B: 'B_B_BText',
    B_B_C: 123,
    B_C_A: 0,
    B_C_B: 'B_C_BText',
    B_C_C_A: 'B_C_C_AText',
    C: 'CText',
    D: 5,
    Page2Text: 'Page 2 Text',
  }

  test('should return a nested element value within a submission object', () => {
    const elementNameAndId = 'D'
    const value = formElementsService.getRootElementValueById(
      elementNameAndId,
      elements,
      submission,
    )
    expect(value).toBe(5)
  })
  test('should return a nested element value within a submission object', () => {
    const elementNameAndId = 'B_C_C_A'
    const value = formElementsService.getRootElementValueById(
      elementNameAndId,
      elements,
      submission,
    )
    expect(value).toBe('B_C_C_AText')
  })

  test('`getPaymentValueFromPath` should return undefined when given an invalid element id', () => {
    const value = formElementsService.getRootElementValueById(
      'abc123',
      elements,
      submission,
    )
    expect(value).toBe(undefined)
  })
})
