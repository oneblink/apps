// @flow
'use strict'

export default class OneBlinkFormsAppError extends Error {
  /* :: title: string */
  /* :: isOffline: boolean */
  /* :: requiresAccessRequest: boolean */
  /* :: requiresLogin: boolean */
  /* :: httpStatusCode: number | void */
  /* :: originalError: Error | void */

  constructor(
    message /* : string */,
    options /* :  {
      title?: string,
      isOffline?: boolean,
      requiresAccessRequest?: boolean,
      requiresLogin?: boolean,
      httpStatusCode?: number,
      originalError?: Error,
    } */ = {}
  ) {
    super(message)

    let title = options.title
    if (!title) {
      if (options.requiresAccessRequest) {
        title = 'Access Denied'
      } else if (options.requiresLogin) {
        title = 'Login Required'
      } else if (options.isOffline) {
        title = 'Offline'
      } else {
        title = 'Whoops'
      }
    }

    this.title = title
    this.isOffline = options.isOffline || false
    this.requiresAccessRequest = options.requiresAccessRequest || false
    this.requiresLogin = options.requiresLogin || false
    this.originalError = options.originalError
  }
}
