---
id: axe-core
title: Axe Core
---

Sie können Barrierefreiheitstests in Ihre WebdriverIO-Testsuite mithilfe der Open-Source-Barrierefreiheitstools [von Deque namens Axe](https://www.deque.com/axe/) einbinden. Die Einrichtung ist sehr einfach, alles was Sie tun müssen, ist den WebdriverIO Axe-Adapter über folgenden Befehl zu installieren:

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

Der Axe-Adapter kann entweder im [Standalone- oder im Testrunner](/docs/setuptypes) Modus verwendet werden, indem er einfach importiert und mit dem [Browser-Objekt](/docs/api/browser) initialisiert wird, z.B.:

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

Weitere Dokumentation zum Axe WebdriverIO-Adapter [finden Sie auf GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage).
