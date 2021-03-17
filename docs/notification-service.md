# OneBlink Apps | Usage

## Notification Service

Helper functions for notification handling

```js
import { notificationService } from '@oneblink/apps'
```

### Service Worker

To display push notifications and allow them to be clicked to open the application, add the following JavaScript to your service worker (we recommend using [offline-plugin](https://www.npmjs.com/package/offline-plugin)):

```js
self.addEventListener('push', (event) => {
  console.log('push event', event)

  if (!event.data) {
    console.log('Received push event without any data', event)
    return
  }
  const notification = event.data.json()

  event.waitUntil(
    clients.matchAll().then((c) => {
      if (c.length === 0 || c.every((client) => !client.focused)) {
        // Show notification
        return self.registration.showNotification(
          notification.title,
          notification.options,
        )
      } else {
        console.log('Application is already open!')
      }
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('notification click event', event)

  const pathname =
    event.notification.data && event.notification.data.pathname
      ? event.notification.data.pathname
      : '/'

  event.waitUntil(
    clients.matchAll().then((clis) => {
      const client = clis[0]
      if (client === undefined) {
        // there are no visible windows. Open one.
        clients.openWindow(pathname)
      } else {
        client.navigate(pathname)
        client.focus()
      }

      return self.registration.getNotifications().then((notifications) => {
        notifications.forEach((notification) => {
          notification.close()
        })
      })
    }),
  )
})
```

- [`isSubscribed()`](#issubscribed)
- [`subscribe()`](#subscribe)
- [`unsubscribe()`](#unsubscribe)

### `isSubscribed()`

Check if the user is currently subscribed to notifications

```js
const isSubscribed = await notificationService.isSubscribed()
// Allow user to subscribe or unsubscribe
```

### `subscribe()`

Subscribe the current user to notifications

```js
const formsAppId = 1
const isSubscribed = await notificationService.subscribe(formsAppId)
// isSubscribed will be false if user denied permission to push notifications
```

### `unsubscribe()`

Subscribe the current user to notifications

```js
const formsAppId = 1
await notificationService.unsubscribe(formsAppId)
// isSubscribed will be false if user denied permission to push notifications
```
