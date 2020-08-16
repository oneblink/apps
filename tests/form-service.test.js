// @flow
'use strict'

import { findFormElement } from '../src/form-service'

describe('findFormElement()', () => {
  test('should find an element in a nested form', () => {
    const elementId = '08138f9b-2b39-4c7d-9bc9-fbdbed3e7308'
    const element = findFormElement(
      [
        {
          name: 'Number',
          label: 'Number',
          type: 'number',
          required: true,
          defaultValue: 0,
          id: 'b1dde277-8ff7-4b59-a2e0-63ba5e010f36',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          readOnly: false,
          isSlider: false,
          isDataLookup: false,
          isElementLookup: false,
        },
        {
          name: 'Nested_Form_with_one_required_element',
          type: 'form',
          id: '56cd2b03-da3d-4229-8891-ce8e47453f6a',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          formId: 2723,
          elements: [
            {
              name: 'Text',
              label: 'Text',
              type: 'text',
              required: true,
              id: elementId,
              defaultValue: undefined,
              conditionallyShow: false,
              requiresAllConditionallyShowPredicates: false,
              readOnly: false,
              isDataLookup: false,
              isElementLookup: false,
            },
          ],
        },
      ],
      (element) => elementId === element.id
    )
    expect(element).toBeTruthy()
  })
})
