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

| Property       | Type      | Description                                                          |
| -------------- | --------- | -------------------------------------------------------------------- |
| `submissionId` | `string`  | The unique identifier for the submission associated with the booking |
| `startTime`    | `Date`    | Date and time the booking starts                                     |
| `endTime`      | `Date`    | Date and time the booking ends                                       |
| `location`     | `string`  | Location of booking                                                  |
| `isReschedule` | `boolean` | `true` if the booking has been rescheduled, otherwise `false`        |

#### BookingCancelConfiguration

| Property        | Type     | Description                                                          |
| --------------- | -------- | -------------------------------------------------------------------- |
| `submissionId`  | `string` | The unique identifier for the submission associated with the booking |
| `nylasEditHash` | `string` | The nylas edit hash associated with the booking                      |
| `reason`        | `string` | Reason for cancelling the booking                                    |

#### BookingToCancel

| Property             | Type                    | Description                                                                   |
| -------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `submissionId`       | `string`                | The unique identifier for the submission associated with the booking          |
| `nylasEditHash`      | `string`                | The nylas edit hash associated with the booking                               |
| `startTime`          | `Date`                  | The start time of the booking                                                 |
| `endTime`            | `Date`                  | The end time of the booking                                                   |
| `location`           | `string`                | The location of the event                                                     |
| `eventName`          | `string`                | The name of the event the booking is for                                      |
| `timezone`           | `string`                | The timezone the booking was booked in                                        |
| `cancellationPolicy` | `string` \| `undefined` | The policy to display to users when asked why they are cancelling the booking |

### `handleSchedulingQuerystring()`

Pass in query string parameters after a redirect back to your app after a booking is processed. Will return a [Booking](#booking) and the submission result from the original submission before redirecting to `scheduling.bookingUrl`. If the booking has been rescheduled, the submission result will not be returned.

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
