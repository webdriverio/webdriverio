---
id: electron
title: Electron
---

Electron is a framework for building desktop applications using JavaScript, HTML, and CSS. By embedding Chromium and Node.js into its binary, Electron allows you to maintain one JavaScript codebase and create cross-platform apps that work on Windows, macOS, and Linux — no native development experience required.

WebdriverIO provides an integrated service that simplifies the interaction with your Electron app and makes testing it very simple. The advantages of using WebdriverIO for testing Electron applications are:

- ☺️ Automated download of the correct Chromedriver version
- ⚒️ Access to the Electron API, namely: [`app`](https://www.electronjs.org/docs/latest/api/app), [`browserWindow`](https://www.electronjs.org/docs/latest/api/browser-window), [`dialog`](https://www.electronjs.org/docs/latest/api/dialog) and [`mainProcess`](https://www.electronjs.org/docs/latest/api/process).
- 🔄 Custom mocking of Electron API functionality
- 👤 Ability to define custom API handlers to modify application behavior under test

You just need a few simple steps to get started. Watch this simple step by step getting started video tutorial from the [WebdriverIO YouTube](https://www.youtube.com/@webdriverio) channel:

<LiteYouTubeEmbed id="iQNxTdWedk0" title="Getting Started with ElectronJS Testing in WebdriverIO" />

Or follow the guide in the following section.

## Getting Started

To initiate a new WebdriverIO project, run:

```sh
npm create wdio@latest ./
```

An installation wizard will guide you through the process. Ensure you select _"Desktop Testing - of Electron Applications"_ when it asks you what type of testing you'ld like to do. Afterwards provide the path to your compiled Electron application, e.g. `./dist`, then just keep the defaults or modify based on your preference.

The configuration wizard will install all required packages and creates a `wdio.conf.js` or `wdio.conf.ts` with the necessary configuration to test your application. If you agreed to autogenerate some tests files you can run your first test via `npm run wdio`.

That's it 🎉

## Configuration

To use the service you need to add `electron` to your services array and set an Electron capability, e.g.:

```js title=wdio.conf.js
export const config = {
  outputDir: 'logs',
  // ...
  services: ['electron'],
  capabilities: [{
      browserName: 'electron'
  }],
  // ...
};
```

**Note:** the `browserName` capability needs to be `electron` to have the service set up the automation session properly.

The service will attempt to find the path to your bundled Electron application if you use [Electron Forge](https://www.electronforge.io/) or [Electron Builder](https://www.electron.build/) as bundler. You can provide a custom path to the binary via custom service capabilities, e.g.:

```ts
capabilities: [{
  browserName: 'electron',
  'wdio:electronServiceOptions': {
    appBinaryPath: './path/to/bundled/electron/app.exe',
    appArgs: ['foo', 'bar=baz'],
  },
}],
```

## API Configuration

If you wish to use the electron APIs then you will need to import (or require) the preload and main scripts in your app. Somewhere near the top of your preload:

```ts
const isTest = process.env.NODE_ENV === 'test'
if (isTest) {
  require('wdio-electron-service/preload');
}
```

And somewhere near the top of your main index file (app entry point):

```ts
const isTest = process.env.NODE_ENV === 'test'
if (isTest) {
  require('wdio-electron-service/main');
}
```

The APIs should not work outside of WDIO but for security reasons it is encouraged to use dynamic imports wrapped in conditionals to ensure the APIs are only exposed when the app is being tested.

After importing the scripts the APIs should now be available in tests.

Currently available APIs:
- [`app`](https://www.electronjs.org/docs/latest/api/app)
- [`browserWindow`](https://www.electronjs.org/docs/latest/api/browser-window)
- [`dialog`](https://www.electronjs.org/docs/latest/api/dialog)
- [`mainProcess`](https://www.electronjs.org/docs/latest/api/process).

The service re-exports the WDIO browser object with the `.electron` namespace for API usage in your tests:

```ts
import { browser } from '@wdio/globals';

// in a test
const appName = await browser.electron.app('getName');
```

## Mocking Electron APIs

You can mock electron API functionality by calling the mock function with the API name, function name and mock return value. e.g. in a spec file:

```ts
await browser.electron.mock('dialog', 'showOpenDialog', 'dialog opened!');
const result = await browser.electron.dialog('showOpenDialog');
console.log(result); // 'dialog opened!'
```

## Custom Electron API

You can also implement a custom API if you wish. To do this you will need to define a handler in your main process:

```ts
import { ipcMain } from 'electron';

ipcMain.handle('wdio-electron', () => {
  // access some Electron or Node things on the main process
  return 'such api';
});
```

The custom API can then be called in a spec file:

```ts
const someValue = await browser.electron.api('wow');
console.log(someValue); // outputs: "such api"
```

## More Information

You can learn more about how to configure the [`wdio-electron-service`](https://www.npmjs.com/package/wdio-electron-service) in the [service docs](/docs/wdio-electron-service). Make sure to check out our [Electron boilerplate project](https://github.com/webdriverio/electron-boilerplate) that showcases how to intergate WebdriverIO in an example application.
