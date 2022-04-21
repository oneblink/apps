# OneBlink Apps | Usage

## Auto Save Service

Helper functions for handling data while user is completing form.

```js
import { autoSaveService } from '@oneblink/apps'
```

- [`getAutoSaveData()`](#getautosavedata)
- [`upsertAutoSaveData()`](#upsertautosavedata)
- [`deleteAutoSaveData()`](#deleteautosavedata)

### `getAutoSaveData()`

Get saved data.

```js
const formId = 1
const myKey = 'my-key'
const prefillData = await autoSaveService.getAutoSaveData(formId, myKey)
if (prefillData) {
  // Ask user if they would like to continue with this prefill data.
}
```

### `upsertAutoSaveData()`

Create or update saved data.

```js
const formId = 1
const myKey = 'my-key'
await autoSaveService.upsertAutoSaveData(formId, myKey, {
  form: 'data',
  goes: 'here',
})
```

### `deleteAutoSaveData()`

Delete saved data.

```js
const formId = 1
const myKey = 'my-key'
await autoSaveService.deleteAutoSaveData(formId, myKey)
```
