# OneBlink Apps | Usage

## Localisation Service

Helper functions for handling all things locale.

```js
import { localisationService } from '@oneblink/apps'
```

- [`locale`](#locale)
- [`formatDate()`](#formatdate)
- [`formatDateLong()`](#formatdatelong)
- [`formatTime()`](#formattime)
- [`formatDatetime()`](#formatdatetime)
- [`formatDatetimeLong()`](#formatdatetimelong)
- [`formatNumber()`](#formatnumber)
- [`formatCurrency()`](#formatcurrency)

### `locale`

Get the locale (e.g. `en-AU`) for the [current tenant](./README#tenants).

```js
const locale = localisationService.locale
```

### `formatDate()`

Format a `Date` as a `string` that just contains the date portion e.g. _31/01/2020_

```js
const date = new Date()
const text = localisationService.formatDate(date)
// Display text
```

### `formatDateLong()`

Format a `Date` as a `string` that just contains the date portion in a long format e.g. _Thursday, 2 January 2020_

```js
const date = new Date()
const text = localisationService.formatDateLong(date)
// Display text
```

### `formatTime()`

Format a `Date` as a `string` that just contains the time portion e.g. _5:31 pm_

```js
const date = new Date()
const text = localisationService.formatTime(date)
// Display text
```

### `formatDatetime()`

Format a `Date` as a `string` that contains the date and time portions e.g. _31/01/2020 5:31 pm_

```js
const date = new Date()
const text = localisationService.formatDatetime(date)
// Display text
```

### `formatDatetimeLong()`

Format a `Date` as a `string` that contains the date and time portions in a long format e.g. _Thursday, 2 January 2020 5:31 pm_

```js
const date = new Date()
const text = localisationService.formatDatetime(date)
// Display text
```

### `formatNumber()`

Format a `number` as a `string` represented as a readable number e.g. _123,321.123_

```js
const amount = 1234.4321
const text = localisationService.formatCurrency(amount)
// Display text
```

### `formatCurrency()`

Format a `number` as a `string` represented as a currency e.g. _\$123.31_

```js
const amount = 123.321
const text = localisationService.formatCurrency(amount)
// Display text
```
