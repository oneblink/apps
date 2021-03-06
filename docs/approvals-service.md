# OneBlink Apps | Usage

## Approvals Service

Helper functions for handling form submission approvals

```js
import { approvalsService } from '@oneblink/apps'
```

- [`FormApprovalFlowStep`](#formapprovalflowstep)
- [`FormApprovalFlowInstance`](#formapprovalflowinstance)
- [`FormSubmissionApproval`](#formsubmissionapproval)
- [`getFormSubmissionApprovals()`](#getformsubmissionapprovals)
- [`getFormSubmissionApproval()`](#getformsubmissionapproval)
- [`updateFormSubmissionApproval()`](#updateformsubmissionapproval)
- [`retrieveFormSubmissionApprovalSubmission()`](#retrieveformsubmissionapprovalsubmission)

### FormApprovalFlowStep

| Property   | Type     | Description                                                              |
| ---------- | -------- | ------------------------------------------------------------------------ |
| `type`     | `string` | `'SINGLE'`                                                               |
| `label`    | `string` | The unique label for the step                                            |
| `username` | `string` | The username of the user that will be assigned an approval for this step |

### FormApprovalFlowInstance

| Property                           | Type                                              | Description                                                                                                              |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `id`                               | `number`                                          | The unique identifier for the record                                                                                     |
| `submissionId`                     | `string`                                          | The unique identifier for the submission being approved                                                                  |
| `formId`                           | `number`                                          | The unique identifier for the form that was submitted for approval                                                       |
| `approvalsFormsAppId`              | `number`                                          | The unique identifier for the Approvals Forms App associated with the approval                                           |
| `previousFormSubmissionApprovalId` | `string \| undefined`                             | The unique identifier for the previous [FormSubmissionApproval](#formsubmissionapproval) that lead to this approval flow |
| `steps`                            | [FormApprovalFlowStep](#formapprovalflowstep)`[]` | An array of the [FormApprovalFlowStep](#formapprovalflowstep)s                                                           |
| `createdAt`                        | `string`                                          | The date and time (in ISO format) the approval was created                                                               |

### FormSubmissionApproval

| Property                     | Type                  | Description                                                                                               |
| ---------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `id`                         | `string`              | The unique identifier for the record                                                                      |
| `status`                     | `string`              | `'PENDING' \| 'APPROVED' \| 'CLARIFICATION_REQUIRED' \| 'CLOSED'`                                         |
| `username`                   | `string`              | The username of the approver assigned the approval                                                        |
| `formApprovalFlowInstanceId` | `number`              | The unique identifier for the [FormApprovalFlowInstance](#formapprovalflowinstance) of this approval flow |
| `notificationEmailAddress`   | `string \| undefined` | The email address of the user to be notified of the response                                              |
| `notes`                      | `string \| undefined` | The approvers notes attached to the response                                                              |
| `internalNotes`              | `string \| undefined` | The approvers internal notes                                                                              |
| `createdAt`                  | `string`              | The date and time (in ISO format) the approval was created                                                |
| `updatedAt`                  | `string`              | The date and time (in ISO format) the approval was last updated                                           |

### `getFormSubmissionApprovals()`

Get an Object containing [`FormSubmissionApproval`](#formsubmissionapproval)s assigned to the current user and the Form definitions in those approvals.

```js
const formsAppId = 1
const {
  formSubmissionApprovals,
  formApprovalFlowInstances,
  forms,
  formSubmissionMeta,
} = await approvalsService.getFormSubmissionApprovals(formAppId)
```

### `getFormSubmissionApproval()`

Get a single [`FormSubmissionApproval`](#formsubmissionapproval) belonging to the given id.

```js
const formSubmissionApprovalId = 'd27966cc-128d-48a2-b681-6ad52012e113'
const {
  formSubmissionApproval,
  formApprovalFlowInstance,
  formSubmissionMeta,
  form,
  history,
} = await approvalsService.getFormSubmissionApproval(formSubmissionApprovalId)
```

### `updateFormSubmissionApproval()`

Update a single [`FormSubmissionApproval`](#formsubmissionapproval) assigned to the current user.

```js
const formSubmissionApproval = {
  id: 'd27966cc-128d-48a2-b681-6ad52012e113',
  status: 'APPROVED',
  username: 'email@example.com',
  formApprovalFlowInstanceId: 1,
  notificationEmailAddress: 'email@example.com',
  notes: 'Great work!!!',
  internalNotes: 'It was not really that great...',
  createdAt: '2021-02-21T22:57:56.257Z',
  updatedAt: '2021-02-21T22:57:56.257Z',
}
const updatedFormSubmissionApproval = await approvalsService.updateFormSubmissionApproval(
  formSubmissionApproval,
)
```

### `retrieveFormSubmissionApprovalSubmission()`

Retrieve the submission data associated with a [`FormSubmissionApproval`](#formsubmissionapproval).

```js
const formSubmissionApprovalId = 'd27966cc-128d-48a2-b681-6ad52012e113'
const formSubmission = await approvalsService.retrieveFormSubmissionApprovalSubmission(
  formSubmissionApprovalId,
)
```
