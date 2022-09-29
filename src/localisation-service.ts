import tenants from './tenants'

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
  console.log(navigator.userAgent)
  const agents = navigator.userAgent.split(' ')
  const deviceType = agents[3]
  const iosVersion = Number.parseFloat(agents[5].replace("_", "."))
  if(iosVersion <= 12.4 && (deviceType === 'iPhone' || deviceType === 'iPad')){
    switch(tenants.tenant) {
      case "oneblink":
        const timeOB =  new Intl.DateTimeFormat('en-AU', {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          timeZone: 'Australia/Sydney',
        }).format(value)
        const timeArrayOB = timeOB.split(':')
        return `${timeArrayOB[0]}:${timeArrayOB[1]} ${timeArrayOB[2].slice(-2)}`
        case "civicplus":
          const timeCP =  new Intl.DateTimeFormat('en-US', {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZone: 'America/Texas?',
          }).format(value)
          const timeArrayCP = timeCP.split(':')
          return `${timeArrayCP[0]}:${timeArrayCP[1]} ${timeArrayCP[2].slice(-2)}`
    }
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
