# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- `X-OneBlink-User-Token` header not being sent if `Authorization` header is sent with requests

## 0.4.1 (2020-11-24)

### Added

- Include `X-OneBlink-User-Token` if `userToken` is provided

## 0.4.0 (2020-11-17)

### Changed

- **[BREAKING]** [`paymentService.handlePaymentSubmissionEvent()`](./docs/payment-service.md#handlepaymentsubmissionevent) argument, `formSubmission` property has changed to a `formSubmissionResult`.
- **[BREAKING]** [`paymentService.handlePaymentSubmissionEvent()`](./docs/payment-service.md#handlepaymentsubmissionevent) argument, `submissionId` property has been removed

## 0.3.1 (2020-11-12)

### Changed

- source from Flow to TypeScript

### Dependencies

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.786.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.786.0) (from [2.748.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.748.0))

- update [jwt-decode](https://www.npmjs.com/package/jwt-decode) to [3.1.1](https://github.com/auth0/jwt-decode/blob/master/CHANGELOG.md) (from [2.2.0](https://github.com/auth0/jwt-decode/blob/master/CHANGELOG.md))

- update [query-string](https://www.npmjs.com/package/query-string) to [6.13.7](https://github.com/sindresorhus/query-string/releases/tag/v6.13.7) (from [6.13.1](https://github.com/sindresorhus/query-string/releases/tag/v6.13.1))

- update [uuid](https://www.npmjs.com/package/uuid) to [8.3.1](https://github.com/uuidjs/uuid/blob/master/CHANGELOG.md) (from [8.3.0](https://github.com/uuidjs/uuid/blob/master/CHANGELOG.md))

### 0.3.0 (2020-11-30)

### Changed

- **[BREAKING]** [`paymentService.handlePaymentSubmissionEvent()`](./docs/payment-service.md#handlepaymentsubmissionevent) arguments to be a single object

### Added

- [`localisationService.formatDateLong()`](./docs/localisation-service.md#formatdatelong)
- [`localisationService.formatDatetimeLong()`](./docs/localisation-service.md#formatdatetimelong)

### Fixed

- hard coded `formsAppId` on draft submissions

### 0.2.0 (2020-10-15)

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

## 0.1.0 (2020-08-24)

Initial release
