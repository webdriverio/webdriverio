---
id: tips-and-tricks
title: Tipps und Tricks
---

Diese Seite enthält eine Reihe nützlicher Tipps und Tricks, die beim Testen eines Browser Plugin hilfreich sein können.

## Testen des Popup-Modal in Chrome

Wenn Sie in Ihrem [Erweiterungsmanifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) einen Browseraktionseintrag `default_popup` definieren, können Sie diese HTML-Seite direkt testen, da das Klicken auf das Erweiterungssymbol in der oberen Leiste des Browsers nicht funktioniert. Stattdessen müssen Sie die Popup-HTML-Datei direkt öffnen.

In Chrome funktioniert dies, indem die Erweiterungs-ID abgerufen und die Popup-Seite über `browser.url('...')`geöffnet wird. Das Verhalten auf dieser Seite ist das gleiche wie im Popup. Dazu empfehlen wir, den folgenden benutzerdefinierten Befehl zu schreiben:

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

In Ihre `wdio.conf.js` können Sie diese Datei importieren und den benutzerdefinierten Befehl in Ihrem `before` Hook registrieren, z.B.:

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

Jetzt können Sie in Ihrem Test auf die Popup-Seite zugreifen über:

```ts
await browser.openExtensionPopup('My Web Extension')
```
