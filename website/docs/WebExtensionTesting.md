---
id: web-extension-testing
title: Web Extension Testing
---

WebdriverIO is the ideal tool to automate a browser. Web Extensions are a part of the browser and can be automated in the same way. Whenever your web extension uses content scripts to run JavaScript on websites or offer a popup modal, you can run an e2e test for that using WebdriverIO.

## Loading a Web Extension into the Browser

As a first step we have to load the extension under test into the browser as part of our session. This works differently for Chrome and Firefox.

:::info

These docs leave out Safari web extensions as their support for it is way behind and user demand not high. If you are building a web extension for Safari, please [raise an issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) and collaborate on including it here as well.

:::

### Chrome

Loading a web extension in Chrome can be done through providing a `base64` encoded string of the `crx` file or by providing a path to the web extension folder. The easiest is just to do the latter by defining your Chrome capaiblities as following:

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
        const browserName = (capabilities as Capabilities.Capabilities).browserName
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
