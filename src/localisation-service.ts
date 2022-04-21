import tenants from './tenants'

export class LocalisationService {
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

  get shortDateFormat() {
    switch (this.locale) {
      case 'en-US':
        return 'MM/DD/YYYY'
      case 'en-AU':
      default:
        return 'DD/MM/YYYY'
    }
  }
  get longDateFormat() {
    switch (this.locale) {
      case 'en-US':
        return 'MMM Do, YYYY'
      case 'en-AU':
      default:
        return 'Do MMM, YYYY'
    }
  }
  get longDateTimeFormat() {
    switch (this.locale) {
      case 'en-US':
        return 'MMM Do, YYYY h:mm a'
      case 'en-AU':
      default:
        return 'Do MMM, YYYY h:mm a'
    }
  }

  get flatpickrTimeFormat() {
    return 'h:i K'
  }

  get flatpickrDatetimeFormat() {
    return `${this.flatpickrDateFormat} ${this.flatpickrTimeFormat}`
  }

  formatDate(value: Date): string {
    return tenants.current.intlFormats.date.format(value)
  }

  formatDateLong(value: Date): string {
    return tenants.current.intlFormats.dateLong.format(value)
  }

  formatTime(value: Date): string {
    return tenants.current.intlFormats.time.format(value)
  }

  formatDatetime(value: Date) {
    return `${this.formatDate(value)} ${this.formatTime(value)}`
  }

  formatDatetimeLong(value: Date) {
    return `${this.formatDateLong(value)} ${this.formatTime(value)}`
  }

  formatNumber(value: number): string {
    return tenants.current.intlFormats.number.format(value)
  }

  formatCurrency(value: number): string {
    return tenants.current.intlFormats.currency.format(value)
  }
}

export default new LocalisationService()
