# OneBlink Apps | Usage

## Authentication/Authorisation Service

Helper functions for handling user authentication and authorisation.

**NOTE: `init()` must be called before using some of the functions in this service.**

```js
import { authService } from '@oneblink/apps'
```

- [`init()`](#init)
- [`registerAuthListener()`](#registerauthlistener)
- [`isLoggedIn()`](#isloggedin)
- [`loginHostedUI()`](#loginhostedui) - requires `init()` to be called first
- [`handleAuthentication()`](#handleauthentication) - requires `init()` to be called first
- [`loginUsernamePassword()`](#loginusernamepassword) - requires `init()` to be called first
- [`changePassword()`](#changepassword) - requires `init()` to be called first
- [`forgotPassword()`](#forgotPassword) - requires `init()` to be called first
- [`getIdToken()`](#getidtoken)
- [`getUserProfile()`](#getuserprofile)
- [`getUserFriendlyName()`](#getuserfriendlyname)
- [`isAuthorised()`](#isauthorised)
- [`requestAccess()`](#requestaccess)
- [`logout()`](#logout)
- [`setFormsKeyToken()`](#setformskeytoken)
- [`getFormsKeyId()`](#getformskeyid)
- [`setUserToken()`](#setusertoken)
- [`getUserToken()`](#getusertoken)

### `init()`

Initialize the service with required configuration. **This must be done before using before some of the function in this service.**

```js
authService.init({
  oAuthClientId: 'YOUR_OAUTH_CLIENT_ID',
})
```

### `registerAuthListener()`

Register a lister function that will be call when authentication tokens are updated or removed.

```js
const listener = async () => {
  // Check if the user is logged in still
  const isLoggedIn = authService.isLoggedIn()
}
const deregister = await authService.registerAuthListener(listener)

// When no longer needed, remember to deregister the listener
deregister()
```

### `isLoggedIn()`

Check if the user is currently logged in

```js
const isLoggedIn = authService.isLoggedIn()
// handle user being logged in or not
```

### `loginHostedUI()`

Redirect the user to the login screen. Passing an `identityProvider` is optionally, it will allow users to skip the login page and be directed straight to that providers login page

```js
// OPtionally pass a
const identityProvider = 'Google'
await authService.loginHostedUI(identityProvider)
// User will be redirected to login page or promise will resolve
```

### `handleAuthentication()`

This function should be called when the user is redirected back to your app after a login attempt. It will use the query string add the redirect URL to create a session for the current user. It will return a URL as a `string` that should be redirected to within your app.

```js
try {
  const continueTo = await authService.handleAuthentication()
  // Redirect the user back to where they were before attempting to login
  window.location.href = continueTo
} catch (error) {
  // handle failed login attempts here.
}
```

### `loginUsernamePassword()`

Create a session for a user by entering a username and password. If the user requires a password reset, a function will be returned. This function should be called with the new password once entered by the user.

```js
const username = 'user@email.io'
const password = 'P@$5w0rd'
const resetPassword = await authService.loginUsernamePassword(
  username,
  password,
)
// "resetPassword" will be undefined if the login was successful
if (resetPassword) {
  // Prompt the user to enter a new password
  const newPassword = prompt(
    'The password you entered was only temporary, and must be reset for security purposes. Please enter your new password below to continue.',
  )
  await resetPassword(newPassword)
}
```

### `changePassword()`

Allow the currently logged in user to change their password by passing their existing password and a new password.

```js
const currentPassword = 'P@$5w0rd'
const newPassword = 'P@$5w0rD'
await authService.changePassword(currentPassword, newPassword)
```

### `forgotPassword()`

Allow a user to start the forgot password process. The user will be emailed a temporary code that must be passed with a new password to the function returned.

```js
const username = 'user@email.io'
const finishForgotPassword = await authService.forgotPassword(username)

// Prompt the user to enter the code and a new password
const code = prompt(
  'You have been emailed a verification code, please enter it here.',
)
const newPassword = prompt('Please enter a new password to continue.')
await finishForgotPassword(code, newPassword)
```

### `getIdToken()`

Get the Id Token used to make requests to the OneBlink API. This will return `undefined` if the current user is not logged in.

```js
const idToken = await authService.getIdToken()
if (idToken) {
  await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })
} else {
  // Handle user not being logged in
}
```

### `getUserProfile()`

Get current users profile based on there Id Token payload. This will return `null` if the the current user is not logged in.

```js
const profile = authService.getUserProfile()
if (profile) {
  // Use profile here
}
```

#### Profile

| Property                    | Type                                          | Description                                                 |
| --------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `isSAMLUser`                | `boolean`                                     | `true` if the user logged in using a SAML provider          |
| `providerType`              | `"Cognito"` &#124; `"SAML"` &#124; `"Google"` | Which provider was used to login                            |
| `providerUserId`            | `string`                                      | The id of the user from the login provider                  |
| `userId`                    | `string`                                      | The id of the user from OneBlink                            |
| `username`                  | `string`                                      | The username used to login                                  |
| `email`                     | `string` &#124; `undefined`                   | The user's email address                                    |
| `firstName`                 | `string` &#124; `undefined`                   | The user's first name                                       |
| `lastName`                  | `string` &#124; `undefined`                   | The user's last name                                        |
| `fullName`                  | `string` &#124; `undefined`                   | The user's full name                                        |
| `picture`                   | `string` &#124; `undefined`                   | A URL to a picture of the user                              |
| `role`                      | `string` &#124; `undefined`                   | The user's role from a SAML configuration                   |
| `supervisor`                | `object` &#124; `undefined`                   | The user's supervisor information from a SAML configuration |
| `supervisor.fullName`       | `string` &#124; `undefined`                   | The user's supervisor's full name                           |
| `supervisor.email`          | `string` &#124; `undefined`                   | The user's supervisor's full email address                  |
| `supervisor.providerUserId` | `string` &#124; `undefined`                   | The user's supervisor's user id from the login provider     |

### `getUserFriendlyName()`

A friendly `string` that represents the current user. Uses first name, last name, full name and username. This will return `null` the current user is not logged in.

```js
const name = authService.getUserFriendlyName()
if (name) {
  // Display current user's name
}
```

### `isAuthorised()`

Determine if the current user is a OneBlink App User for a OneBlink Forms App. Returns `false` if the current user is not logged in.

```js
const formsAppId = 1
const isAuthorised = await authService.isAuthorised(formsAppId)
if (!isAuthorised) {
  // handle unauthorised user
}
```

### `requestAccess()`

If the current user is not a Forms App User, this function will send a request on behalf of the current user to the OneBlink Forms App administrators to request access.

```js
const formsAppId = 1
await authService.requestAccess(formsAppId)
// Display a message to user indicating a request has been sent to the application administrators
```

### `logout()`

Log the current user out and remove an data stored locally by the user e.g. drafts.

```js
await authService.logout()
```

### `setFormsKeyToken()`

Set the Forms Key token being used to make requests to the OneBlink API on behalf of the user.

```js
authService.setFormsKeyToken('a valid json web token')
```

### `getFormsKeyId()`

Can be used to extract the `keyId` from the Forms Key token passed to [setFormsKeyToken()](#setformskeytoken). Will be `undefined` if the token has not been set yet.

```js
const keyId = authService.getFormsKeyId()
if (keyId) {
  // Use keyId here...
}
```

### `setUserToken()`

Set the User token being included in requests to the OneBlink API on behalf of the user.

```js
authService.setUserToken('a value')
```

### `getUserToken()`

Can be used to retrieve the `userToken` passed to [setUserToken()](#setusertoken). Will be `undefined` if the token has not been set yet.

```js
const userToken = authService.getUserToken()
if (userToken) {
  // Use token here...
}
```
