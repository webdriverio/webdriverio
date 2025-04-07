---
id: axe-core
title: Axe Core
---

Você pode incluir testes de acessibilidade em seu conjunto de testes WebdriverIO usando as ferramentas de acessibilidade de código aberto [da Deque chamadas Axe](https://www.deque.com/axe/). A configuração é muito fácil, tudo o que você precisa fazer é instalar o adaptador WebdriverIO Axe via:

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

O adaptador Axe pode ser usado no modo [autônomo ou testrunner](/docs/setuptypes), simplesmente importando-o e inicializando-o com o [objeto do navegador](/docs/api/browser), por exemplo:

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

Você pode encontrar mais documentação sobre o adaptador Axe WebdriverIO [no GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage).
