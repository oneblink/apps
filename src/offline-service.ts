declare global {
  interface Window {
    cordova: unknown
  }
}

/**
 * Check if the user is currently offline
 *
 * #### Example
 *
 * ```js
 * const isOffline = offlineService.isOffline()
 * // handle user being offline
 * ```
 *
 * @returns
 */
export function isOffline(): boolean {
  if (!window.navigator) {
    return false
  }

  // [Capacitor](capacitorjs.com) is mostly compatible with Cordova so it returns
  // `true` for `window.cordova`, but `window.navigator.connection` is `undefined`.
  if (window.cordova && window.navigator.hasOwnProperty('connection')) {
    return window.navigator.connection.type === 'none'
  } else {
    return !window.navigator.onLine
  }
}
