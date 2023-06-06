# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `STATIC_DATA` form element lookup type

### Updated

- **[BREAKING]** `submissionService.submit()` function requires more parameters to handle server validation and external ID generation within the function

## [4.1.0] - 2023-06-05

### Added

- `authService.signUp()`

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [3.0.0-beta.2](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [2.0.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [4.0.0] - 2023-05-26

### Changed

- **[BREAKING]** `formService.getFormElementDynamicOptions()` function result has changed to accommodate options sets that support passing a querystring parameter to filter options server side

### Added

- support for MFA to cognito logins
- `authService.setupMfa()`
- `authService.disableMfa()`

### Fixed

- optionIds not being set for dynamic options set filtering

## [3.2.0] - 2023-05-08

### Added

- `localisationService.generateDate()`
- `localisationService.replaceSubmissionValues()`
- `localisationService.replaceSubmissionResultValues()`

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [2.0.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [1.0.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [3.1.2] - 2023-04-20

### Added

- `@microsoft/eslint-plugin-sdl` eslint plugin

## [3.1.1] - 2023-04-14

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [1.0.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.4.4-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [3.1.0] - 2023-03-26

### Added

- `downloadSubmissionPdfUrl` to return type of `submissionService.submit`
- `generateExternalId` to `formService`
- `lastElementUpdated` to `NewDraftSubmission`
- `lastElementUpdated` to `draftService.getDraftAndData()`

### Changed

- `externalId` to be stored in S3 object instead of S3 tags

### Dependencies

- depend upon [date-fns](https://www.npmjs.com/package/date-fns) [2.29.3](https://github.com/date-fns/date-fns/releases/tag/v2.29.3)

- depend upon [nanoid](https://www.npmjs.com/package/nanoid) [4.0.1](https://github.com/ai/nanoid/blob/master/CHANGELOG.md)

## [3.0.4] - 2023-03-03

### Added

- `formApprovalFlowInstanceId` to `approvalsService.getFormSubmissionAdministrationApprovals()`

## [3.0.3] - 2022-12-13

### Fixed

- checking incorrect property for successful CP Pay transactions

## [3.0.2] - 2022-12-12

### Changed

- CP Pay redirect to handle v2 query parameters

### Fixed

- time formatting for older iOS devices. Prevents date from repeating.

### Dependencies

- depend upon [ua-parser-js](https://www.npmjs.com/package/ua-parser-js) 1.0.2

## [3.0.1] - 2022-10-26

### Changed

- test environment domains to .test.

## [3.0.0] - 2022-10-12

### Added

- An `onProgress` handler option to attachment upload, draft and submission functions
- `attachmentsService`

### Changed

- Reduced default `queueSize` for S3 uploads to cater for slower internet connections, set dynamically if connection type is available
- **[BREAKING]** `draftService.addDraft()` function to single argument
- **[BREAKING]** `draftService.updateDraft()` function to single argument

### Removed

- **[BREAKING]** `submissionService.uploadAttachment()` function. Replaced by `attachmentsService.uploadAttachment()`

## [2.1.0] - 2022-09-13

### Added

- `approvalsService.closeFormApprovalFlowInstance()`
- `approvalsService.reopenFormApprovalFlowInstance()`

### Deprecated

- `approvalsService.reopenFormSubmissionApproval()`

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.4.4-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.4.2-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [2.0.0] - 2022-08-28

### Removed

- `legacy` storage type for form elements

## [1.2.6] - 2022-08-16

### Changed

- Form element dynamic options to support `STATIC` option sets

## [1.2.5] - 2022-07-29

### Added

- `notificationService.getEmailSubscriptions()`
- `notificationService.updateEmailSubscriptions()`

### Changed

- username to lowercase before sending to Cognito

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.4.2-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.4.1-beta.5](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [1.2.4] - 2022-07-04

### Changed

- form submission result being removed from local storage when handling payment query string

## [1.2.3] - 2022-06-29

### Added

- `approvalsService.createApprovalAdditionalNote()`
- `approvalsService.updateApprovalAdditionalNote()`
- `approvalsService.deleteApprovalAdditionalNote()`
- `authService.getCurrentFormsAppUser()`

## [1.2.2] - 2022-06-23

### Added

- integration environment/gateway id to payment requests

## [1.2.1] - 2022-06-17

### Added

- nested `options` to Freshdesk options

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.4.1-beta.5](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.4.0](https://github.com/oneblink/sdk-core-js/releases/tag/v0.4.0))

## [1.2.0] - 2022-06-02

### Added

- `unwindRepeatableSets` to form store

### Fixed

- duplicate `"An unknown error has occurred. Please contact support if the problem persists."` error being reported to Sentry
- redundant `"Access Denied"` being reported to Sentry

## [1.1.0] - 2022-05-05

### Added

- `autoSaveKey` property to `submissionService.submit()` options
- `autoSaveKey` property to `approvalsService.submitApprovalForm()` options
- `autoSaveKey` argument to `draftService.addDraft()`
- `autoSaveKey` argument to `draftService.updateDraft()`

### Fixed

- Unsynced offline drafts disappearing when being saved

## [1.0.0] - 2022-05-03

### Added

- `formStoreService`
- `localisationService.getLocale()`
- `localisationService.getFlatpickrFormats()`
- `localisationService.getDateFnsFormats()`
- `abortSignal` param to `formService.getForms()`, `formService.getForm()`, `formService.getFormElementLookups()` and `formService.getFormElementLookupById()`

### Changed

- JSON parsing and stringifing to use `JSON` instead of `big-json`

### Removed

- **[BREAKING]** `localisationService.locale` function. Replaced by `localisationService.getLocale()`
- **[BREAKING]** `localisationService.flatpickrDateFormat` function. Replaced by `localisationService.getFlatpickrFormats().shortDate`
- **[BREAKING]** `localisationService.flatpickrTimeFormat` function. Replaced by `localisationService.getFlatpickrFormats().time`
- **[BREAKING]** `localisationService.flatpickrDatetimeFormat` function. Replaced by `localisationService.getFlatpickrFormats().shortDateTime`

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.4.0](https://github.com/oneblink/sdk-core-js/releases/tag/v0.4.0) (from [0.4.0-beta.2](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.19.7](https://github.com/getsentry/sentry-javascript/releases/tag/6.19.7) (from [6.19.6](https://github.com/getsentry/sentry-javascript/releases/tag/6.19.6))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.19.7](https://github.com/getsentry/sentry-javascript/releases/tag/6.19.7) (from [6.19.6](https://github.com/getsentry/sentry-javascript/releases/tag/6.19.6))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.1126.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.1126.0) (from [2.1114.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.1114.0))

- no longer depend upon [big-json](https://www.npmjs.com/package/big-json)

- no longer depend upon [s3-upload-stream](https://www.npmjs.com/package/s3-upload-stream)

- depend upon [file-saver](https://www.npmjs.com/package/file-saver) [2.0.5](https://github.com/eligrey/FileSaver.js/blob/master/CHANGELOG.md)

## [0.12.11] - 2022-04-19

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.4.0-beta.2](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.3.6-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.19.6](https://github.com/getsentry/sentry-javascript/releases/tag/6.19.6) (from [6.14.3](https://github.com/getsentry/sentry-javascript/releases/tag/6.14.3))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.19.6](https://github.com/getsentry/sentry-javascript/releases/tag/6.19.6) (from [6.14.3](https://github.com/getsentry/sentry-javascript/releases/tag/6.14.3))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.1114.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.1114.0) (from [2.976.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.976.0))

- update [query-string](https://www.npmjs.com/package/query-string) to [7.1.1](https://github.com/sindresorhus/query-string/releases/tag/v7.1.1) (from [7.0.1](https://github.com/sindresorhus/query-string/releases/tag/v7.0.1))

## [0.12.10] - 2022-04-13

### Added

- `createdAt` on drafts being set by client

## [0.12.9] - 2022-03-29

### Changed

- code to now use `validatePaymentAmount()` and `getRootElementValueById()` from SDK-core

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.3.6-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.3.3-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [0.12.8] - 2022-03-02

### Fixed

- `updatedAt` being set on drafts before sync

## [0.12.7] - 2022-01-24

### Changed

- `uploadAttachment` now returns `uploadedAt` string
- `contentDisposition` changed to be a SDK-Core function

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.3.3-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.3.2-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

- no longer depend upon [content-disposition](https://www.npmjs.com/package/content-disposition)

## [0.12.6] - 2022-01-19

### Added

- [`approvalsService.getFormSubmissionApprovalSubmission()`](./docs/approvals-service.md#getformsubmissionapprovalsubmission)
- [`approvalsService.submitApprovalForm()`](./docs/approvals-service.md#submitapprovalform)

## [0.12.5] - 2021-12-21

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.3.2-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.2.5-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

### Changed

- Logic in handling scheduling and payment submission events

## [0.12.4] - 2021-12-02

### Added

- freshdesk fields to dynamic options sets

## [0.12.3] - 2021-11-19

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.2.5-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.2.4-beta.2](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [0.12.1] - 2021-11-18

### Added

- [`formsAppService.getFormsAppConfiguration()`](./docs/forms-app-service.md#getFormsAppConfiguration)

## [0.12.0] - 2021-11-15

### Fixed

- `getForms()` not setting `injectForms` to true

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.2.4-beta.2](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.1.3-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.14.3](https://github.com/getsentry/sentry-javascript/releases/tag/6.14.3) (from [6.11.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.11.0))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.14.3](https://github.com/getsentry/sentry-javascript/releases/tag/6.14.3) (from [6.11.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.11.0))

## [0.11.7] - 2021-10-14

### Added

- [`authService.logoutHostedUI()`](./docs/auth-service.md#logouthostedui)

### Changed

- `authService` to handle forms app logic

## [0.11.6] - 2021-09-24

### Added

- [`formService.getBSBRecord()`](./docs/form-service.md#getbsbrecord)

## [0.11.5] - 2021-09-20

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.1.3-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.1.2-beta.2](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [0.11.4] - 2021-09-08

### Changed

- to use `userService` from SDK for parsing JWT payload

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.1.2-beta.2](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.1.1-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [0.11.3] - 2021-09-01

### Added

- `previousFormSubmissionApprovalId` to replaceable values

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.1.1-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.1.0](https://github.com/oneblink/sdk-core-js/releases/tag/v0.1.0))

## [0.11.2] - 2021-08-31

### Added

- `ipAddress` to S3 JSON on submission
- [`approvalsService.reopenFormSubmissionApproval()`](./docs/approvals-service.md#reopenformsubmissionapproval)
- `updatedAfterDateTime`, `updatedBeforeDateTime` and `lastUpdatedBy` search paramaters to `approvalsService.getFormApprovalFlowInstanceSubmission()`
- [`approvalsService.getFormApprovalUsernames()`](./docs/approvals-service.md#getformapprovalusernames)

### Changed

- the notifications errors that are sent to Sentry

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.1.0](https://github.com/oneblink/sdk-core-js/releases/tag/v0.1.0) (from [0.1.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

- update [@sentry/browser](https://www.npmjs.com/package/@sentry/browser) to [6.11.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.11.0) (from [6.9.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.9.0))

- update [@sentry/tracing](https://www.npmjs.com/package/@sentry/tracing) to [6.11.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.11.0) (from [6.9.0](https://github.com/getsentry/sentry-javascript/releases/tag/6.9.0))

- update [aws-sdk](https://www.npmjs.com/package/aws-sdk) to [2.976.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.976.0) (from [2.948.0](https://github.com/aws/aws-sdk-js/releases/tag/v2.948.0))

- update [localforage](https://www.npmjs.com/package/localforage) to [1.10.0](https://github.com/localForage/localForage/releases/tag/1.10.0) (from [1.9.0](https://github.com/localForage/localForage/releases/tag/1.9.0))

## [0.11.1] - 2021-08-25

**Deprecated**

## [0.11.0] - 2021-08-23

### Added

- [`approvalsService.getFormApprovalFlowInstanceSubmission()`](./docs/approvals-service.md#getformapprovalflowinstancesubmission)

### Removed

- **[BREAKING]** `approvalsService.retrieveFormSubmissionApprovalSubmission()`

## [0.10.1] - 2021-08-11

### Added

- `getFormApprovalFlows` to approvals service
- `getFormSubmissionAdministrationApprovals` to approvals service
- `isAdministrator` to auth service

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
