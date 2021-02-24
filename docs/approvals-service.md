# OneBlink Apps | Usage

## Form Service

Helper functions for handling form submission approvals

```js
import { approvalsService } from '@oneblink/apps'
```

- [`FormSubmissionApproval`](#formsubmissionapproval)
- [`getFormSubmissionApprovals()`](#getformsubmissionapprovals)
- [`getFormSubmissionApproval()`](#getformsubmissionapproval)
- [`updateFormSubmissionApproval()`](#updateformsubmissionapproval)

### FormSubmissionApproval

| Property                           | Type                  | Description                                                                |
| ---------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| `id`                               | `number`              | The unique identifier for the record                                       |
| `status`                           | `string`              | `'PENDING' \| 'APPROVED' \| 'CLARIFICATION_REQUIRED' \| 'CLOSED'`          |
| `submissionId`                     | `string`              | The unique identifier for the submission being approved                    |
| `formId`                           | `number`              | The unique identifier for the form that was submitted for approval         |
| `username`                         | `string`              | The username of the approver assigned the approval                         |
| `previousFormSubmissionApprovalId` | `number \| undefined` | The unique identifier for the previous approval that lead to this approval |
| `notificationEmailAddress`         | `string \| undefined` | The email address of the user to be notified of the response               |
| `notes`                            | `string \| undefined` | The approvers notes attached the the response                              |
| `createdAt`                        | `string`              | The date and time (in ISO format) the approval was created                 |
| `updatedAt`                        | `string`              | The date and time (in ISO format) the approval was last updated            |

### `getFormSubmissionApprovals()`

Get an Object containing [`FormSubmissionApproval`](#formsubmissionapproval)s assigned to the current user and the Form definitions in those approvals.

```js
const formsAppId = 1
const formSubmissionApprovals = await approvalsService.getFormSubmissionApprovals(
  formAppId,
)

// formSubmissionApprovals ===
// {
//   forms: FormTypes.Form[]
//   formSubmissionApprovals: SubmissionTypes.FormSubmissionApproval[]
// }
```

### `getFormSubmissionApproval()`

Get a single [`FormSubmissionApproval`](#formsubmissionapproval) belonging to the given id.

```js
const formSubmissionApprovalId = 1
const formSubmissionApproval = await approvalsService.getFormSubmissionApproval(
  formSubmissionApprovalId,
)
```

### `updateFormSubmissionApproval()`

Update a single [`FormSubmissionApproval`](#formsubmissionapproval) assigned to the current user.

```js
const formSubmissionApproval = {
  id: 1,
  status: 'APPROVED',
  submissionId: 'cd902a00-3641-4c65-806c-3d91904fb7bc',
  formId: 2,
  formsAppUserId: 3,
  previousFormSubmissionApprovalId: undefined,
  notificationEmailAddress: 'email@example.com',
  notes: 'Great work!!!',
  createdAt: '2021-02-21T22:57:56.257Z',
  updatedAt: '2021-02-21T22:57:56.257Z',
}
const updatedFormSubmissionApproval = await approvalsService.updateFormSubmissionApproval(
  formSubmissionApproval,
)
```
