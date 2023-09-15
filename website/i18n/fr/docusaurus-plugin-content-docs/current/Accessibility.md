---
id: accessibility
title: Tests d'accessibilité
---

Vous pouvez inclure les tests d'accessibilité dans votre suite de tests WebdriverIO en utilisant les outils d'accessibilité open source [de Deque appelé Axe](https://www.deque.com/axe/). L'installation est très facile, tout ce que vous avez à faire est d'installer l'adaptateur WebdriverIO Axe via :

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

L'adaptateur Axe peut être utilisé soit en mode [autonome ou testrunner](/docs/setuptypes) en important simplement et en l'initialisant avec l'objet [navigateur](/docs/api/browser), par exemple.:

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

Vous pouvez trouver plus de documentation sur l'adaptateur Axe WebdriverIO [sur GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage).
