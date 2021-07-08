# OneBlink Apps | Usage

## Scheduling Service

Helper functions for scheduling booking handling

```js
import { schedulingService } from '@oneblink/apps'
```

- [`handleSchedulingQuerystring()`](#handleschedulingquerystring)

### Types

#### Booking

| Property    | Type     | Description                      |
| ----------- | -------- | -------------------------------- |
| `startTime` | `Date`   | Date and time the booking starts |
| `endTime`   | `Date`   | Date and time the booking ends   |
| `location`  | `string` | Location of booking              |

### `handleSchedulingQuerystring()`

Pass in query string parameters after a redirect back to your app after a booking is processed. Will return a [Booking](#booking) and the submission result from the original submission before redirecting to `scheduling.bookingUrl`.

```js
import queryString from 'query-string'

const query = queryString.parse(window.location.search)

const { booking, formSubmissionResult } =
  await schedulingService.handleSchedulingQuerystring(query)
```
