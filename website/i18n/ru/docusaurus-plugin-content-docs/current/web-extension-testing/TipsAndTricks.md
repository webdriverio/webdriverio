---
id: tips-and-tricks
title: Советы
---

Эта страница содержит набор полезных советов и приемов, которые могут быть полезны при тестировании веб-расширения.

## Тестировать всплывающие окна в Chrome

Если вы определите запись действия браузера `default_popup` в своем манифесте [расширения](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action), вы можете напрямую протестировать эту HTML-страницу, поскольку щелчок по значку расширения в верхней панели браузера не будет работать. Вместо этого вам нужно открыть popup Html-файл напрямую.

В Chrome это работает путем получения ID расширения и открытия всплывающей(popup) страницы через `browser.url('...')`. Поведение на этой странице будет таким же, как и во всплывающем окне. Для этого мы рекомендуем написать следующую пользовательскую команду:

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

В своем `wdio.conf.js` вы можете импортировать этот файл и зарегистрировать пользовательскую команду в своем хуке `before`, например.:

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

Теперь в вашем тесте вы можете получить доступ к всплывающей странице через:

```ts
await browser.openExtensionPopup('My Web Extension')
```
