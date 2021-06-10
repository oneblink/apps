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
- [`forEachFormElementWithOptions()`](#foreachformelementwithoptions)
- [`findFormElement()`](#findformelement)
- [`parseFormElementOptionsSet()`](#parseformelementoptionsset)
- [`searchGeoscapeAddresses()`](#searchgeoscapeaddresses)
- [`getGeoscapeAddress()`](#getgeoscapeaddress)
- [`searchPointAddresses()`](#searchpointaddresses)
- [`getPointAddress()`](#getpointaddress)
- [`searchCivicaStreetNames()`](#searchcivicastreetnames)
- [`getCivicaTitleCodes()`](#getcivicatitlecodes)

### `getForms()`

Get an array of OneBlink Forms.

```js
const formsAppId = 1
const forms = await formService.getForms(formAppId)
```

### `getForm()`

Get a OneBlink Form.

```js
const formId = 1
const formsAppId = 1 // `formsAppId` is optional
const form = await formService.getForm(formId, formAppId)
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
for (const { elementId, options } of optionsForElementId.filter(
  ({ ok }) => ok,
)) {
  // BEWARE
  // this example does not accommodate for
  // nested elements in pages and repeatable sets
  // or for options sets that fail to load
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

### `forEachFormElementWithOptions()`

Iterate over OneBlink Form Elements that have options e.g. `'select'` type elements. Helpful to recursively check form elements in repeatable sets and pages.

```js
formService.forEachFormElementWithOptions(
  form.elements,
  (formElementWithOptions, parentFormElements) => {
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

### `parseFormElementOptionsSet()`

Parse unknown data as valid options for a forms element. This will always return an Array of valid options.

```js
const options = formService.parseFormElementOptionsSet(data)
// "options" are valid for a form element
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

### `searchPointAddresses()`

Search for Point addresses based on a partial address.

```js
const formId = 1
const result = await formService.searchPointAddresses(formId, {
  address: '123 N',
  maxNumberOfResults: 10
  stateTerritory: 'NSW'
})
```

### `getPointAddress()`

Get the details for a single Point address based on the Id of a Point address resource.

```js
const formId = 1
const addressId = 'ABC123'
const result = await formService.getPointAddress(formId, addressId)
```

### `searchCivicaStreetNames()`

Search for street names in Civica

```js
const formId = 1
const queryParams = {
  search: '1 Station ',
  top: 10,
}
const result = await formService.searchCivicaStreetNames(formId, queryParams)
```

### `searchCivicaStreetNames()`

Search for street names in Civica street register

```js
const formId = 1
const queryParams = {
  search: '1 Station ',
  top: 10,
}
const results = await formService.searchCivicaStreetNames(formId, queryParams)
```

### `getCivicaTitleCodes()`

Get titles codes from Civica name register

```js
const formId = 1
}
const results = await formService.getCivicaTitleCodes(formId)
```
