# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `Sentry` to allow for error capturing

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
