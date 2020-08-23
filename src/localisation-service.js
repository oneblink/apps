// @flow
'use strict'

import tenants from './tenants'

class LocalisationService {
  get locale() {
    return tenants.locale
  }

  get flatpickrDateFormat() {
    switch (this.locale) {
      case 'en-US':
        return 'm/d/Y'
      case 'en-AU':
      default:
        return 'd/m/Y'
    }
  }

  get flatpickrTimeFormat() {
    return 'h:i K'
  }

  get flatpickrDatetimeFormat() {
    return `${this.flatpickrDateFormat} ${this.flatpickrTimeFormat}`
  }

  formatDate(value /* : Date */) /* : string */ {
    return tenants.current.intlFormats.date.format(value)
  }

  formatTime(value /* : Date */) /* : string */ {
    return tenants.current.intlFormats.time.format(value)
  }

  formatDatetime(value /* : Date */) {
    return `${this.formatDate(value)} ${this.formatTime(value)}`
  }

  formatCurrency(value /* : number */) /* : string */ {
    return tenants.current.intlFormats.currency.format(value)
  }
}

export default new LocalisationService()
