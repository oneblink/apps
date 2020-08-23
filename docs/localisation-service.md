# OneBlink Apps | Usage

## Localisation Service

Helper functions for handling all things locale.

```js
import { localisationService } from '@oneblink/apps'
```

- [`locale`](#locale)
- [`formatDate()`](#formatdate)
- [`formatTime()`](#formattime)
- [`formatDatetime()`](#formatdatetime)
- [`formatCurrency()`](#formatcurrency)

### `locale`

Get the locale (e.g. `en-AU`) for the [current tenant](./README#tenants).

```js
const locale = localisationService.locale
```

### `formatDate()`

Format a `Date` as a `string` that just contains the date portion

```js
const date = new Date()
const text = localisationService.formatDate(date)
// Display text
```

### `formatTime()`

Format a `Date` as a `string` that just contains the time portion

```js
const date = new Date()
const text = localisationService.formatTime(date)
// Display text
```

### `formatDatetime()`

Format a `Date` as a `string` that contains the date and time portions

```js
const date = new Date()
const text = localisationService.formatDatetime(date)
// Display text
```

### `formatCurrency()`

Format a `number` as a `string` represented as a currency

```js
const amount = 123.321
const text = localisationService.formatCurrency(amount)
// Display text
```
