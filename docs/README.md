# OneBlink Apps | Usage

## Tenants

This helper library supports all OneBlink Productivity instances.. There are some functions that require tenant based configuration. Before you use any of the services documented below, be sure to set the current tenant. The available tenants (and how to set them) are:

- [OneBlink Console](https://console.oneblink.io)

  ```js
  import { useTenantOneBlink } from '@oneblink/apps'

  useTenantOneBlink()
  ```

- [CivicOptimize Productivity](https://console.transform.civicplus.com)

  ```js
  import { useTenantCivicPlus } from '@oneblink/apps'

  useTenantCivicPlus()
  ```

The default tenant is the [OneBlink Console](https://console.oneblink.io) which will be used if no tenant is explicitly set.

## Services

- [`offlineService`](./offline-service.md)
- [`authService`](./auth-service.md)
- [`draftService`](./draft-service.md)
- [`prefillService`](./prefill-service.md)
- [`paymentService`](./payment-service.md)
- [`jobService`](./job-service.md)
- [`submissionService`](./submission-service.md)
- [`autoSaveService`](./auto-save-service.md)
- [`notificationService`](./notification-service.md)
- [`formService`](./form-service.md)
- [`vocabularyService`](./vocabulary-service.md)

## Errors

- [`OneBlinkAppsError`](./oneBlinkAppsError.md)
