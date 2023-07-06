---
id: accessibility
title: Тестування доступності
---

Ви можете включити тести доступності до свого набору тестів із WebdriverIO за допомогою інструментів доступності з відкритим кодом [від Deque під назвою Axe](https://www.deque.com/axe/). Налаштування дуже просте, все, що вам потрібно зробити, це встановити адаптер WebdriverIO Axe за допомогою команди:

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
