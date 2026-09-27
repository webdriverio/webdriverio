---
id: desktop
title: Desktop Apps
description: Pick the right WebdriverIO setup for native macOS apps and for Electron, Tauri and Dioxus apps on macOS, Windows and Linux, and run a first test.
---

How WebdriverIO automates a desktop app depends on how the app is built. Native macOS apps are automated through [Appium](/docs/appium) with the Mac2 driver (`'appium:automationName': 'Mac2'`), which requires Xcode. Apps built with a web-based framework are driven through their embedded browser engine by a dedicated WebdriverIO service. The [Electron service](/docs/desktop-testing/electron) uses Chromium via an auto-installed Chromedriver and can also call Electron main-process APIs. The [Tauri service](/docs/desktop-testing/tauri) and the [Dioxus service](/docs/desktop-testing/dioxus) drive the operating system webview: WebView2 on Windows, WKWebView on macOS and WebKitGTK on Linux. These three services run the same suite on Windows, macOS and Linux. Native Windows apps have no recommended driver today: Appium's Windows Driver is built on Microsoft's WinAppDriver, which is no longer maintained. There is no documented support for automating arbitrary native Linux apps.

| App type | macOS | Windows | Linux | How |
|----------|-------|---------|-------|-----|
| Native app | Yes | Not recommended | Not documented | Appium Mac2 driver |
| Electron | Yes | Yes | Yes | `@wdio/electron-service` (Chromedriver) |
| Tauri | Yes | Yes | Yes | `@wdio/tauri-service` (embedded plugin, `tauri-driver` or CrabNebula) |
| Dioxus | Yes | Yes | Yes | `@wdio/dioxus-service` (embedded driver; external driver on Windows only) |

## Quick start

`npm create wdio@latest ./` scaffolds all of these. Choose "Desktop Testing - of Electron, Tauri, Dioxus, or macOS Applications" and then your framework. Every setup below also needs `@wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter tsx` and a `tsconfig.json` with `"types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]`.

### Electron (macOS, Windows, Linux)

```sh
npm install --save-dev @wdio/electron-service
```

```ts title="wdio.conf.ts"
/// <reference types="@wdio/electron-service" />
export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: ['./test/specs/**/*.ts'],
    capabilities: [{
        browserName: 'electron',
        'wdio:electronServiceOptions': {
            // only needed if auto-detection of Electron Forge / electron-builder output fails
            // appBinaryPath: './dist-electron/linux-unpacked/myApp',
            appArgs: []
        }
    }],
    services: ['electron'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
```

```ts title="test/specs/app.e2e.ts"
import { browser } from '@wdio/globals'

describe('Electron Testing', () => {
    it('should print application title', async () => {
        console.log('Hello', await browser.getTitle(), 'application!')
    })
})
```

Use `browser.electron.execute((electron, ...args) => { ... })` to run code in the main process, and `browser.electron.mock()` to mock Electron APIs.

### Native macOS app (Appium Mac2)

```sh
npm install --save-dev @wdio/appium-service appium appium-mac2-driver
```

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    runner: 'local',
    port: 4723,
    specs: ['./test/specs/**/*.ts'],
    capabilities: [{
        platformName: 'Mac',
        'appium:automationName': 'Mac2',
        'appium:bundleId': 'com.apple.calculator'
    }],
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
```

```ts title="test/specs/calculator.e2e.ts"
import { expect, $ } from '@wdio/globals'

