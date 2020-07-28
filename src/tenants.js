// @flow
'use strict'

const isTestEnvironment = window.ONEBLINK_APP_ENVIRONMENT === 'test'

const tenants /* : {
  test: {
    ONEBLINK: OneBlinkAppsTenant,
    CIVICPLUS: OneBlinkAppsTenant,
  },
  prod: {
    ONEBLINK: OneBlinkAppsTenant,
    CIVICPLUS: OneBlinkAppsTenant,
  },
} */ = {
  test: {
    ONEBLINK: {
      loginDomain: 'login-test.oneblink.io',
      apiOrigin: 'https://auth-api-test.blinkm.io',
    },
    CIVICPLUS: {
      loginDomain: 'login-test.transform.civicplus.com',
      apiOrigin: 'https://auth-api-test.transform.civicplus.com',
    },
  },
  prod: {
    ONEBLINK: {
      loginDomain: 'login.oneblink.io',
      apiOrigin: 'https://auth-api.blinkm.io',
    },
    CIVICPLUS: {
      loginDomain: 'login.transform.civicplus.com',
      apiOrigin: 'https://auth-api.transform.civicplus.com',
    },
  },
}

export default isTestEnvironment ? tenants.test : tenants.prod
