# OneBlink Apps | Usage

## Vocabulary Service

Helper functions for handling vocabulary.

```js
import { vocabularyService } from '@oneblink/apps'
```

- [`locale`](#locale)
- [`formatDate()`](#formatdate)
- [`formatTime()`](#formattime)
- [`formatDatetime()`](#formatdatetime)
- [`formatCurrency()`](#formatcurrency)

### `locale`

Get the locale (e.g. `en-AU`) for the [current tenant](./README#tenants).

```js
const locale = vocabularyService.locale
```

### `formatDate()`

Format a `Date` as a `string` that just contains the date portion

```js
const date = new Date()
const text = vocabularyService.formatDate(date)
// Display text
```

### `formatTime()`

Format a `Date` as a `string` that just contains the time portion

```js
const date = new Date()
const text = vocabularyService.formatTime(date)
// Display text
```

### `formatDatetime()`

Format a `Date` as a `string` that contains the date and time portions

```js
const date = new Date()
const text = vocabularyService.formatDatetime(date)
// Display text
```

### `formatCurrency()`

Format a `number` as a `string` represented as a currency

```js
const amount = 123.321
const text = vocabularyService.formatCurrency(amount)
// Display text
```
