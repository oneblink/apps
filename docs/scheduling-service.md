# OneBlink Apps | Usage

## Scheduling Service

Helper functions for scheduling booking handling

```js
import { schedulingService } from '@oneblink/apps'
```

- [`handleSchedulingQuerystring()`](#handleschedulingquerystring)
- [`cancelSchedulingBooking()`](#cancelschedulingbooking)
- [`handleCancelSchedulingBookingQuerystring`](#handlecancelschedulingbookingquerystring)

### Types

#### Booking

| Property    | Type     | Description                      |
| ----------- | -------- | -------------------------------- |
| `startTime` | `Date`   | Date and time the booking starts |
| `endTime`   | `Date`   | Date and time the booking ends   |
| `location`  | `string` | Location of booking              |

#### BookingCancelConfiguration

| Property        | Type     | Description                                     |
| --------------- | -------- | ----------------------------------------------- |
| `submissionId`  | `string` | The submissionId associated with the booking    |
| `nylasEditHash` | `string` | The nylas edit hash associated with the booking |
| `reason`        | `string` | Reason for cancelling the booking               |

#### BookingToCancel

| Property        | Type     | Description                                     |
| --------------- | -------- | ----------------------------------------------- |
| `nylasEditHash` | `string` | The nylas edit hash associated with the booking |
| `submissionId`  | `string` | The submissionId associated with the booking    |
| `startTime`     | `Date`   | The start time of the booking                   |
| `endTime`       | `Date`   | The end time of the booking                     |
| `eventName`     | `string` | The name of the event the booking is for        |
| `location`      | `string` | The location of the event                       |
| `timezone`      | `string` | The timezone the booking was booked in          |

### `handleSchedulingQuerystring()`

Pass in query string parameters after a redirect back to your app after a booking is processed. Will return a [Booking](#booking) and the submission result from the original submission before redirecting to `scheduling.bookingUrl`.

```js
import queryString from 'query-string'

const query = queryString.parse(window.location.search)

const { booking, formSubmissionResult } =
  await schedulingService.handleSchedulingQuerystring(query)
```

### `cancelSchedulingBooking()`

Pass in a [BookingCancelConfiguration](#Bookingcancelconfiguration). Will return `void`.

```js
await schedulingService.cancelSchedulingBooking({
  submissionId: '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
  nylasEditHash: '123abc321abcCBA456abcabc123456',
  reason: 'Busy at time of booking.',
})
// Booking Cancelled
```

### `handleCancelSchedulingBookingQuerystring()`

Pass in query string parameters after navigation to your app via a valid cancellation link. Will return a [BookingToCancel](#Bookingtocancel).

```js
import queryString from 'query-string'

const query = queryString.parse(window.location.search)

const bookingToCancel =
  await schedulingService.handleCancelSchedulingBookingQuerystring(query)
```
