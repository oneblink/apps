# OneBlink Apps | Usage

## Submission Service

Helper functions for handling form submissions

```js
import { submissionService } from '@oneblink/apps'
```

- [`submit()`](#submit)
- [`executePostSubmissionAction()`](#executepostsubmissionaction)
- [`cancelForm()`](#cancelForm)
- [`getPendingQueueSubmissions()`](#getpendingqueuesubmissions)
- [`deletePendingQueueSubmission()`](#deletependingqueuesubmission)
- [`registerPendingQueueListener()`](#registerpendingqueuelistener)
- [`processPendingQueue()`](#processpendingqueue)

### Types

#### FormSubmission

| Property                           | Type           | Description                                                                                                                                                                                     |
| ---------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submission`                       | `object`       | submission data                                                                                                                                                                                 |
| `definition`                       | `OneBlinkForm` | The OneBlink Form                                                                                                                                                                               |
| `formsAppId`                       | `number`       | The id of the Forms App submitting for                                                                                                                                                          |
| `captchaTokens`                    | `string[]`     | Captcha tokens gathered by a `captcha` Form Element                                                                                                                                             |
| `draftId`                          | `string`       | The id of the draft to clean up after successful submission                                                                                                                                     |
| `preFillFormDataId`                | `string`       | The id of the prefill data to clean up after successful submission                                                                                                                              |
| `jobId`                            | `string`       | The id of the job to submit                                                                                                                                                                     |
| `externalId`                       | `string`       | The id of the Forms App submitting for                                                                                                                                                          |
| `previousFormSubmissionApprovalId` | `number`       | The id of the previous form submission approval id. (Only used when the form submission is in response to `CLARIFICATION_REQUIRED` approval. see [`Approvals Service`](./approvals-service.md)) |

#### FormSubmissionResult

Inherits properties from [`FormSubmission`](#formsubmission)

| Property                         | Type               | Description                                                                                                                                 |
| -------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `submissionId`                   | `string` \| `null` | `null` if the form submission was unsuccessful                                                                                              |
| `submissionTimestamp`            | `string` \| `null` | `null` if the form submission was unsuccessful                                                                                              |
| `payment`                        | `object` \| `null` | `null` if the form submission does not require a payment                                                                                    |
| `payment.hostedFormUrl`          | `string`           | The URL to redirect the user to to complete the payment process                                                                             |
| `payment.paymentSubmissionEvent` | `object`           | The payment submission event                                                                                                                |
| `keyId`                          | `string` \| `null` | The id of the Forms Developer Key used to create the token passed to [`authService.setFormsKeyToken()`](./auth-service.md#setformskeytoken) |
| `isInPendingQueue`               | `boolean`          | `true` if the submission was not submitted yet and was added to the pending queue                                                           |
| `isOffline`                      | `boolean`          | `true` if the submission was attempted offline                                                                                              |

### PendingFormSubmission

Inherits properties from [`FormSubmission`](#formsubmission)

| Property           | Type               | Description                                                                                        |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------------------- |
| `pendingTimestamp` | `string`           | The date and time (in ISO format) the submission was attempted                                     |
| `isSubmitting`     | `boolean`          | `true` if the submission is currently being processed by the pending queue                         |
| `error`            | `string` \| `null` | An error message that might be set while attempting to process the submission in the pending queue |

### `submit()`

Submit a [FormSubmission](#formsubmission). Offline submissions will be added to a pending queue and be processed using the [processPendingQueue()](#processpendingqueue) function. [FormSubmission](#formsubmission)s with payment submission events will return the [FormSubmissionResult](#formsubmissionresult) with a `payment` property set, this should be used to redirect the user to the payment URL. Will also handle cleaning up locally stored drafts and prefill data.

```js
const formSubmission = {
  formsAppId: 1,
  submission: {
    form: 'data',
    goes: 'here',
  },
  definition: OneBlinkForm,
  captchaTokens: [],
  draftId: '2974602c-2c5b-4b46-b086-87ee9b2aa233',
  jobId: 'bb37d1da-9cda-4950-a36a-22f58b25de3a',
  preFillFormDataId: '7763f828-4aaf-49dc-9c1b-e2eeea8fa990',
  externalId: 'external-id-set-by-developer',
}

// Pass paymentReceiptUrl if submission may require a payment
const paymentReceiptUrl = `${window.location.origin}/payment-receipt`

const submissionResult = await submissionService.submit({
  formSubmission,
  paymentReceiptUrl,
})

if (submissionResult.payment) {
  // Redirect user to payment form
  window.location.href = paymentSubmissionResult.payment.hostedFormUrl
  return
}

if (submissionResult.isOffline) {
  if (submissionResult.isInPendingQueue) {
    // Display message to user that the submission
    // has been added to the pending queue
  } else {
    // Display message to user that this submission can
    // not be processed while offline (most likely because it requires a payment)
  }
  return
}

// submissionResult.submissionId and submissionResult.submissionTimestamp
// will be set if the submission was successful
```

### `executePostSubmissionAction()`

Execute the post submission action for a form after a successful form submission.

```js
const formSubmissionResult = {
  submissionId: '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
  submissionTimestamp: '2020-07-29T01:03:26.573Z'
  formsAppId: 1,
  submission: {
    form: 'data',,
    goes: 'here'
  },
  definition: OneBlinkForm,
  payment: {
    hostedFormUrl: 'https://payment.com/transaction'
  },
  draftId: '2974602c-2c5b-4b46-b086-87ee9b2aa233',
  jobId: 'bb37d1da-9cda-4950-a36a-22f58b25de3a',
  preFillFormDataId: '7763f828-4aaf-49dc-9c1b-e2eeea8fa990',
  externalId: 'external-id-set-by-developer',
}
// Only used for relative URLs
const pushRelativePath = (path) => {
  window.location.href = path
}
await submissionService.executePostSubmissionAction(formSubmissionResult, pushRelativePath)
```

### `cancelForm()`

Action to cancel completing a form, currently goes back in the browser history or attempts to close the browser tab if there is no history.

```js
try {
  await submissionService.cancelForm()
} catch (error) {
  // Handle error while closing browser tab.
  // Display message to user to close it manually
}
```

### `getPendingQueueSubmissions()`

Get an array of [PendingFormSubmission](#pendingformsubmission)s.

```js
const pendingSubmission = await submissionService.getPendingQueueSubmissions()
// Display pending submissions to user...
```

### `deletePendingQueueSubmission()`

Delete a [PendingFormSubmission](#pendingformsubmission) before it is processed based on the `pendingTimestamp` property.

```js
const pendingTimestamp = '2020-07-29T01:03:26.573Z'
await submissionService.deletePendingQueueSubmission(pendingTimestamp)
```

### `registerPendingQueueListener()`

Register a lister function that will be passed an array of [PendingFormSubmission](#pendingformsubmission)s when the pending queue is modified.

```js
const listener = async (pendingSubmissions) => {
  // use pending submissions here...
}
const deregister = await submissionService.registerPendingQueueListener(
  listener,
)

// When no longer needed, remember to deregister the listener
deregister()
```

### `processPendingQueue()`

Force processing the pending queue. This must be called to process the pending queue and is best used when the application comes back online.

```js
await submissionService.processPendingQueue()
```
