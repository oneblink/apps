import { isOffline } from '../dist/offline-service'

test('isOffline should return false', () => {
  return expect(isOffline()).toBe(false)
})