describe('MacOS Testing', () => {
    it('should calculate the meaning of life', async function () {
        await $('//XCUIElementTypeButton[@label="seven"]').click()
        await $('//XCUIElementTypeButton[@label="multiply"]').click()
        await $('//XCUIElementTypeButton[@label="six"]').click()
        await $('//XCUIElementTypeButton[@title="="]').click()
        await expect($('//XCUIElementTypeStaticText[@label="main display"]')).toHaveText('42')
    })
})
```

`appium:bundleId` selects the app to launch at session start.

### Tauri and Dioxus

Both need a Rust-side addition to your app, so follow their quick starts:

- Tauri: add the `tauri-plugin-wdio-webdriver` crate (the embedded provider), then use `services: [['tauri', { appBinaryPath: './src-tauri/target/release/my-tauri-app', driverProvider: 'embedded' }]]`. See the [Tauri Quick Start](/docs/desktop-testing/tauri/quick-start).
- Dioxus: add the `wdio-dioxus-bridge` crate and create a debug build (`cargo build`). Then use `services: [['dioxus', { driverProvider: 'embedded' }]]` with `browserName: 'dioxus'` and `'dioxus:options': { application: './target/debug/my-app' }`. See the [Dioxus Quick Start](/docs/desktop-testing/dioxus/quick-start).

## Choose your path

- [macOS](/docs/desktop-testing/macos): native macOS apps with Appium and the Mac2 driver.
- [Windows](/docs/desktop-testing/windows): current state of native Windows app automation.
- [Electron](/docs/desktop-testing/electron): setup, then [configuration](/docs/desktop-testing/electron/configuration) (including binary paths per OS), [accessing Electron APIs](/docs/desktop-testing/electron/api), [API reference and mocking](/docs/desktop-testing/electron/api-reference), [window management](/docs/desktop-testing/electron/window-management), [deeplinks](/docs/desktop-testing/electron/deeplink-testing), [standalone mode](/docs/desktop-testing/electron/standalone) and [debugging](/docs/desktop-testing/electron/debugging).
- [Tauri](/docs/desktop-testing/tauri): [platform support](/docs/desktop-testing/tauri/platform-support), [configuration](/docs/desktop-testing/tauri/configuration), [plugin setup](/docs/desktop-testing/tauri/plugin-setup), [CrabNebula](/docs/desktop-testing/tauri/crabnebula-setup), [Edge WebDriver on Windows](/docs/desktop-testing/tauri/edge-webdriver-windows), [usage examples](/docs/desktop-testing/tauri/usage-examples) and the [API reference](/docs/desktop-testing/tauri/api).
- [Dioxus](/docs/desktop-testing/dioxus): [platform support](/docs/desktop-testing/dioxus/platform-support), [configuration](/docs/desktop-testing/dioxus/configuration), [bridge setup](/docs/desktop-testing/dioxus/plugin-setup), [browser mode](/docs/desktop-testing/dioxus/browser-mode) (frontend-only tests in Chrome with mocked commands), [usage examples](/docs/desktop-testing/dioxus/usage-examples) and the [API reference](/docs/desktop-testing/dioxus/api).
- [Multi-remote](/docs/multiremote): the Electron, Tauri and Dioxus services support multi-remote sessions, e.g. two app instances in one test.

## Linux

On Linux, WebdriverIO drives Electron, Tauri and Dioxus apps. Things to know:

- Headless CI: these apps need a display server. The testrunner can wrap workers in Xvfb (`autoXvfb`, on by default, with optional `xvfbAutoInstall`). Alternatively, run `xvfb-run -a npx wdio run wdio.conf.ts`. See [Headless & Xvfb](/docs/headless-and-xvfb).
- Tauri with the `official` provider needs WebKitWebDriver (`webkit2gtk-driver` package). The `embedded` provider needs no external driver.
- Dioxus supports only the `embedded` provider on Linux, and building Dioxus apps requires the WebKitGTK development libraries.
- Electron on Ubuntu 24.04+ and other AppArmor-enabled distributions: set the service option `apparmorAutoInstall` if Electron fails to start.

## Troubleshooting

- Electron: [Common Issues](/docs/desktop-testing/electron/common-issues), e.g. "DevToolsActivePort file doesn't exist" in CI.
- Tauri: [Troubleshooting](/docs/desktop-testing/tauri/troubleshooting), including Edge WebDriver and WebView2 version mismatches.
- Dioxus: [Troubleshooting](/docs/desktop-testing/dioxus/troubleshooting).
- macOS: see the [Appium Mac2 Driver](https://github.com/appium/appium-mac2-driver) project for driver-specific setup such as Xcode.

## Next steps

- [Configuration](/docs/configuration) reference for every `wdio.conf.ts` option.
- [Appium Service](/docs/appium-service) options for the Mac2 setup.
- Other platforms: [Web Browsers](/docs/platforms/web), [Mobile Apps](/docs/platforms/mobile), [Extensions & Editors](/docs/platforms/apps-and-extensions).
