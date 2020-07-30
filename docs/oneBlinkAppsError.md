# OneBlink Apps | Usage

## OneBlinkAppsError

An error class that extends `Error`

```js
import { OneBlinkAppsError } from '@oneblink/apps'
```

### Constructor

used to create an instance of the `OneBlinkAppsError` class.

| Parameter                     | Required | Type      | Description                                    |
| ----------------------------- | -------- | --------- | ---------------------------------------------- |
| message                       | yes      | `string`  | The message associated with the error          |
| options                       | no       | `Object`  | The options associated with the error          |
| options.title                 | no       | `string`  | The title of the error                         |
| options.isOffline             | no       | `boolean` | Whether the application state is offline       |
| options.requiresAccessRequest | no       | `boolean` | Whether the attempted action required access   |
| options.requiresLogin         | no       | `boolean` | Whether the attempted action required login    |
| options.httpStatusCode        | no       | `number`  | The http status code associated with the error |
| options.originalError         | no       | `Error`   | The original error that was thrown             |

### Example

```js
throw new OneBlinkAppsError('Something went wrong!')

throw new OneBlinkAppsError('Something else went wrong!', {
  title: 'Access Denied',
  isOffline: false,
  requiresAccessRequest: true,
  requiresLogin: true,
  httpStatusCode: 401,
  originalError: new Error('My original error'),
})
```
