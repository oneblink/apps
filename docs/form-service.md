# OneBlink Apps | Usage

## Form Service

Helper functions for form handling

```js
import { formService } from '@oneblink/apps'
```

- [`getForms()`](#getforms)
- [`getForm()`](#getform)
- [`getFormElementLookups()`](#getformelementlookups)
- [`getFormElementLookupById()`](#getformelementlookupbyid)
- [`getFormElementOptionsSets()`](#getformelementoptionssets)
- [`getFormElementOptionsSetById()`](#getformelementoptionssetbyid)
- [`getFormElementDynamicOptions()`](#getformelementdynamicoptions)
- [`forEachFormElement()`](#foreachformelement)
- [`findFormElement()`](#findformelement)

### `getForms()`

Get an array of OneBlink Forms.

```js
const formsAppId = 1
const forms = await formService.getForms(formAppId)
```

### `getForm()`

Get a OneBlink Form.

```js
const formsAppId = 1
const formId = 1
const form = await formService.getForm(formAppId, formId)
```

### `getFormElementLookups()`

Get an array of OneBlink Form Element Lookups.

```js
const organisationId = '1234567890ABCDEFG'
const formsAppEnvironmentId = 1
const formElementLookups = await formService.getFormElementLookups(
  organisationId,
  formsAppEnvironmentId
)
```

### `getFormElementLookupById()`

Get a OneBlink Form Element Lookup.

```js
const organisationId = '1234567890ABCDEFG'
const formsAppEnvironmentId = 1
const formElementLookupId = 1
const formElementLookup = await formService.getFormElementLookupById(
  organisationId,
  formsAppEnvironmentId,
  formElementLookupId
)
if (formElementLookup) {
  // Use lookup
}
```

### `getFormElementOptionsSets()`

Get an array of OneBlink Form Element Options Sets.

```js
const organisationId = 1
const formsAppEnvironmentId = 1
const formElementOptionsSets = await formService.getFormElementOptionsSets(
  organisationId,
  formsAppEnvironmentId
)
```

### `getFormElementOptionsSetById()`

Get a OneBlink Form Element Options Set.

```js
const organisationId = 1
const formsAppEnvironmentId = 1
const formElementOptionsSetId = 1
const formElementOptionsSet = await formService.getFormElementOptionsSetById(
  organisationId,
  formsAppEnvironmentId,
  formElementOptionsSetId
)
if (formElementOptionsSet) {
  // Use options set
}
```

### `getFormElementDynamicOptions()`

Get a the options for a form element that is using a OneBlink Form Element Options Set.

```js
const options = await formService.getFormElementOptionsSetById(
  form,
  formElement
)
if (options) {
  // Set options on element
}
```

### `forEachFormElement()`

Iterate over OneBlink Form Elements. Helpful to recursively check form elements in repeatable sets and pages.

```js
formService.forEachFormElement(
  form.elements,
  (formElement, parentFormElements) => {
    // Do what you need to do to each form element
  }
)
```

### `findFormElement()`

Iterate over OneBlink Form Elements and return one based on a predicate. Helpful to recursively find a form element in repeatable sets and pages.

```js
const formElement = formService.findFormElement(
  form.elements,
  (formElement, parentFormElements) => {
    return formElement.id === 'the id you are looking for'
  }
)
if (formElement) {
  // Found the one you were looking for
}
```
