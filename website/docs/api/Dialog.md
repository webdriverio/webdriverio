---
id: dialog
title: The Dialog Object
---

Dialog objects are dispatched by [`browser`](/docs/api/browser) via the `browser.on('dialog')` event.

An example of using the Dialog object:

```ts
import { browser } from '@wdio/globals'

await browser.url('https://webdriver.io')
browser.on('dialog', async (dialog) => {
    console.log(dialog.message()) // outputs: "Hello Dialog"
    await dialog.dismiss()
})

await browser.execute(() => alert('Hello Dialog'))
```

:::note

Dialogs are dismissed automatically, unless there is at least one `browser.on('dialog')` or `browser.once('dialog')` listener. When a listener is present, it must either [`dialog.accept()`](/docs/api/dialog/accept) or [`dialog.dismiss()`](/docs/api/dialog/dismiss) the dialog - otherwise the page will freeze waiting for the dialog, and actions like click will never finish.

:::

:::info Mobile native dialogs

Browser dialog events are not emitted for native iOS/Android permission dialogs. Handle those with [`browser.acceptDialog`](/docs/api/mobile/acceptDialog) and [`browser.dismissDialog`](/docs/api/mobile/dismissDialog) instead.

:::
