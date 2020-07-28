// @flow
'use strict'

const tenants /* : {
  test: {
    oneblink: OneBlinkAppsTenant,
    civicplus: OneBlinkAppsTenant,
  },
  prod: {
    oneblink: OneBlinkAppsTenant,
    civicplus: OneBlinkAppsTenant,
  },
} */ = {
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
  get isTestEnvironment() {
    return window.ONEBLINK_APPS_ENVIRONMENT === 'test'
  }

  get ONEBLINK() {
    return this.isTestEnvironment
      ? tenants.test.oneblink
      : tenants.prod.oneblink
  }

  get CIVICPLUS() {
    return this.isTestEnvironment
      ? tenants.test.civicplus
      : tenants.prod.civicplus
  }
}

export default new Tenants()
