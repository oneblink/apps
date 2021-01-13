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
- [`getFormElementDynamicOptions()`](#getformelementdynamicoptions)
- [`forEachFormElement()`](#foreachformelement)
- [`findFormElement()`](#findformelement)
- [`searchGeoscapeAddresses()`](#searchgeoscapeaddresses)
- [`getGeoscapeAddress()`](#getgeoscapeaddress)

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
  formsAppEnvironmentId,
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
  formElementLookupId,
)
if (formElementLookup) {
  // Use lookup
}
```

### `getFormElementDynamicOptions()`

Get a the options for a single Form or an array of Forms for Form Elements that are using a OneBlink Form Element Options Set.

```js
const optionsForElementId = await formService.getFormElementDynamicOptions(form)

// Set all the options for the required elements
for (const { elementId, options } of optionsForElementId) {
  // BEWARE
  // this example does not accommodate for
  // nested elements in pages and repeatable sets
  for (const formElement of form.elements) {
    if (formElement.id === elementId) {
      formElement.options = options
    }
  }
}
```

### `forEachFormElement()`

Iterate over OneBlink Form Elements. Helpful to recursively check form elements in repeatable sets and pages.

```js
formService.forEachFormElement(
  form.elements,
  (formElement, parentFormElements) => {
    // Do what you need to do to each form element
  },
)
```

### `findFormElement()`

Iterate over OneBlink Form Elements and return one based on a predicate. Helpful to recursively find a form element in repeatable sets and pages.

```js
const formElement = formService.findFormElement(
  form.elements,
  (formElement, parentFormElements) => {
    return formElement.id === 'the id you are looking for'
  },
)
if (formElement) {
  // Found the one you were looking for
}
```

### `searchGeoscapeAddresses()`

Search for geoscape addresses based on a partial address.

```js
const formId = 1
const result = await formService.searchGeoscapeAddresses(formId, {
  query: '123 N',
  maxNumberOfResults: 10
  stateTerritory: 'NSW'
})
```

### `getGeoscapeAddress()`

Get the details for a single geoscape address based on the Id of a geoscape address resource.

```js
const formId = 1
const addressId = 'ABC123'
const result = await formService.getGeoscapeAddress(formId, addressId)
```
