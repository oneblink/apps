// @flow
'use strict'

import tenants from './tenants'

class VocabularyService {
  get locale() {
    return tenants.locale
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

export default new VocabularyService()
