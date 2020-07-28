# OneBlink Apps | Usage

## Tenants

This helper library supports all OneBlink Productivity instances. There are some functions that required a tenant to be passed in. The available tenants are:

- [OneBlink Console](https://console.oneblink.io)

  ```js
  import { tenants } from '@oneblink/apps'

  const oneblinkTenant = tenants.oneblink
  ```

- [CivicOptimize Productivity](https://console.transform.civicplus.com)

  ```js
  import { tenants } from '@oneblink/apps'

  const civicplusTenant = tenants.civicplus
  ```

## Services

- [`offlineService`](./offline-service.md)
- [`authService`](./auth-service.md)

## Errors

- [`OneBlinkAppsError`](./oneBlinkAppsError.md)
