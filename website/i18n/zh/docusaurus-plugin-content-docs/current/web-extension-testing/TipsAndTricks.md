---
id: tips-and-tricks
title: Tips and Tricks
---

This page contains a set useful tips and tricks that can be helpful when testing a web extension.

## Test Popup Modal in Chrome

If you define a `default_popup` browser action entry in your [extension manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) you can test that HTML page directly, since clicking on the extension icon in the browser top bar won't work. Instead, you have to open the popup html file directly. Instead, you have to open the popup html file directly.

In Chrome this works by retrieving the extension ID and opening the popup page through `browser.url('...')`. The behavior on that page will be the same as within the popup. To do so we recommend to write the following custom command: The behavior on that page will be the same as within the popup. To do so we recommend to write the following custom command:

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
