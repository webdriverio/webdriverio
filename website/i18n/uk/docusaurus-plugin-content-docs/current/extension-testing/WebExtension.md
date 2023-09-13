---
id: web-extensions
title: Тестування веброзширень
---

WebdriverIO — ідеальний інструмент для автоматизації браузера. Веброзширення є частиною браузера і можуть бути автоматизовані таким же чином. Незалежно від того, чи ваше веброзширення запускає JavaScript на відкритих вебсайтах, чи відкриває власне виринаюче вікно, ви можете створити для цього e2e тест за допомогою WebdriverIO.

## Loading a Web Extension into the Browser

Для початку нам потрібно завантажити розширення, яке будемо тестувати, у браузер під час початку сесії. Це відбуватиметься по-різному для Chrome і Firefox.

:::info

У цьому документі не згадуються веброзширення для Safari, оскільки їхня реалізація значно відстає від стандартів, а попит користувачів невисокий. Якщо ви створюєте веброзширення для Safari, будь ласка [створіть issue у GitHub](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) і допоможіть нам додати підтримку у WebdriverIO.

:::

### Chrome

Завантажити веброзширення в Chrome можна, вказавши вміст скомпільованого `.crx` файлу, як рядок у `base64` форматі, або вказавши шлях до теки із веброзширенням. The easiest is just to do the latter by defining your Chrome capabilities as following:

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

## Tips & Tricks

The following section contains a set useful tips and tricks that can be helpful when testing a web extension.

### Test Popup Modal in Chrome

If you define a `default_popup` browser action entry in your [extension manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) you can test that HTML page directly, since clicking on the extension icon in the browser top bar won't work. Instead, you have to open the popup html file directly.

In Chrome this works by retrieving the extension ID and opening the popup page through `browser.url('...')`. The behavior on that page will be the same as within the popup. To do so we recommend to write the following custom command:

```ts customCommand.ts
export async function openExtensionPopup (this: WebdriverIO.Browser, extensionName: string, popupUrl = 'index.html') {
  if ((this.capabilities as Capabilities.Capabilities).browserName !== 'chrome') {
    throw new Error('This command only works with Chrome')
  }
  await this.url('chrome://extensions/')

  const extensions = await this.$$('>>> extensions-item')
  const extension = await extensions.find(async (ext) => (
    await ext.$('#name').getText()) === extensionName
  )

  if (!extension) {
    const installedExtensions = await extensions.map((ext) => ext.$('#name').getText())
    throw new Error(`Couldn't find extension "${extensionName}", available installed extensions are "${installedExtensions.join('", "')}"`)
  }

  const extId = await extension.getAttribute('id')
  await this.url(`chrome-extension://${extId}/popup/${popupUrl}`)
}

declare global {
  namespace WebdriverIO {
      interface Browser {
        openExtensionPopup: typeof openExtensionPopup
      }
  }
}
```

In your `wdio.conf.js` you can import this file and register the custom command in your `before` hook, e.g.:

```ts wdio.conf.ts
import type { Options } from '@wdio/testrunner'
import { browser } from '@wdio/globals'

import { openExtensionPopup } from './support/customCommands'

export const config: Options.Testrunner = {
  // ...
  before: () => {
    browser.addCommand('openExtensionPopup', openExtensionPopup)
  }
}
```

Now, in your test, you can access the popup page via:

```ts
await browser.openExtensionPopup('My Web Extension')
```
