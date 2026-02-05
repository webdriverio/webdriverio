---
id: web-extensions
title: Web Extension Testing
---

WebdriverIO is the ideal tool to automate a browser. Web Extensions are a part of the browser and can be automated in the same way. Whenever your web extension uses content scripts to run JavaScript on websites or offer a popup modal, you can run an e2e test for that using WebdriverIO.

## Loading a Web Extension into the Browser

As a first step we have to load the extension under test into the browser as part of our session. This works differently for Chrome and Firefox.

:::info

These docs leave out Safari web extensions as their support for it is way behind and user demand not high. If you are building a web extension for Safari, please [raise an issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) and collaborate on including it here as well.

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

## Tips & Tricks

The following section contains a set useful tips and tricks that can be helpful when testing a web extension.

### Test Popup Modal

If you define a `default_popup` browser action entry in your [extension manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) you can test that HTML page directly, since clicking on the extension icon in the browser top bar won't work. Instead, you have to open the popup html file directly.

In Chrome and Firefox this works by retrieving the extension ID and opening the popup page through `browser.url('...')`. The behavior on that page will be the same as within the popup. To do so we recommend to write the following custom command:

### Chrome

```ts customCommand.ts
export async function openExtensionPopupChrome (this: WebdriverIO.Browser, extensionName: string, popupUrl = 'index.html') {
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
        openExtensionPopupChrome: typeof openExtensionPopupChrome
      }
  }
}
```

In your `wdio.conf.js` you can import this file and register the custom command in your `before` hook, e.g.:

```ts wdio.conf.ts
import { browser } from '@wdio/globals'

import { openExtensionPopupChrome } from './support/customCommands'

export const config: WebdriverIO.Config = {
  // ...
  before: () => {
    browser.addCommand('openExtensionPopupChrome', openExtensionPopupChrome)
  }
}
```

Now, in your test, you can access the popup page via:

```js
await browser.openExtensionPopupChrome('My Web Extension')
```

### Firefox

```js customCommand.js
export async function openExtensionPopupFirefox (extensionName, popupUrl = 'index.html') {
  if (this.capabilities.browserName !== 'firefox') {
    throw new Error('This command only works with Firefox')
  }
  await this.url('about:debugging#/runtime/this-firefox')

	const temporaryExtensionElements = await browser.$('.qa-debug-target-pane .qa-debug-target-list').$$('li');

	let extensionId;
	for (let index = 0; !extensionId && index < temporaryExtensionElements.length; index++) {
		const currentTemporaryExtensionNameElement = await temporaryExtensionElements[index].$('.debug-target-item__name');
		if (await currentTemporaryExtensionNameElement.getText() === extensionName) {
			const currentTemporaryExtensionIdElement =  await temporaryExtensionElements[index].$('dl').$$('.fieldpair .fieldpair__description')[2];
			extensionId = await currentTemporaryExtensionIdElement.getText();
		}
	}

  if (!extensionId) {
    throw new Error(`Couldn't find extension "${extensionName}"`)
  }

  await this.url(`moz-extension://${extensionId}/popup/${popupUrl}`)
}
```

In your `wdio.conf.js` you can import this file and register the custom command in your `before` hook, e.g.:

```js wdio.conf.js
import { browser } from '@wdio/globals'

import { openExtensionPopupFirefox } from './support/customCommands'

export const config = {
  // ...
  before: () => {
    browser.addCommand('openExtensionPopupFirefox', openExtensionPopupFirefox)
  }
}
```

Now, in your test, you can access the popup page via:

```js
await browser.openExtensionPopupFirefox('My Web Extension')
```

### Full Example For Chrome And Firefox

NPM packages used:

- @wdio/cli
- @wdio/local-runner
- @wdio/mocha-framework
- web-ext

Configuration example with helper functions:

```js wdio.conf.js
import { readFileSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const EXTENSION_NAME = 'webdriverio-browser-extension';

export const config = {
	capabilities: [
		{
			browserName: 'firefox',
		},
		{
			browserName: 'chromium',
			'goog:chromeOptions': {
				args: ['--load-extension=./src/'],
			},
		},
	],

	//Needed for chromium
	maxInstances: 1,

	specs: ['./tests/*.js'],

	framework: 'mocha',

	onPrepare: function() {
		extensionCreateFirefox();
	},

	before: async function() {
		await extensionLoadFirefox();

		browser.addCommand('extensionGetId', extensionGetId);
		browser.addCommand('extensionURL', extensionURL);
	},

	onComplete: function() {
		extensionDeleteFirefox();
	}
};

//Create Firefox extension xpi file using web-ext
function extensionCreateFirefox() {
	execSync(`npx web-ext build -s ./src/ -a ${tmpdir()} -n ${EXTENSION_NAME}.xpi`);
}

async function extensionLoadFirefox() {
	if (browser.capabilities.browserName === 'firefox') {
		await browser.installAddOn(readFileSync(`${tmpdir()}/${EXTENSION_NAME}.xpi`).toString('base64'), true);
	}
}

async function extensionGetId(extensionName) {
	if (browser.capabilities.browserName === 'firefox') {
		return await extensionGetIdFirefox(extensionName)
	}

	return await extensionGetIdChromium(extensionName);
}

async function extensionGetIdFirefox(extensionName) {
	await browser.url('about:debugging#/runtime/this-firefox');

	const temporaryExtensionElements = await browser.$('.qa-debug-target-pane .qa-debug-target-list').$$('li');

	let extensionId;
	for (let index = 0; !extensionId && index < temporaryExtensionElements.length; index++) {
		const currentTemporaryExtensionNameElement = await temporaryExtensionElements[index].$('.debug-target-item__name');
		if (await currentTemporaryExtensionNameElement.getText() === extensionName) {
			const currentTemporaryExtensionIdElement =  await temporaryExtensionElements[index].$('dl').$$('.fieldpair .fieldpair__description')[2];
			extensionId = await currentTemporaryExtensionIdElement.getText();
		}
	}

	return extensionId;
}

async function extensionGetIdChromium(extensionName) {
	await browser.url('chrome://extensions/');

	const extensionElements = await browser.$$('extensions-item');
	const extensionElement = await extensionElements.find(async (currentExtensionElement) => (
		await currentExtensionElement.$('#name').getText()) === extensionName
	)

	return await extensionElement.getAttribute('id');
}

async function extensionURL(extensionId, url) {
	if (browser.capabilities.browserName === 'firefox') {
		return await extensionURLFirefox(extensionId, url)
	}

	return await extensionURLChromium(extensionId, url);
}

async function extensionURLFirefox(extensionId, url) {
	return await browser.url(`moz-extension://${extensionId}/${url}`);
}

async function extensionURLChromium(extensionId, url) {
	return await browser.url(`chrome-extension://${extensionId}/${url}`);
}

//Delete Firefox extension xpi file
function extensionDeleteFirefox() {
	rmSync(`${tmpdir()}/${EXTENSION_NAME}.xpi`);
}
```

Extension code example `src/manifest.json` and `src/my-page.html`:

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0"
}
```

```html src/my-page.html
<h1>Hello World</h1>
```

Test example `tests/my-test.js`:

```js
it('My Test', async () => {
	const EXTENSION_ID = await browser.extensionGetId('My Extension')

	await browser.extensionURL(EXTENSION_ID, 'my-page.html')

	await browser.pause(3000);
});
```
