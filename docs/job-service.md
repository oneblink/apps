# OneBlink Apps | Usage

## Job Service

Helper functions for job handling

```js
import { jobService } from '@oneblink/apps'
```

- [`getJobs()`](#getJobs)
- [`ensurePrefillFormDataExists()`](#ensurePrefillFormDataExists)

### Types

#### Job

| Property              | Type                                               | Description                                                               |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`                  | `string`                                           | The id the job                                                            |
| `formId`              | `number`                                           | The id of the form associated with the job                                |
| `draft`               | [FormsAppDraft](./draft-service.md#draft) `| null` | If the job was started and saved as a draft, this will include the draft. |
| `externalId`          | `string | null`                                    | The external id set when the job was created                              |
| `preFillFormDataId`   | `string | null`                                    | The id of the prefill data associated with the job                        |
| `createdAt`           | `string`                                           | The date and time (in ISO format) the job was created                     |
| `details`             | `object`                                           | The job details                                                           |
| `details.title`       | `string`                                           | The job title                                                             |
| `details.key`         | `string | null`                                    | The job key                                                               |
| `details.priority`    | `string | null`                                    | The job priority                                                          |
| `details.description` | `string | null`                                    | The job description                                                       |
| `details.type`        | `string | null`                                    | The job type                                                              |

### `getJobs()`

Get [Job](#job)s for the current user. [Job](#job)s that are in the pending queue will be filtered out and [Job](#job)s with drafts will include the `draft` property.

```js
const formsAppId = 1
const jobs = await jobService.getJobs(formsAppId)
```

### `ensurePrefillFormDataExists()`

Helper to store [Job](#job) prefill data locally if it is not currently in the local store. Pass in an array of [Job](#job)s.

```js
const jobs = [...]
await jobService.ensurePrefillFormDataExists(jobs)
```
