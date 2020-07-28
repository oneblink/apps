# OneBlink Apps | Usage

## OneBlinkAppsError

An error class that extends `Error`

```js
import { OneBlinkAppsError } from '@oneblink/apps'
```

## Constructor

used to create an instance of the `OneBlinkAppsError` class.

| Parameter | Required | Type     | Description                           |
| --------- | -------- | -------- | ------------------------------------- |
| message   | yes      | `string` | The message associated with the error |
| options   | no       | `Object` | The options associated with the error |

### Example

```js
throw new OneBlinkAppsError('Something went wrong!', options)
```

## OneBlinkFormsAppErrorOptions

An Options object that can be passed to the `OneBlinkAppsError` class.

| Property              | Required | Type      | Description                                    |
| --------------------- | -------- | --------- | ---------------------------------------------- |
| title                 | no       | `string`  | The title of the error                         |
| isOffline             | no       | `boolean` | Whether the application state is offline       |
| requiresAccessRequest | no       | `boolean` | Whether the attempted action required access   |
| requiresLogin         | no       | `boolean` | Whether the attempted action required login    |
| httpStatusCode        | no       | `number`  | The http status code associated with the error |
| originalError         | no       | `Error`   | The original error that was thrown             |

### Example

```js
const options = {
  title: 'Access Denied',
  isOffline: false,
  requiresAccessRequest: true,
  requiresLogin: true,
  httpStatusCode: 401,
  originalError: new Error('My original error'),
}
```
