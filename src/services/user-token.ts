import { MiscTypes } from '@oneblink/types'
let userToken: string | MiscTypes.NoU = null

/**
 * Set the User token being included in requests to the OneBlink API on behalf
 * of the user.
 *
 * #### Example
 *
 * ```js
 * authService.setUserToken('a value')
 * ```
 */
export function setUserToken(token: string | MiscTypes.NoU): void {
  userToken = token || null
}

/**
 * Can be used to retrieve the `userToken` passed to `setUserToken()`. Will be
 * `undefined` if the token has not been set yet.
 *
 * #### Example
 *
 * ```js
 * const userToken = authService.getUserToken()
 * if (userToken) {
 *   // Use token here...
 * }
 * ```
 *
 * @returns
 */
export function getUserToken() {
  return userToken
}
