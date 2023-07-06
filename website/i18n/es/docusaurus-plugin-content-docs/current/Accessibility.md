---
id: accessibility
title: Pruebas de accesibilidad
---

Puede incluir pruebas de accesibilidad en su suite de pruebas WebdriverIO usando las herramientas de accesibilidad de código abierto [de Deque llamado Axe](https://www.deque.com/axe/). La configuración es muy sencilla, todo lo que necesita hacer es instalar el adaptador WebdriverIO Axe vía:

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

El adaptador de hacha se puede usar en modo [independiente o](/docs/setuptypes) testrunner simplemente importándolo e inicializándolo con el [objeto del navegador](/docs/api/browser), e.g:

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

Puede encontrar más documentación en el adaptador de Axe WebdriverIO [en GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage).
