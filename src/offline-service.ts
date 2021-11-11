declare global {
  interface Window {
    cordova: unknown
  }
}

export function isOffline(): boolean {
  if (!window.navigator) {
    return false
  }

  if (window.cordova) {
    return window.navigator.connection.type === 'none'
  } else {
    return !window.navigator.onLine
  }
}
