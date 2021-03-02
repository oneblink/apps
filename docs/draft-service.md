# OneBlink Apps | Usage

## Draft Service

Helper functions for handling drafts.

```js
import { draftService } from '@oneblink/apps'
```

- [`getDrafts()`](#getdrafts)
- [`getDraftAndData()`](#getdraftanddata)
- [`addDraft()`](#adddraft)
- [`updateDraft()`](#updatedraft)
- [`deleteDraft()`](#deletedraft)
- [`registerDraftsListener()`](#registerdraftslistener)
- [`syncDrafts()`](#syncdrafts)

### Types

#### Draft

| Property                           | Type                  | Description                                                                                                                |
| ---------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `draftId`                          | `string`              | The id of the draft                                                                                                        |
| `draftDataId`                      | `string`              | The id of the draft data stored                                                                                            |
| `title`                            | `string`              | The title input by the user to display the draft                                                                           |
| `formId`                           | `number`              | The id of the form the draft was saved against                                                                             |
| `externalId`                       | `string \| undefined` | the external id provided by a developer                                                                                    |
| `previousFormSubmissionApprovalId` | `number \| undefined` | The previous form submission approval id, if the draft is a response to a clarification request on the submission approval |
| `jobId`                            | `string \| undefined` | The id of the job associated with the draft                                                                                |
| `updatedAt`                        | `string`              | The date and time (in ISO format) the draft was last updated                                                               |

### `getDrafts()`

Get an array of [Draft](#draft)s for the currently logged in user.

```js
const drafts = await draftService.getDrafts()
```

### `getDraftAndData()`

Get a single [Draft](#draft) and the associated submission data.

```js
const draftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003'
const { draft, draftData } = await draftService.getDraftAndData(draftId)
// use "draftData" to prefill a from
```

### `getDraftAndData()`

Get a single [Draft](#draft) and the associated submission data.

```js
const draftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003'
const { draft, draftData } = await draftService.getDraftAndData(draftId)
// use "draftData" to prefill a from
```

### `addDraft()`

Add a [Draft](#draft) to the local store and sync it with remote drafts.

```js
const draft = {
  draftId: 'd3aeb944-d0b3-11ea-87d0-0242ac130003',
  title: 'I Will Finish This Later',
  formId: 1,
  externalId: 'external'
  jobId: '0ac41494-723b-4a5d-90bb-534b8360f31d',
  previousFormSubmissionApprovalId: 23,
}
const data = {
  formsAppId: 1,
  submission: {
    form: 'data',
    goes: 'here'
  },
  definition: OneBlinkForm,
}
await draftService.addDraft(
  draft,
  data,
)
```

#### Parameters

| Property          | Type            | Description                                  |
| ----------------- | --------------- | -------------------------------------------- |
| `newDraft`        | [Draft](#draft) | The draft                                    |
| `data`            | `object`        | The draft data                               |
| `data.submission` | `object`        | The form data                                |
| `data.definition` | `object`        | The form definition when the draft was saved |

### `updateDraft()`

Update a [Draft](#draft) in the local store and sync it with remote drafts.

```js
const draft = {
  draftId: 'd3aeb944-d0b3-11ea-87d0-0242ac130003',
  title: 'I Will Finish This Later',
  formId: 1,
  externalId: 'external'
  jobId: '0ac41494-723b-4a5d-90bb-534b8360f31d',
  previousFormSubmissionApprovalId: 23,
}
const data = {
  formsAppId: 1,
  submission: {
    form: 'data',
    goes: 'here'
  },
  definition: OneBlinkForm,
}
await draftService.updateDraft(
  draft,
  data,
)
```

#### Parameters (same as `addDraft()`)

### `deleteDraft()`

Remove a draft from the local store and sync with remote drafts.

```js
const draftId = 'd3aeb944-d0b3-11ea-87d0-0242ac130003'
await draftService.deleteDraft(draftId)
```

### `registerDraftsListener()`

Register a lister function that will be passed an array of [Draft](#draft)s when a draft is added, updated or deleted.

```js
const listener = async (drafts) => {
  // use drafts here...
}
const deregister = await draftService.registerDraftsListener(listener)

// When no longer needed, remember to deregister the listener
deregister()
```

### `syncDrafts()`

Force a sync of remote drafts with locally stored drafts. This function will swallow all errors thrown unless `true` is passed for the `throwError` property.

```js
await draftService.syncDrafts({
  throwError: true,
  formsAppId: 1,
})
```

#### Parameters

| Property             | Type      | Description                                          |
| -------------------- | --------- | ---------------------------------------------------- |
| `options.throwError` | `boolean` | `true` to throw errors while syncing                 |
| `options.formsAppId` | `number`  | The id of the OneBlink Forms App to sync drafts with |
