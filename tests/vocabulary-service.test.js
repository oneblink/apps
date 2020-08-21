// @flow
'use strict'

import tenants from '../src/tenants'
import vocabularyService from '../src/vocabulary-service'

test('it should format currency, date and times correctly', () => {
  const date1 = new Date('2020-12-21T06:56:37.850Z')
  const date2 = new Date('2020-01-01T13:56:37.850Z')
  const amount1 = 123
  const amount2 = 0.12345
  const amount3 = 9.909
  const amount4 = 9.999

  // OneBlink Tenant
  tenants.useOneBlink()
  expect(vocabularyService.locale).toBe('en-AU')

  expect(vocabularyService.formatCurrency(amount1)).toEqual(
    expect.stringContaining('$123.00')
  )
  expect(vocabularyService.formatCurrency(amount2)).toEqual(
    expect.stringContaining('$0.12')
  )
  expect(vocabularyService.formatCurrency(amount3)).toEqual(
    expect.stringContaining('$9.91')
  )
  expect(vocabularyService.formatCurrency(amount4)).toEqual(
    expect.stringContaining('$10.00')
  )

  expect(vocabularyService.formatDate(date1)).toBe('21/12/2020')
  expect(vocabularyService.formatDate(date2)).toBe('02/01/2020')

  expect(vocabularyService.formatTime(date1)).toBe('5:56 pm')
  expect(vocabularyService.formatTime(date2)).toBe('12:56 am')

  expect(vocabularyService.formatDatetime(date1)).toBe('21/12/2020 5:56 pm')
  expect(vocabularyService.formatDatetime(date2)).toBe('02/01/2020 12:56 am')

  // CivicPlus Tenant
  tenants.useCivicPlus()
  expect(vocabularyService.locale).toBe('en-US')

  expect(vocabularyService.formatCurrency(amount1)).toEqual(
    expect.stringContaining('$123.00')
  )
  expect(vocabularyService.formatCurrency(amount2)).toEqual(
    expect.stringContaining('$0.12')
  )
  expect(vocabularyService.formatCurrency(amount3)).toEqual(
    expect.stringContaining('$9.91')
  )
  expect(vocabularyService.formatCurrency(amount4)).toEqual(
    expect.stringContaining('$10.00')
  )

  expect(vocabularyService.formatDate(date1)).toBe('12/21/2020')
  expect(vocabularyService.formatDate(date2)).toBe('01/02/2020')

  expect(vocabularyService.formatTime(date1)).toBe('5:56 PM')
  expect(vocabularyService.formatTime(date2)).toBe('12:56 AM')

  expect(vocabularyService.formatDatetime(date1)).toBe('12/21/2020 5:56 PM')
  expect(vocabularyService.formatDatetime(date2)).toBe('01/02/2020 12:56 AM')
})
