# OneBlink Apps | Usage

## Prefill Service

Helper functions for offline handling

```js
import { prefillService } from '@oneblink/apps'
```

- [`getPrefillFormData()`](#getprefillformdata)
- [`removePrefillFormData()`](#removeprefillformdata)

### `getPrefillFormData()`

Get prefill data for a form. Checks if the data is stored locally first, and then downloads from remote if required. After a successful download from the remote store, it will store is locally to ensure the next request will retrieve the data from the local store.

```js
const formId = 1
const prefillFormDataId = '24faee0a-dca1-4c88-9100-9da2aae8e0ac'
const prefillData = await prefillService.getPrefillFormData(
  formId,
  prefillFormDataId
)
if (prefillData) {
  // prefill form with data
}
```

### `removePrefillFormData()`

Remove prefill data form the local store.

```js
const prefillFormDataId = '24faee0a-dca1-4c88-9100-9da2aae8e0ac'
await prefillService.removePrefillFormData(prefillFormDataId)
```
