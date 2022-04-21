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
- [`searchGeoscapeAddresses()`](#searchgeoscapeaddresses)
- [`getGeoscapeAddress()`](#getgeoscapeaddress)
- [`searchPointAddresses()`](#searchpointaddresses)
- [`getPointAddress()`](#getpointaddress)
- [`searchCivicaStreetNames()`](#searchcivicastreetnames)
- [`getCivicaTitleCodes()`](#getcivicatitlecodes)
- [`getBSBRecord()`](#getbsbrecord)

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

### `getCivicaTitleCodes()`

Get titles codes from Civica name register

```js
const formId = 1
const results = await formService.getCivicaTitleCodes(formId)
```

### `getBSBRecord()`

Get BSB record based on a BSB number codes from Civica name register

```js
const formId = 1
const bsb = '123-321'
const results = await formService.getBSBRecord(formId, bsb)
```
