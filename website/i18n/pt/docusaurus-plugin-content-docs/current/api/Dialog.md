---
id: dialog
title: dialog
---

Objetos de diálogo são despachados por [`browser`](/docs/api/browser) por meio do evento `browser.on('dialog')`.

Um exemplo de uso do objeto Dialog:

```ts
import { browser } from '@wdio/globals'

await browser.url('https://webdriver.io')
browser.on('dialog', async (dialog) => {
    console.log(dialog.message()) // saida: "Hello Dialog"
    await dialog.dismiss()
})

await browser.execute(() => alert('Hello Dialog'))
```

:::note

Os diálogos são descartados automaticamente, a menos que haja um ouvinte `browser.on('dialog')`. Quando o ouvinte estiver presente, ele deve [`dialog.accept()`](/docs/api/dialog/accept) ou [`dialog.dismiss()`](/docs/api/dialog/dismiss) o diálogo - caso contrário, a página congelará esperando o diálogo, e ações como clicar nunca serão concluídas.

:::
