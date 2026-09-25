---
id: apps-and-extensions
title: Extensions & Editors
description: Load a browser extension or a VS Code extension into a WebdriverIO session and test it end to end.
---

WebdriverIO tests browser extensions and editor extensions by loading them into the real host application. Browser (web) extensions run inside Chrome or Firefox. You load them through browser capabilities: `--load-extension` or a base64 `.crx` via `goog:chromeOptions` in Chrome, or `browser.installAddOn()` for an `.xpi` in Firefox. From there, you test content scripts and popup pages with the normal WebDriver commands. VS Code extensions are tested with the community [`wdio-vscode-service`](/docs/wdio-vscode-service). It downloads VS Code (stable, insiders or a specific version) and the matching Chromedriver, then starts VS Code with your extension and custom user settings. Page objects for the workbench are available through `browser.getWorkbench()`, and `browser.executeWorkbench()` runs code against the VS Code API. The same service can also serve VS Code in a browser to test web extensions. Obsidian plugins have a community service too.

## Quick start

Install the testrunner and TypeScript support first:

```sh
npm install --save-dev @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter tsx
```

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

### Chrome extension

Build your extension into a folder (here `./dist`) and load it with the `--load-extension` Chrome argument:

```ts title="wdio.conf.ts"
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: ['./test/specs/**/*.ts'],
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [`--load-extension=${path.join(__dirname, 'dist')}`]
        }
    }],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
```

```ts title="test/specs/extension.e2e.ts"
import { expect, browser, $ } from '@wdio/globals'

describe('My Web Extension', () => {
    it('should inject its content script', async () => {
        await browser.url('https://webdriver.io')
        // replace with an element your content script adds to the page
        await expect($('#my-extension-root')).toBeExisting()
    })
})
```

Clicking the extension icon in the toolbar doesn't work. To test a `default_popup`, find the extension id on `chrome://extensions/` and open `chrome-extension://<id>/<popup>.html` with `browser.url()`. The [Web Extension guide](/docs/extension-testing/web-extensions#test-popup-modal-in-chrome) has a ready-made `openExtensionPopup` custom command for this.

### VS Code extension

```sh
npm install --save-dev wdio-vscode-service
```

Add `"wdio-vscode-service"` to the `types` array in `tsconfig.json`.

```ts title="wdio.conf.ts"
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: ['./test/specs/**/*.ts'],
    capabilities: [{
        browserName: 'vscode',
        browserVersion: 'stable', // also possible: "insiders" or a specific version e.g. "1.80.0"
        'wdio:vscodeOptions': {
            // points to directory where extension package.json is located
            extensionPath: __dirname,
            userSettings: {
                'editor.fontSize': 14
            }
        }
    }],
    services: ['vscode'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
```

```ts title="test/specs/vscode.e2e.ts"
import { browser, expect } from '@wdio/globals'

describe('VS Code Extension Testing', () => {
    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toContain('[Extension Development Host]')
    })
})
```

To test the extension as a VS Code web extension, set `browserName: 'chrome'` and keep `wdio:vscodeOptions`. In that mode, `browserVersion` can only be `stable` or `insiders`. `npm create wdio@latest ./` with "VS Code Extension Testing" generates this setup for you.

## Choose your path

- [Web Extension Testing](/docs/extension-testing/web-extensions): load extensions in Chrome (folder or `.crx`) and Firefox (`.xpi` via [`installAddOn`](/docs/api/gecko#installaddon)), and test popup pages. Safari web extensions are not covered.
- [Firefox Profile Service](/docs/firefox-profile-service): build a Firefox profile that includes extensions.
- [VS Code Extension Testing](/docs/extension-testing/vscode-extensions): configuration, TypeScript setup, workbench page objects and `executeWorkbench`.
- [VS Code Service](/docs/wdio-vscode-service): all service options, such as `cachePath`, and how to write custom page objects.
- [Obsidian Plugin Testing Service](/docs/wdio-obsidian-service): a community service that tests Obsidian plugins across Obsidian versions on Windows, macOS, Linux and Android.
- [Custom Commands](/docs/customcommands): package helpers like `openExtensionPopup` for reuse.

Web extension tests run in a regular Chrome or Firefox session, so everything on [Web Browsers](/docs/platforms/web) applies, including selectors, network mocking and visual testing.

## Troubleshooting

- Firefox refuses a locally built extension because of signing: install it in the `before` hook with `browser.installAddOn(extension.toString('base64'), true)` instead of through a profile. Build the `.xpi` with `npx web-ext build`.
- Using Edge, Brave or Opera instead of Chrome: the same arguments usually work with that browser's options capability, e.g. `ms:edgeOptions`.
- VS Code and Chromedriver binaries are downloaded into a cache directory. To control where they are stored, e.g. to cache them in CI, set `services: [['vscode', { cachePath: __dirname }]]`.
- TypeScript can't find `getWorkbench` or `executeWorkbench`: add `wdio-vscode-service` to `compilerOptions.types`.

## Next steps

- [Configuration](/docs/configuration) reference for every `wdio.conf.ts` option.
- [Electron](/docs/desktop-testing/electron) for testing full desktop apps built on Chromium.
- Other platforms: [Web Browsers](/docs/platforms/web), [Mobile Apps](/docs/platforms/mobile), [Desktop Apps](/docs/platforms/desktop).
