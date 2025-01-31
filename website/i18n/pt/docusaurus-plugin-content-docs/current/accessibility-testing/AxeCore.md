---
id: axe-core
title: Axe Core
---

You can include accessibility tests within your WebdriverIO test suite using the open-source accessibility tools [from Deque called Axe](https://www.deque.com/axe/). A configuração é muito fácil, tudo o que você precisa fazer é instalar o adaptador de WebdriverIO Axe via:

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

The Axe adapter can be used either in [standalone or testrunner](/docs/setuptypes) mode by simply importing and initializing it with the [browser object](/docs/api/browser), e.g.:

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

Você pode encontrar mais documentação sobre o adaptador de WebdriverIO Axe [no GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage).
