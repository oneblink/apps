# OneBlink Apps - Usage

## Requirements

- [Node.js](https://nodejs.org/) 18.0 or newer
- NPM 8.0 or newer

## Installation

```sh
npm install @oneblink/apps --save
```

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
