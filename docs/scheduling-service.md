# OneBlink Apps | Usage

## Scheduling Service

Helper functions for scheduling booking handling

```js
import { schedulingService } from '@oneblink/apps'
```

- [`handleSchedulingSubmissionEvent()`](#handleschedulingsubmissionevent)
- [`handleSchedulingQuerystring()`](#handleschedulingquerystring)

### Types

#### Booking

| Property    | Type     | Description                      |
| ----------- | -------- | -------------------------------- |
| `startTime` | `Date`   | Date and time the booking starts |
| `endTime`   | `Date`   | Date and time the booking ends   |
| `location`  | `string` | Location of booking              |

### `handleSchedulingSubmissionEvent()`

Handle a submission result with a scheduling submission event. Will return a copy of the submission result passed in with the `scheduling` property set.

```js
const schedulingSubmissionResult =
  await schedulingService.handleSchedulingSubmissionEvent({
    formSubmissionResult: {
      submissionId: '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
      submissionTimestamp: '2020-07-29T01:03:26.573Z',
      formsAppId: 1,
      submission: {
        name: 'John Smith',
        email: 'email@example.com',
      },
      definition: OneBlinkForm,
      scheduling: null,
    },
    schedulingSubmissionEvent: {
      type: 'SCHEDULING',
      configuration: {
        nylasAccountId: 'abc',
        nylasSchedulingPageId: 1,
        nameElementId: '12663efc-4c6a-4e72-8505-559edfe3e92e',
        emailElementId: '6658c5c4-e0db-483b-8af7-6a6464fe772c',
      },
    },
    schedulingReceiptUrl: `${window.location.origin}/scheduling-receipt`,
  })

window.location.href = schedulingSubmissionResult.scheduling.bookingUrl
```

### `handleSchedulingQuerystring()`

Pass in query string parameters after a redirect back to your app after a booking is processed. Will return a [Booking](#booking) and the `FormSubmissionResult` that was returned from [`handleSchedulingSubmissionEvent()`](#handleschedulingsubmissionevent) before redirecting to `scheduling.bookingUrl`.

```js
import queryString from 'query-string'

const query = queryString.parse(window.location.search)

const { booking, formSubmissionResult } =
  await schedulingService.handleSchedulingQuerystring(query)
```
