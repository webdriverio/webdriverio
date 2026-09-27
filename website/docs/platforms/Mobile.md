---
id: mobile
title: Mobile Apps
description: Set up and run WebdriverIO tests for native, hybrid and mobile web apps on Android and iOS emulators, simulators, real devices and device clouds.
---

WebdriverIO automates Android and iOS through [Appium](/docs/appium), which speaks the WebDriver protocol. Your tests use the same `browser` object (aliased as `driver`), `$`/`$$` selectors and `expect` matchers as browser tests. Appium routes each session to a platform driver chosen by `appium:automationName`. For Android that is `UiAutomator2`, with Espresso as an alternative that unlocks extra selector strategies. For iOS and iPadOS it is `XCUITest`. With these drivers you can test native apps and mobile web in Chrome on Android or Safari on iOS. You can also test hybrid apps, switching between the native context and embedded webviews. Sessions can run on Android emulators, iOS simulators, real devices, or device clouds such as Sauce Labs, BrowserStack, TestingBot and TestMu AI. The [`@wdio/appium-service`](/docs/appium-service) starts and stops a local Appium server for you. On top of the raw Appium API, WebdriverIO adds cross-platform [mobile commands](/docs/api/mobile) such as `tap`, `swipe`, `longPress`, `scrollIntoView` and `switchContext`.

## Quick start

Prerequisites: Android Studio with an Android SDK and an emulator for Android; Xcode and a simulator on macOS for iOS. `npx appium-installer` guides you through the environment setup, and `npm init wdio@latest .` scaffolds a mobile project (choose Android or iOS). To set up by hand:

```sh
npm install --save-dev @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter @wdio/appium-service appium tsx
npx appium driver install uiautomator2   # Android
npx appium driver install xcuitest       # iOS
```

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    runner: 'local',
    port: 4723,
    specs: ['./test/specs/**/*.ts'],
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android GoogleAPI Emulator',
        'appium:platformVersion': '12.0',
        'appium:automationName': 'UiAutomator2',
        'appium:app': './path/to/app.apk'
    }],
    services: ['appium'],
    logLevel: 'info',
    waitforTimeout: 10000,
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
```

```ts title="test/specs/app.e2e.ts"
import { expect, driver, $ } from '@wdio/globals'

describe('My app', () => {
    it('should open the contacts screen', async () => {
        await $('~Contacts').click()
        await expect($('~Add contact')).toBeDisplayed()
    })

    it('should interact with a webview', async () => {
        await driver.switchContext({ title: 'My Webview Title' })
        await expect($('h1')).toBeDisplayed()
    })
})
```

```sh
npx wdio run ./wdio.conf.ts
```

`~` is the accessibility id selector: it maps to `content-description` on Android and `accessibilityIdentifier` on iOS, and is the preferred cross-platform strategy. Replace the example ids, the webview title and the app path with your own.

Other targets only change the capabilities:

```ts title="iOS simulator (native app)"
{
    platformName: 'iOS',
    'appium:deviceName': 'iPhone Simulator',
    'appium:platformVersion': '16.4',
    'appium:automationName': 'XCUITest',
    'appium:app': './path/to/MyApp.app' // .app for simulators, signed .ipa for real devices
}
```

```ts title="Mobile web (Chrome on an Android emulator)"
{
    platformName: 'Android',
    browserName: 'Chrome',
    'appium:deviceName': 'Android GoogleAPI Emulator',
    'appium:platformVersion': '12.0',
    'appium:automationName': 'UiAutomator2'
}
```

For iOS mobile web, use `platformName: 'iOS'`, `browserName: 'Safari'` and `'appium:automationName': 'XCUITest'`.

## Choose your path

- [Appium Setup](/docs/appium): which platforms Appium covers (iOS, Android, Tizen, TV apps) and how to install the toolchain.
- [Appium Service](/docs/appium-service): service options (`args`, `command`, `logPath`), `npx start-appium-inspector` to open the Appium Inspector, and a beta optimizer for slow XPath selectors.
- [Mobile Commands](/docs/api/mobile): cross-platform gestures and helpers. Covers hybrid apps with [`getContexts`](/docs/api/mobile/getContexts) and [`switchContext`](/docs/api/mobile/switchContext), plus the webview capabilities for iOS.
- [Mobile Selectors](/docs/selectors#mobile-selectors): accessibility id, Android UiAutomator, Espresso data/view matchers and iOS predicate strings and class chains.
- [Appium protocol commands](/docs/api/appium): the raw Appium endpoints available on `driver`.
- [Flutter apps](/docs/flutter-testing/introduction): why Flutter needs the Appium Flutter Driver, then [prepare the app](/docs/flutter-testing/preparing-flutter-application), [configure Appium](/docs/flutter-testing/base-appium-configuration), [set up WebdriverIO](/docs/flutter-testing/setting-up-webdriverio) and [write tests](/docs/flutter-testing/writing-tests).
- [Cloud Services](/docs/cloudservices): connect to Sauce Labs, BrowserStack, TestingBot, TestMu AI, Perfecto or RobotActions to run on hosted real devices.
- [Visual Testing](/docs/visual-testing): image comparison for native apps, hybrid apps and mobile browsers. For Percy on mobile, see [App Percy](/docs/visual-testing/integrate-with-app-percy).
- [Multi-remote](/docs/multiremote): coordinate several devices or browsers in one test.

Emulating a device viewport in a desktop browser with [`browser.emulate('device', ...)`](/docs/emulation) is not mobile testing. Desktop browser engines differ from mobile ones, so use Appium with a real mobile browser instead.

## Troubleshooting

- Session doesn't start: make sure the Appium driver for your `appium:automationName` is installed and the emulator or simulator is running. Use `port: 4723` unless you changed the Appium port.
- iOS can't find a webview: try `appium:webviewConnectRetries`, `appium:webviewConnectTimeout` or `appium:includeSafariInWebviews` (see [Hybrid Apps](/docs/api/mobile#hybrid-apps)).
- Android webview is slow to appear: tune `androidWebviewConnectionRetryTime` and `androidWebviewConnectTimeout` on `getContexts`/`switchContext`.
- Flutter widgets aren't found with native selectors: that's expected. Use the Flutter driver and finders described in the [Flutter guide](/docs/flutter-testing/introduction).

## Next steps

- [Configuration](/docs/configuration) and [Capabilities](/docs/capabilities) references.
- [Page Object Pattern](/docs/pageobjects) to share screens between Android and iOS specs.
- [MCP](/docs/mcp) to let an AI agent drive iOS and Android sessions through Appium.
- Other platforms: [Web Browsers](/docs/platforms/web), [Desktop Apps](/docs/platforms/desktop), [Extensions & Editors](/docs/platforms/apps-and-extensions).
