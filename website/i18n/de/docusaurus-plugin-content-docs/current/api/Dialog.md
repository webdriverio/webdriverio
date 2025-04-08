---
id: dialog
title: Das Dialog-Objekt
---

Dialog-Objekte werden von [`browser`](/docs/api/browser) über das `browser.on('dialog')`-Event ausgelöst.

Ein Beispiel für die Verwendung des Dialog-Objekts:

```ts
import { browser } from '@wdio/globals'

await browser.url('https://webdriver.io')
browser.on('dialog', async (dialog) => {
    console.log(dialog.message()) // Ausgabe: "Hello Dialog"
    await dialog.dismiss()
})

await browser.execute(() => alert('Hello Dialog'))
```

:::note

Dialoge werden automatisch geschlossen, es sei denn, es gibt einen `browser.on('dialog')`-Listener. Wenn ein Listener vorhanden ist, muss dieser entweder [`dialog.accept()`](/docs/api/dialog/accept) oder [`dialog.dismiss()`](/docs/api/dialog/dismiss) auf den Dialog aufrufen - andernfalls wird die Seite einfrieren, während sie auf den Dialog wartet, und Aktionen wie Klicks werden nie abgeschlossen.

:::
