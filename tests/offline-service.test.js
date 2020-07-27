// @flow
'use strict'

import { isOffline } from '../src/offline-service'

test('isOffline should return false', () => {
  return expect(isOffline()).toBe(false)
})
