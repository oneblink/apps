# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `getFormApprovalFlows` to approvals service
- `getFormSubmissionAdministrationApprovals` to approvals service

## [0.10.0] - 2021-07-20

### Added

- [`schedulingService`](./docs/scheduling-service.md)
- handling for multiple payment submission events with conditions

### Removed

- **[BREAKING]** `paymentService.handlePaymentSubmissionEvent()`
- **[BREAKING]** `formService.forEachFormElementWithOptions()` moved to [@oneblink/sdk-core](npmjs.com/package/@oneblink/sdk-core)
- **[BREAKING]** `formService.forEachFormElement()` moved to [@oneblink/sdk-core](npmjs.com/package/@oneblink/sdk-core)
- **[BREAKING]** `formService.forEachFormElement()` moved to [@oneblink/sdk-core](npmjs.com/package/@oneblink/sdk-core)
- **[BREAKING]** `formService.parseFormElementOptionsSet()` moved to [@oneblink/sdk-core](npmjs.com/package/@oneblink/sdk-core)

### Dependencies

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.9.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.9.0) (from [6.7.2](https://github.com/getsentry/sentry-javascript/releases/tag/6.7.2))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.9.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.9.0) (from [6.7.2](https://github.com/getsentry/sentry-javascript/releases/tag/6.7.2))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.948.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.948.0) (from [2.932.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.932.0))

- depend upon [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) [0.1.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md)

## [0.9.4] - 2021-07-02

### Fixed

- attachments in sections not uploading for offline submissions

## [0.9.3] - 2021-06-23

### Added

- `searchCivicaStreetNames` to forms service
- `getCivicaTitleCodes` to forms service

### Fixed

- check for successful Westpac QuickWeb payments

### Dependencies

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.7.2](https://github.com/getsentry/sentry-javascript/releases/tag/6.7.2) (from [6.5.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.5.0))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.7.2](https://github.com/getsentry/sentry-javascript/releases/tag/6.7.2) (from [6.5.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.5.0))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.932.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.932.0) (from [2.918.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.918.0))

- update [query-string](https://www.npmjs.com/package/query-string) to [7.0.1](https://github.com/sindresorhus/query-string/releases/tag/v7.0.1) (from [7.0.0](https://github.com/sindresorhus/query-string/releases/tag/v7.0.0))

## [0.9.2] - 2021-06-06

### Added

- Support for `WESTPAC Quick Web` Payments

## [0.9.1] - 2021-06-02

### Fixed

- time skew error when devices time is incorrect
- `Content-Disposition` header for attachments

### Dependencies

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.5.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.5.0) (from [6.4.1](https://github.com/getsentry/sentry-javascript/releases/tag/6.4.1))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.5.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.5.0) (from [6.4.1](https://github.com/getsentry/sentry-javascript/releases/tag/6.4.1))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.918.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.918.0) (from [2.912.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.912.0))

- depend upon [content-disposition](https://www.npmjs.com/package/content-disposition) [0.5.3](https://github.com/jshttp/content-disposition/releases/tag/v0.5.3)

## [0.9.0] - 2021-05-26

### Removed

- **[BREAKING]** `formService.cancelForm()`

### Added

- [`submissionService.executeCancelAction()`](./docs/submission-service.md#executecancelaction)
- [`submissionService.goBackOrCloseWindow()`](./docs/submission-service.md#gobackorclosewindow)

### Dependencies

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.4.1](https://github.com/getsentry/sentry-javascript/releases/tag/6.4.1) (from [6.3.6](https://github.com/getsentry/sentry-javascript/releases/tag/6.3.6))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.4.1](https://github.com/getsentry/sentry-javascript/releases/tag/6.4.1) (from [6.3.6](https://github.com/getsentry/sentry-javascript/releases/tag/6.3.6))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.912.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.912.0) (from [2.907.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.907.0))

## [0.8.2] - 2021-05-19

### Fixed

- `formsAppId` not being sent in request to get form submission credentials

### Dependencies

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.3.6](https://github.com/getsentry/sentry-javascript/releases/tag/6.3.6) (from [6.3.5](https://github.com/getsentry/sentry-javascript/releases/tag/6.3.5))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.3.6](https://github.com/getsentry/sentry-javascript/releases/tag/6.3.6) (from [6.3.5](https://github.com/getsentry/sentry-javascript/releases/tag/6.3.5))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.907.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.907.0) (from [2.903.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.903.0))

- update [query-string](https://www.npmjs.com/package/query-string) to [7.0.0](https://github.com/sindresorhus/query-string/releases/tag/v7.0.0) (from [6.14.1](https://github.com/sindresorhus/query-string/releases/tag/v6.14.1))

## [0.8.1] - 2021-05-13

### Added

- [`localisationService.formatNumber()`](./docs/localisation-service.md#formatnumber)
- [`submissionService.uploadAttachment()`](./docs/submission-service.md#uploadattachment)

### Dependencies

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.3.5](https://github.com/getsentry/sentry-javascript/releases/tag/6.3.5) (from [6.2.5](https://github.com/getsentry/sentry-javascript/releases/tag/6.2.5))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.3.5](https://github.com/getsentry/sentry-javascript/releases/tag/6.3.5) (from [6.2.5](https://github.com/getsentry/sentry-javascript/releases/tag/6.2.5))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.903.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.903.0) (from [2.882.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.882.0))

## [0.8.0] - 2021-04-27

### Changed

- **[BREAKING]** [`formService.getFormElementDynamicOptions()`](./docs/form-service.md#getformelementdynamicoptions)

### Added

- [`formService.parseFormElementOptionsSet()`](./docs/form-service.md#parseformelementoptionsset)
- [`formService.forEachFormElementWithOptions()`](./docs/form-service.md#foreachformelementwithoptions)
- `Sentry` to allow for error capturing
- Captured all caught errors in Sentry

### Dependencies

- depend upon [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) [6.2.5](https://github.com/getsentry/sentry-javascript/releases/tag/6.2.5)

- depend upon [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) [6.2.5](https://github.com/getsentry/sentry-javascript/releases/tag/6.2.5)

## [0.7.2] - 2020-04-15

### Added

- [`formService.searchPointAddresses()`](./docs/form-service.md#searchpointaddresses)
- [`formService.getPointAddress()`](./docs/form-service.md#getpointaddress)

### Dependencies

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.882.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.882.0) (from [2.866.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.866.0))

## [0.7.1] - 2020-03-31

### Fixed

- `OneBlinkAppsError.httpStatusCode` not being set

## [0.7.0] - 2020-03-30

### Changed

- **[BREAKING]** Updated approvals-service [docs](./docs/approvals-service.md)

### Fixed

- `OneBlinkAppsError.httpStatusCode` not being set

## [0.6.1] - 2020-03-23

### Dependencies

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.866.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.866.0) (from [2.847.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.847.0))

- update [query-string](https://www.npmjs.com/package/query-string) to [6.14.1](https://github.com/sindresorhus/query-string/releases/tag/v6.14.1) (from [6.14.0](https://github.com/sindresorhus/query-string/releases/tag/v6.14.0))

## [0.6.0] - 2020-03-11

### Changed

- **[BREAKING]** [`approvalsService.getFormSubmissionApprovals()`](./docs/approvals-service.md#getformsubmissionapprovals) result.
- **[BREAKING]** [`approvalsService.getFormSubmissionApproval()`](./docs/approvals-service.md#getformsubmissionapproval) result.
- **[BREAKING]** [`approvalsService.updateFormSubmissionApproval()`](./docs/approvals-service.md#updateformsubmissionapproval) argument and result.

## [0.5.3] - 2020-03-03

### Added

- [`approvalsService`](./docs/approvals-service.md)
- `previousFormSubmissionApprovalId` to S3 tags on submission upload

### Dependencies

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.847.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.847.0) (from [2.786.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.786.0))

- update [jwt-decode](https://www.npmjs.com/package/jwt-decode) to [3.1.2](https://github.com/auth0/jwt-decode/blob/master/CHANGELOG.md) (from [3.1.1](https://github.com/auth0/jwt-decode/blob/master/CHANGELOG.md))

- update [query-string](https://www.npmjs.com/package/query-string) to [6.14.0](https://github.com/sindresorhus/query-string/releases/tag/v6.14.0) (from [6.13.7](https://github.com/sindresorhus/query-string/releases/tag/v6.13.7))

- update [uuid](https://www.npmjs.com/package/uuid) to [8.3.2](https://github.com/uuidjs/uuid/blob/master/CHANGELOG.md) (from [8.3.1](https://github.com/uuidjs/uuid/blob/master/CHANGELOG.md))

## [0.5.2] - 2020-02-15

### Fixed

- Invalid Option set properties not being converted to strings

## [0.5.1] - 2020-02-03

### Fixed

- `null` as POST request payload when generating draft data credentials

## [0.5.0] - 2020-01-18

### Changed

- **[BREAKING]** [`formService.getForm()`](./docs/form-service.md#getform) arguments: `formId` is now the first argument and `formsAppId` is the second. `formsAppId` has been changed to optional.

### Added

- [`formService.searchGeoscapeAddresses()`](./docs/form-service.md#searchgeoscapeaddresses)
- [`formService.getGeoscapeAddress()`](./docs/form-service.md#getgeoscapeaddress)

## [0.4.3] - 2020-12-22

### Added

- `crn2` and `crn3` to BPOINT payment configuration

## [0.4.2] - 2020-11-25

### Fixed

- `X-OneBlink-User-Token` header not being sent if `Authorization` header is sent with requests

## [0.4.1] - 2020-11-24

### Added

- Include `X-OneBlink-User-Token` if `userToken` is provided

## [0.4.0] - 2020-11-17

### Changed

- **[BREAKING]** [`paymentService.handlePaymentSubmissionEvent()`](./docs/payment-service.md#handlepaymentsubmissionevent) argument, `formSubmission` property has changed to a `formSubmissionResult`.
- **[BREAKING]** [`paymentService.handlePaymentSubmissionEvent()`](./docs/payment-service.md#handlepaymentsubmissionevent) argument, `submissionId` property has been removed

## [0.3.1] - 2020-11-12

### Changed

- source from Flow to TypeScript

### Dependencies

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.786.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.786.0) (from [2.748.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.748.0))

- update [jwt-decode](https://www.npmjs.com/package/jwt-decode) to [3.1.1](https://github.com/auth0/jwt-decode/blob/master/CHANGELOG.md) (from [2.2.0](https://github.com/auth0/jwt-decode/blob/master/CHANGELOG.md))

- update [query-string](https://www.npmjs.com/package/query-string) to [6.13.7](https://github.com/sindresorhus/query-string/releases/tag/v6.13.7) (from [6.13.1](https://github.com/sindresorhus/query-string/releases/tag/v6.13.1))

- update [uuid](https://www.npmjs.com/package/uuid) to [8.3.1](https://github.com/uuidjs/uuid/blob/master/CHANGELOG.md) (from [8.3.0](https://github.com/uuidjs/uuid/blob/master/CHANGELOG.md))

## [0.3.0] - 2020-11-30

### Changed

- **[BREAKING]** [`paymentService.handlePaymentSubmissionEvent()`](./docs/payment-service.md#handlepaymentsubmissionevent) arguments to be a single object

### Added

- [`localisationService.formatDateLong()`](./docs/localisation-service.md#formatdatelong)
- [`localisationService.formatDatetimeLong()`](./docs/localisation-service.md#formatdatetimelong)

### Fixed

- hard coded `formsAppId` on draft submissions

## [0.2.0] - 2020-10-15

### Added

- [`authService.loginHostedUI()`](./docs/auth-service.md#loginhostedui)
- [`authService.loginUsernamePassword()`](./docs/auth-service.md#loginusernamepassword)
- [`authService.changePassword()`](./docs/auth-service.md#changepassword)
- [`authService.forgotPassword()`](./docs/auth-service.md#forgotpassword)
- [`authService.registerAuthListener()`](./docs/auth-service.md#registerauthlistener)
- `username` property on user object uses `preferred_username` attribute from SAML provider if available

### Removed

- `authService.login`. This has been replaced by [`authService.loginHostedUI()`](./docs/auth-service.md#loginhostedui)

### Fixed

- types for submissions

## [0.1.0] - 2020-08-24

Initial release
