---
id: web-extension-testing
title: Тестування веброзширень
---

WebdriverIO — ідеальний інструмент для автоматизації браузера. Веброзширення є частиною браузера і можуть бути автоматизовані таким же чином. Незалежно від того, чи ваше веброзширення запускає JavaScript на відкритих вебсайтах, чи відкриває власне виринаюче вікно, ви можете створити для цього e2e тест за допомогою WebdriverIO.

## Завантаження веброзширення в браузер

Для початку нам потрібно завантажити розширення, яке будемо тестувати, у браузер під час початку сесії. Це відбуватиметься по-різному для Chrome і Firefox.

:::info

У цьому документі не згадуються веброзширення для Safari, оскільки їхня реалізація значно відстає від стандартів, а попит користувачів невисокий. Якщо ви створюєте веброзширення для Safari, будь ласка [створіть issue у GitHub](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) і допоможіть нам додати підтримку у WebdriverIO.

:::

### Chrome

Завантажити веброзширення в Chrome можна, вказавши вміст скомпільованого `.crx` файлу, як рядок у `base64` форматі, або вказавши шлях до теки із веброзширенням. Найпростіше буде зробити останнє, визначивши ваші параметри Chrome таким чином:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            // given your wdio.conf.js is in the root directory and your compiled
            // web extension files are located in the `./dist` folder
            args: [`--load-extension=${path.join(__dirname, '..', '..', 'dist')}`]
        }
    }]
}
```

:::info

Якщо ви автоматизуєте інший вебпереглядач, ніж Chrome, наприклад, Brave, Edge або Opera, є ймовірність, що опція буде збігатися із наведеним вище прикладом, просто використайте назву для параметра відповідно для браузера параметрів, наприклад `ms:edgeOptions` для Edge.

:::

Якщо ви скомпілюєте своє розширення як файл `.crx`, використовуючи, наприклад, NPM пакунок [crx](https://www.npmjs.com/package/crx), ви також можете додати розширення за допомогою наступних параметрів:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extPath = path.join(__dirname, `web-extension-chrome.crx`)
const chromeExtension = (await fs.readFile(extPath)).toString('base64')

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            extensions: [chromeExtension]
        }
    }]
}
```

### Firefox

Щоб створити профіль Firefox із розширеннями, ви можете скористатися [Службою профілів Firefox](/docs/firefox-profile-service), щоб налаштувати відповідно налаштувати сесію. Однак у вас можуть виникнути проблема, що ваше локально розроблене розширення не може бути встановлено через проблеми із підписом. У цьому випадку ви можете встановити розширення за допомогою хуку `before` використовуючи команду [`installAddOn`](/docs/api/gecko#installaddon), наприклад:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extensionPath = path.resolve(__dirname, `web-extension.xpi`)

export const config = {
    // ...
    before: async (capabilities) => {
        const browserName = (capabilities as Capabilities.Capabilities).browserName
        if (browserName === 'firefox') {
            const extension = await fs.readFile(extensionPath)
            await browser.installAddOn(extension.toString('base64'), true)
        }
    }
}
```

Щоб створити файл `.xpi`, рекомендується використовувати NPM пакунок [`web-ext`](https://www.npmjs.com/package/web-ext). Ви можете зібрати своє розширення за допомогою такої команди:

```sh
npx web-ext build -s dist/ -a . -n web-extension-firefox.xpi
```
