---
id: web-extensions
title: Testen von Browser-Erweiterungen
---

WebdriverIO ist das ideale Werkzeug, um einen Browser zu automatisieren. Web Extensions sind ein Teil des Browsers und können auf die gleiche Weise automatisiert werden. Wann immer Ihre Weberweiterung Content-Scripts verwendet, um JavaScript auf Websites auszuführen oder ein Popup-Modal anzubieten, können Sie mit WebdriverIO einen e2e-Test dafür ausführen.

## Loading a Web Extension into the Browser

Als ersten Schritt müssen wir die zu testende Erweiterung im Rahmen unserer Test-Session in den Browser laden. Dies funktioniert bei Chrome und Firefox unterschiedlich.

:::info

Diese Dokumentation lässt Safari-Weberweiterungen aus, da ihre Unterstützung weit hinterherhinkt und die Benutzernachfrage nicht hoch ist. Wenn Sie eine Weberweiterung für Safari erstellen, melden Sie bitte [ihren Anwendungsfall](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) und helfen Sie uns, die notwendige Dokumentation dafür zu Erstellen.

:::

### Chrome

Das Laden einer Web-Extension in Chrome kann durch Bereitstellen einer `base64` -codierten Zeichenfolge der `crx` Datei oder durch Bereitstellen eines Pfads zur Web-Extension erfolgen. Am einfachsten ist es, letzteres zu tun, indem Sie Ihre Chrome-Funktionen wie folgt definieren:

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

Wenn Sie einen anderen Browser als Chrome automatisieren, z. B. Brave, Edge oder Opera, besteht die Möglichkeit, dass die Browseroption mit dem obigen Beispiel funktioniert, indem Sie einfach einen anderen Capability-Namen verwenden, z. B. `ms:edgeOptions`.

:::

Wenn Sie Ihre Erweiterung als `.crx` -Datei kompilieren, indem Sie z. B. das [crx](https://www.npmjs.com/package/crx) NPM-Paket verwenden, können Sie die gebündelte Erweiterung auch einfügen über:

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

Um ein Firefox-Profil zu erstellen, das Erweiterungen enthält, können Sie WebdriverIOs [Firefox-Profile Service](/docs/firefox-profile-service) verwenden, um Ihre Sitzung entsprechend einzurichten. Es können jedoch Probleme auftreten, bei denen Ihre lokal entwickelte Erweiterung aufgrund von Signaturproblemen nicht geladen werden kann. In diesem Fall können Sie auch eine Erweiterung in Ihrer Hook `before` über den Befehl [`installAddOn`](/docs/api/gecko#installaddon) laden, z.

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

Um eine `.xpi` Datei zu generieren, wird empfohlen, das [`web-ext`](https://www.npmjs.com/package/web-ext) NPM Paket zu verwenden. Sie können Ihre Erweiterung mit dem folgenden Beispielbefehl bündeln:

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
