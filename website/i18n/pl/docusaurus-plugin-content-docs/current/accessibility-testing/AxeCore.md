---
id: axe-core
title: Axe Core
---

Możesz dodać testy dostępności (accessibility) do zestawu testowego WebdriverIO przy pomocy open-source'owych narzędzi związanych z dostępnością [o nazwie Axe od firmy Deque](https://www.deque.com/axe/). Konfiguracja jest bardzo łatwa, wystarczy zainstalować adapter WebdriverIO Axe za pomocą poniższego polecenia:

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

Adapter Axe może być użyty w obu trybach: [standalone i testrunner](/docs/setuptypes), dzięki opcji importu i inicjalizacji wraz z [obiektem przeglądarki (browser)](/docs/api/browser), np.:

```ts
import { browser } from '@wdio/globals'
import AxeBuilder from '@axe-core/webdriverio'

describe('Accessibility Test', () => {
    it('should get the accessibility results from a page', async () => {
        const builder = new AxeBuilder({ client: browser })

        await browser.url('https://testingbot.com')
        const result = await builder.analyze()
        console.log('Acessibility Results:', result)
    })
})
```

Więcej dokumentacji można znaleźć na stronie adaptera Axe dla WebdiverIO [na GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage).
