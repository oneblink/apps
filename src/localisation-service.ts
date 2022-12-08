import tenants from './tenants'
import parser from 'ua-parser-js'

let iosVersion: number | undefined
const parsedUserAgent: parser.IResult = parser(window.navigator.userAgent)
if (
  parsedUserAgent.os.name === 'iOS' &&
  typeof parsedUserAgent.os.version === 'string'
) {
  iosVersion = parseFloat(parsedUserAgent.os.version)
  if (Number.isNaN(iosVersion)) {
    iosVersion = undefined
  }
}

/**
 * Get the locale (e.g. `en-AU`) for the current tenant.
 *
 * #### Example
 *
 * ```js
 * const locale = localisationService.getLocale()
 * ```
 *
 * @returns
 */
export function getLocale() {
  return tenants.locale
}

function generateFormats({
  time,
  shortDate,
  longDate,
}: {
  time: string
  shortDate: string
  longDate: string
}) {
  return {
    time,
    shortDate,
    longDate,
    shortDateTime: `${shortDate} ${time}`,
    longDateTime: `${longDate} ${time}`,
  }
}

export function getDateFnsFormats() {
  const time = 'h:mm a'
  switch (tenants.locale) {
    case 'en-US': {
      return generateFormats({
        time,
        shortDate: 'MM/dd/yyyy',
        longDate: 'MMM do, yyyy',
      })
    }
    case 'en-AU':
    default: {
      return generateFormats({
        time,
        shortDate: 'dd/MM/yyyy',
        longDate: 'do MMM, yyyy',
      })
    }
  }
}

export function getFlatpickrFormats() {
  const time = 'h:i K'
  switch (tenants.locale) {
    case 'en-US': {
      return generateFormats({
        time,
        shortDate: 'm/d/Y',
        longDate: 'M J, Y',
      })
    }
    case 'en-AU':
    default: {
      return generateFormats({
        time,
        shortDate: 'd/m/Y',
        longDate: 'J M, Y',
      })
    }
  }
}

/**
 * Format a `Date` as a `string` that just contains the date portion e.g. _31/01/2020_
 *
 * #### Example
 *
 * ```js
 * const date = new Date()
 * const text = localisationService.formatDate(date)
 * // Display text
 * ```
 *
 * @param value
 * @returns
 */
export function formatDate(value: Date): string {
  return tenants.current.intlFormats.date.format(value)
}

/**
 * Format a `Date` as a `string` that just contains the date portion in a long
 * format e.g. _Thursday, 2 January 2020_
 *
 * #### Example
 *
 * ```js
 * const date = new Date()
 * const text = localisationService.formatDateLong(date)
 * // Display text
 * ```
 *
 * @param value
 * @returns
 */
export function formatDateLong(value: Date): string {
  return tenants.current.intlFormats.dateLong.format(value)
}

/**
 * Format a `Date` as a `string` that just contains the time portion e.g. _5:31 pm_
 *
 * #### Example
 *
 * ```js
 * const date = new Date()
 * const text = localisationService.formatTime(date)
 * // Display text
 * ```
 *
 * @param value
 * @returns
 */
export function formatTime(value: Date): string {
  /*
   * Time formatting for older iOS devices. Prevents date from repeating.
   * Example: Last sync time: 24/11/2022 24/11/2022
   */
  if (typeof iosVersion === 'number' && iosVersion < 13.0) {
    const time = tenants.current.intlFormats.olderIOSTime.formatToParts(value)
    const newTime = time.map((t) => t.value).join('')
    return `${newTime}`
  }
  return tenants.current.intlFormats.time.format(value)
}

/**
 * Format a `Date` as a `string` that contains the date and time portions e.g.
 * _31/01/2020 5:31 pm_
 *
 * #### Example
 *
 * ```js
 * const date = new Date()
 * const text = localisationService.formatDatetime(date)
 * // Display text
 * ```
 *
 * @param value
 * @returns
 */
export function formatDatetime(value: Date) {
  return `${formatDate(value)} ${formatTime(value)}`
}

/**
 * Format a `Date` as a `string` that contains the date and time portions in a
 * long format e.g. _Thursday, 2 January 2020 5:31 pm_
 *
 * #### Example
 *
 * ```js
 * const date = new Date()
 * const text = localisationService.formatDatetime(date)
 * // Display text
 * ```
 *
 * @param value
 * @returns
 */
export function formatDatetimeLong(value: Date) {
  return `${formatDateLong(value)} ${formatTime(value)}`
}

/**
 * Format a `number` as a `string` represented as a readable number e.g. _123,321.123_
 *
 * #### Example
 *
 * ```js
 * const amount = 1234.4321
 * const text = localisationService.formatCurrency(amount)
 * // Display text
 * ```
 *
 * @param value
 * @returns
 */
export function formatNumber(value: number): string {
  return tenants.current.intlFormats.number.format(value)
}

/**
 * Format a `number` as a `string` represented as a currency e.g. _$123.31_
 *
 * #### Example
 *
 * ```js
 * const amount = 123.321
 * const text = localisationService.formatCurrency(amount)
 * // Display text
 * ```
 *
 * @param value
 * @returns
 */
export function formatCurrency(value: number): string {
  return tenants.current.intlFormats.currency.format(value)
}
