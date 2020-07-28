# OneBlink Apps | Usage

## Payment Service

Helper functions for payment handling

```js
import { paymentService } from '@oneblink/apps'
```

- [`handlePaymentSubmissionEvent()`](#handlepaymentsubmissionevent)
- [`handlePaymentQuerystring()`](#handlepaymentquerystring)

### Types

#### Transaction

| Property         | Type            | Description                                            |
| ---------------- | --------------- | ------------------------------------------------------ |
| `isSuccess`      | `boolean`       | `true` if the transaction was successful               |
| `errorMessage`   | `string | null` | The error message to display if `isSuccess` is `false` |
| `id`             | `string | null` | The id the transaction                                 |
| `creditCardMask` | `string | null` | A mask of the credit card used e.g. _1234....7890_     |
| `amount`         | `number | null` | The total amount charged                               |

### `handlePaymentSubmissionEvent()`

Handle a submission result with a payment submission event. Will throw an error if a transaction has already been made using this submission result. Will return `undefined` if the submission does not have an amount. Will return the submission result passed in with a `payment` property if the submission requires processing.

```js
const submissionResult = {
  formsAppId: 1,
  submission: {
    form: 'data'
    goes: 'here',
    amount: 1.50,
  }
  definition: OneBlinkForm,
  payment: null,
}
const paymentSubmissionEvent = {
  type: 'CP_PAY',
  configuration: {
    elementId: '12663efc-4c6a-4e72-8505-559edfe3e92e',
    gatewayId: '6658c5c4-e0db-483b-8af7-6a6464fe772c',
  },
}
const paymentSubmissionResult = await paymentService.handlePaymentSubmissionEvent(prefillFormDataId)
if (paymentSubmissionResult) {
  window.location.href = paymentSubmissionResult.payment.hostedFormUrl
}
```

### `handlePaymentQuerystring()`

Pass in query string parameters after a redirect back to your app after a payment is processed. This function will handle all payment submission events supported by OneBlink. Will return a [Transaction](#transaction) and the submission result that was returned from [`handlePaymentSubmissionEvent()`](#handlepaymentsubmissionevent) before redirecting to `payment.hostedFormUrl`.

```js
import queryString from 'query-string'

const query = queryString.parse(window.location.search)
const formId = 1
const {
  transaction,
  submissionResult,
} = await paymentService.handlePaymentQuerystring(formId, prefillFormDataId)
```
