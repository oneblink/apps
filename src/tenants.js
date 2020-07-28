// @flow
'use strict'

/* ::
type OneBlinkAppsTenant = {|
  loginDomain: string,
  apiOrigin: string,
|}
*/

const tenants = {
  test: {
    oneblink: {
      loginDomain: 'login-test.oneblink.io',
      apiOrigin: 'https://auth-api-test.blinkm.io',
    },
    civicplus: {
      loginDomain: 'login-test.transform.civicplus.com',
      apiOrigin: 'https://auth-api-test.transform.civicplus.com',
    },
  },
  prod: {
    oneblink: {
      loginDomain: 'login.oneblink.io',
      apiOrigin: 'https://auth-api.blinkm.io',
    },
    civicplus: {
      loginDomain: 'login.transform.civicplus.com',
      apiOrigin: 'https://auth-api.transform.civicplus.com',
    },
  },
}

class Tenants {
  /* ::
  tenant: 'oneblink' | 'civicplus'
  */
  constructor() {
    this.tenant = 'oneblink'
  }

  get isTestEnvironment() {
    return window.ONEBLINK_APPS_ENVIRONMENT === 'test'
  }

  get current() /* : OneBlinkAppsTenant */ {
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

  useOneBlink() {
    this.tenant = 'oneblink'
  }

  useCivicPlus() {
    this.tenant = 'civicplus'
  }
}

export default new Tenants()
