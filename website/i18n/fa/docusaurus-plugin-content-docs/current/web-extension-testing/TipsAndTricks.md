---
id: tips-and-tricks
title: نکات و ترفندها
---

این صفحه حاوی مجموعه ای از نکات و ترفندهای مفید است که می تواند هنگام تست یک افزونه وب مفید باشد.

## Popup Modal را در کروم تست کنید

اگر یک ورودی عمل مرورگر `default_popup` را در [extension manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) خود تعریف کنید می توانید آن صفحه HTML را مستقیماً آزمایش کنید، زیرا کلیک بر روی نماد افزودنی در نوار بالای مرورگر کار نمی کند. در عوض، باید فایل html پاپ آپ را مستقیماً باز کنید.

در Chrome این کار با بازیابی شناسه افزودنی و باز کردن صفحه بازشو از طریق `browser.url('...')` کار می کند. رفتار در آن صفحه همانند رفتار در پاپ آپ خواهد بود. برای انجام این کار توصیه می کنیم دستور سفارشی زیر را بنویسید:

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

اکنون، در تست خود، می توانید از طریق زیر به popup دسترسی داشته باشید:

```ts
await browser.openExtensionPopup('My Web Extension')
```
