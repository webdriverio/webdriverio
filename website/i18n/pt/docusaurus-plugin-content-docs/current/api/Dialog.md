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

Dialogs are dismissed automatically, unless there is a `browser.on('dialog')` listener. Quando o ouvinte estiver presente, ele deve [`dialog.accept()`](/docs/api/dialog/accept) ou [`dialog.dismiss()`](/docs/api/dialog/dismiss) o diálogo - caso contrário, a página congelará esperando o diálogo, e ações como clicar nunca serão concluídas.

:::
