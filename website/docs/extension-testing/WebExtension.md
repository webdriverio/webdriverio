---
id: web-extensions
title: Web Extension Testing
description: "Load a web extension into Chrome or Firefox for a WebdriverIO session, including a mid-session BiDi install and uninstall."
---

WebdriverIO is the ideal tool to automate a browser. Web Extensions are a part of the browser and can be automated in the same way. Whenever your web extension uses content scripts to run JavaScript on websites or offer a popup modal, you can run an e2e test for that using WebdriverIO.

Load the extension before the first navigation with the capability setup below. To install and remove one in the middle of a [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/#module-webExtension) session, use [`installExtension`](/docs/api/browser/installExtension) and [`uninstallExtension`](/docs/api/browser/uninstallExtension).

## Loading a Web Extension into the Browser

As a first step we have to load the extension under test into the browser as part of our session. This works differently for Chrome and Firefox.

:::info

These docs leave out Safari web extensions as their support for it is way behind and user demand not high. Safari also has no WebDriver BiDi session, so [`installExtension`](/docs/api/browser/installExtension) does not cover Safari. If you are building a web extension for Safari, please [raise an issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) and collaborate on including it here as well.

:::

### Chrome

Loading a web extension in Chrome can be done through providing a `base64` encoded string of the `crx` file or by providing a path to the web extension folder. The easiest is just to do the latter by defining your Chrome capabilities as following:

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

If you automate a different browser than Chrome, e.g. Brave, Edge or Opera, chances are that the browser option match with the example above, just using a different capability name, e.g. `ms:edgeOptions`.

:::

If you compile your extension as `.crx` file using e.g. the [crx](https://www.npmjs.com/package/crx) NPM package, you can also inject the bundled extension via:

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

To create a Firefox profile that includes extensions you can use the [Firefox Profile Service](/docs/firefox-profile-service) to set up your session accordingly. However you might run into issues where your local developed extension can't be loaded due to signing issues. In this case you can also load an extension in the `before` hook via the [`installAddOn`](/docs/api/gecko#installaddon) command, e.g.:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extensionPath = path.resolve(__dirname, `web-extension.xpi`)

export const config = {
    // ...
    before: async (capabilities) => {
        const browserName = (capabilities as WebdriverIO.Capabilities).browserName
        if (browserName === 'firefox') {
            const extension = await fs.readFile(extensionPath)
            await browser.installAddOn(extension.toString('base64'), true)
        }
    }
}
```

In order to generate an `.xpi` file, it is recommended to use the [`web-ext`](https://www.npmjs.com/package/web-ext) NPM package. You can bundle your extension using the following example command:

```sh
npx web-ext build -s dist/ -a . -n web-extension-firefox.xpi
```

## Install an extension during the session

Since v10, [`browser.installExtension`](/docs/api/browser/installExtension) and [`browser.uninstallExtension`](/docs/api/browser/uninstallExtension) install a web extension in the middle of a WebDriver BiDi session and return its id. Use them when the extension must not be present at launch, or when the same test installs it, exercises it, and removes it.

The capability setup and `installAddOn` above stay the way to load an extension before the first navigation. `installExtension` does not replace them. `browser.webExtensionInstall` and `browser.webExtensionUninstall` stay available when you want the [spec payload](https://w3c.github.io/webdriver-bidi/#command-webExtension-install) yourself.

```ts title="test/specs/extension.e2e.ts"
import path from 'node:path'
import url from 'node:url'
import { browser, expect } from '@wdio/globals'

const extensionPath = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    '../../dist'
)

describe('web extension', () => {
    it('installs and removes the extension', async () => {
        const extensionId = await browser.installExtension(extensionPath)
        expect(extensionId).not.toEqual('')

        await browser.url('https://webdriver.io')
        await browser.uninstallExtension(extensionId)
    })
})
```

`installExtension` accepts three inputs:

| Input | Payload sent to the browser |
| --- | --- |
| A directory path | `{ type: 'path', path }` after `path.resolve`. The browser has to be able to read that directory. |
| A `.zip`, `.xpi`, or `.crx` path | `{ type: 'archivePath', path }` after `path.resolve`. |
| `{ base64: string }` | `{ type: 'base64', value }`. Archive bytes. Any other object is rejected. |

A string path is always resolved on the test runner. On a remote session — a hostname other than `localhost`, `127.0.0.1`, or `::1`, or a cloud `user` and `key` — that path is not a path on the browser machine. The command reads an archive, or zips a directory in memory, and sends `base64`. You do not branch on local versus remote yourself. Local sessions send `path` or `archivePath` and do not read the bytes.

Point a directory at the extension root, the folder that contains `manifest.json`.

The session has to speak WebDriver BiDi. A classic session throws `installExtension requires a WebDriver BiDi session (webExtension.install)`. A browser that implements BiDi but not this module fails the command with `unsupported operation` (or `unknown command` when the module is absent). A bad archive fails with `invalid web extension`. Uninstalling an id the browser does not know fails with `no such web extension`.

`uninstallExtension` takes the id string `installExtension` returned.

### Chromium

Chrome and Edge implement `webExtension.install` and leave it switched off until you start the browser with `--enable-unsafe-extension-debugging` and `--remote-debugging-pipe`. Chrome 136 and newer also require `--user-data-dir` whenever `--remote-debugging-pipe` is set. Without those arguments the command fails with `unknown error - Method not available`.

`--remote-debugging-pipe` is the pipe between the driver and the browser. The BiDi session still uses `webSocketUrl`.

```ts title="wdio.conf.ts"
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-chrome-'))

export const config: WebdriverIO.Config = {
    // ...
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--enable-unsafe-extension-debugging',
                '--remote-debugging-pipe',
                `--user-data-dir=${userDataDir}`
            ]
        }
    }]
}
```

Use `ms:edgeOptions` for Edge. Firefox loads the extension in a normal BiDi session and does not need these arguments.

## Tips & Tricks

The following section contains a set useful tips and tricks that can be helpful when testing a web extension.

### Test Popup Modal in Chrome

If you define a `default_popup` browser action entry in your [extension manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) you can test that HTML page directly, since clicking on the extension icon in the browser top bar won't work. Instead, you have to open the popup html file directly.

In Chrome this works by retrieving the extension ID and opening the popup page through `browser.url('...')`. The behavior on that page will be the same as within the popup. To do so we recommend to write the following custom command:

```ts customCommand.ts
export async function openExtensionPopup (this: WebdriverIO.Browser, extensionName: string, popupUrl = 'index.html') {
  if ((this.capabilities as WebdriverIO.Capabilities).browserName !== 'chrome') {
    throw new Error('This command only works with Chrome')
  }
  await this.url('chrome://extensions/')

  const extensions = await this.$$('extensions-item')
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
import { browser } from '@wdio/globals'

import { openExtensionPopup } from './support/customCommands'

export const config: WebdriverIO.Config = {
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
