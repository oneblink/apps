import { generateExternalId } from '../src/form-service'
import { FormTypes } from '@oneblink/types'
import { format } from 'date-fns'

jest.mock('nanoid/non-secure', () => {
  return {
    customAlphabet: () => () => 'abCD5678',
  }
})

describe('Form Service', () => {
  describe('generateExternalId', () => {
    it('should generate an id with text, the date and random string', () => {
      const config: FormTypes.ReceiptComponent[] = [
        {
          type: 'text',
          value: 'ABC',
        },
        {
          type: 'text',
          value: '-',
        },
        { type: 'date', format: 'year' },
        {
          type: 'text',
          value: '-',
        },
        { type: 'date', format: 'monthNumber' },
        {
          type: 'text',
          value: '-',
        },
        { type: 'date', format: 'dayOfMonth' },
        {
          type: 'text',
          value: '-',
        },
        {
          type: 'random',
          length: 8,
          numbers: true,
          lowercase: true,
          uppercase: true,
        },
      ]
      const externalId = generateExternalId(config)
      const date = new Date()

      expect(externalId).toMatch(
        new RegExp(`^ABC-${format(date, 'yyyy-MM-dd')}-[a-zA-Z0-9]{8}$`),
      )
    })

    it('should ignore bad config', () => {
      const config: FormTypes.ReceiptComponent[] = [
        {
          type: 'text',
          value: 'ABC',
        },
        {
          type: 'date',
          //@ts-expect-error deliberate error
          value: 'dayName',
        },
        {
          //@ts-expect-error deliberate error
          type: 'dates',
          value: 'dayOfMonth',
        },
      ]

      const externalId = generateExternalId(config)

      expect(externalId).toMatch(new RegExp('^ABC$'))
    })
  })
})
