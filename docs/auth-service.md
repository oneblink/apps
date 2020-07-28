# OneBlink Apps | Usage

## Authentication/Authorisation Service

Helper functions for handling user authentication and authorisation.

**NOTE: `init()` must be called before some of the function in this service.**

```js
import { authService } from '@oneblink/apps'
```

- [`init()`](#init)
- [`isLoggedIn()`](#isloggedin)
- [`login()`](#login) - requires `init()` to be called first
- [`handleAuthentication()`](#handleauthentication) - requires `init()` to be called first
- [`getIdToken()`](#getidtoken)
- [`getUserProfile()`](#getuserprofile)
- [`getUserFriendlyName()`](#getuserfriendlyname)
- [`isAuthorised()`](#isauthorised)
- [`requestAccess()`](#requestaccess)
- [`logout()`](#logout)
- [`getIssuerFromJWT()`](#getIssuerFromJWT)

### `init()`

Initialize the service with required configuration. **This must be done before using before some of the function in this service.**

```js
authService.init({
  oAuthClientId: 'YOUR_OAUTH_CLIENT_ID',
  useSAML: false,
})
```

### `isLoggedIn()`

Check if the user is currently logged in

```js
const isLoggedIn = authService.isLoggedIn()
// handle user being logged in or not
```

### `login()`

Redirect the user to the login screen. If the use is already logged in, a new session will be created and a promise will resolve.

```js
await authService.login()
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

| Property                    | Type                            | Description                                                 |
| --------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `isSAMLUser`                | `boolean`                       | `true` if the user logged in using a SAML provider          |
| `providerType`              | `'Cognito' | 'SAML' | 'Google'` | Which provider was used to login                            |
| `providerUserId`            | `string`                        | The id of the user from the login provider                  |
| `userId`                    | `string`                        | The id of the user from OneBlink                            |
| `username`                  | `string`                        | The username used to login                                  |
| `email`                     | `string | undefined`            | The user's email address                                    |
| `firstName`                 | `string | undefined`            | The user's first name                                       |
| `lastName`                  | `string | undefined`            | The user's last name                                        |
| `fullName`                  | `string | undefined`            | The user's full name                                        |
| `picture`                   | `string | undefined`            | A URL to a picture of the user                              |
| `role`                      | `string | undefined`            | The user's role from a SAML configuration                   |
| `supervisor`                | `object | undefined`            | The user's supervisor information from a SAML configuration |
| `supervisor.fullName`       | `string | undefined`            | The user's supervisor's full name                           |
| `supervisor.email`          | `string | undefined`            | The user's supervisor's full email address                  |
| `supervisor.providerUserId` | `string | undefined`            | The user's supervisor's user id from the login provider     |

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

### `getIssuerFromJWT()`

Helper function that can be used to pull out the `iss` property from a json web token. This can be used to extract the `keyId` from a OneBlink Developer Key.

```js
const keyId = authService.getIssuerFromJWT('a valid json web token')
```
