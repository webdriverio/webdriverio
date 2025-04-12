---
id: axe-core
title: Axe Core
---

You can include accessibility tests within your WebdriverIO test suite using the open-source accessibility tools [from Deque called Axe](https://www.deque.com/axe/). The setup is very easy, all you need to do is to install the WebdriverIO Axe adapter via:

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

Адаптер Axe можна використовувати або в [автономному чи testrunner](/docs/setuptypes) режимах, просто імпортувавши та ініціалізувавши його за допомогою [об’єкта браузера](/docs/api/browser), як показано тут:

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

Додаткову документацію про адаптер Axe для WebdriverIO можна знайти [на GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage).
