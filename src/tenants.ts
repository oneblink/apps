interface OneBlinkAppsTenant {
  awsRegion: string
  loginDomain: string
  apiOrigin: string
  vapidPublicKey: string
  intlFormats: {
    currency: Intl.NumberFormat
    date: Intl.DateTimeFormat
    dateLong: Intl.DateTimeFormat
    time: Intl.DateTimeFormat
  }
}
type Locale = 'en-AU' | 'en-US'

const getCurrency = (locale: Locale) => {
  switch (locale) {
    case 'en-US':
      return 'USD'
    case 'en-AU':
    default:
      return 'AUD'
  }
}

const generateFormatters = (locale: Locale) => {
  return {
    currency: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: getCurrency(locale),
    }),
    date: new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    dateLong: new Intl.DateTimeFormat(locale, {
      // These properties are missing in the type for some reason..
      // @ts-expect-error
      dateStyle: 'full',
    }),
    time: new Intl.DateTimeFormat(locale, {
      // @ts-expect-error
      timeStyle: 'short',
    }),
  }
}

const tenants = {
  test: {
    oneblink: {
      awsRegion: 'ap-southeast-2',
      loginDomain: 'login-test.oneblink.io',
      apiOrigin: 'https://auth-api-test.blinkm.io',
      vapidPublicKey:
        'BE5wtYdaQW3z7DWc08rzNlOwPuituVWFRLW_lUMD78ZJatFOjio8fYDHaIpQCRyeKsJ5j4kLaFU374J4dM90iUc',
      intlFormats: generateFormatters('en-AU'),
    },
    civicplus: {
      awsRegion: 'us-east-2',
      loginDomain: 'login-test.transform.civicplus.com',
      apiOrigin: 'https://auth-api-test.transform.civicplus.com',
      vapidPublicKey:
        'BLg2Dn9sYj1a0I3AcS22Fg71uubdMLwoemG8zfnPOljgFKB-5MR3FIxc2Mtt0AzM3zk2QWl3YzEy6EEwIUmz19k',
      intlFormats: generateFormatters('en-US'),
    },
  },
  prod: {
    oneblink: {
      awsRegion: 'ap-southeast-2',
      loginDomain: 'login.oneblink.io',
      apiOrigin: 'https://auth-api.blinkm.io',
      vapidPublicKey:
        'BADH0JnMngI0uFKUnbC79VGXy5d6WutccnEvVuFBMx--BrZtFAHGTgOBiABJXmE8_VHC92_jK5K-2qdP2kZeius',
      intlFormats: generateFormatters('en-AU'),
    },
    civicplus: {
      awsRegion: 'us-east-2',
      loginDomain: 'login.transform.civicplus.com',
      apiOrigin: 'https://auth-api.transform.civicplus.com',
      vapidPublicKey:
        'BLoDtCutrC7tEd75x89zBaIyz3Fk8AeWOcABasV3YO4Tei5UO8WjJVPFyilNLYxeseaiKlgoa0DOh1HoR59M_G4',
      intlFormats: generateFormatters('en-US'),
    },
  },
}

class Tenants {
  tenant: 'oneblink' | 'civicplus'

  constructor() {
    this.tenant = 'oneblink'
  }

  get isTestEnvironment() {
    // @ts-expect-error
    return window.ONEBLINK_APPS_ENVIRONMENT === 'test'
  }

  get current(): OneBlinkAppsTenant {
    switch (this.tenant) {
      case 'civicplus':
        return this.isTestEnvironment
          ? tenants.test.civicplus
          : tenants.prod.civicplus
      case 'oneblink':
      default:
        return this.isTestEnvironment
          ? tenants.test.oneblink
          : tenants.prod.oneblink
    }
  }

  get locale() /* : string */ {
    switch (this.tenant) {
      case 'civicplus':
        return 'en-US'
      case 'oneblink':
      default:
        return 'en-AU'
    }
  }

  useOneBlink() {
    this.tenant = 'oneblink'
  }

  useCivicPlus() {
    this.tenant = 'civicplus'
  }
}

export default new Tenants()
