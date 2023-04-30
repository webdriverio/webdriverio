---
id: tips-and-tricks
title: Поради та хитрощі
---

Ця сторінка містить набір корисних порад та хитрощів, які можуть бути корисними під час тестування веброзширень.

## Тестування модального виринаючого вікна в Chrome

Якщо ви призначите `default_popup` дію у `browser_action` секції [маніфесту розширення](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action), ви зможете перевірити цю HTML-сторінку безпосередньо, оскільки натискання іконки розширення у верхній панелі браузера не працюватиме. Замість цього вам буде потрібно безпосередньо відкрити html файл виринаючого вікна розширення.

У Chrome це працює шляхом отримання ідентифікатора розширення та відкриття сторінки виринаючого вікна за допомогою `browser.url('...')`. Поведінка цієї сторінки буде такою ж, як і виринаючого вікна. Для цього ми рекомендуємо додати наступну користувацьку команду:

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

У вашому `wdio.conf.js` ви можете імпортувати цей файл і зареєструвати спеціальну команду у хуку `before`, наприклад:

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

Тепер у вашому тесті ви можете отримати доступ до сторінки виринаючого вікна розширення за допомогою:

```ts
await browser.openExtensionPopup('My Web Extension')
```
