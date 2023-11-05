import { FormTypes } from '@oneblink/types'
import { format } from 'date-fns'

describe('generateExternalId', () => {
  beforeEach(() => {
    jest.mock('nanoid/non-secure', () => {
      return {
        customAlphabet: () => () => 'abCD5678',
      }
    })
  })
  it('should generate an id with text, the date and random string', async () => {
    const { generateExternalId } = await import(
      '../../src/services/generateExternalId'
    )
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

  it('should ignore bad config', async () => {
    const { generateExternalId } = await import(
      '../../src/services/generateExternalId'
    )
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

    expect(externalId).toBe('ABC')
  })
})
