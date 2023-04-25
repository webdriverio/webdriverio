---
id: browser
title: Browser 对象
---

__Extends:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

The browser object is the session instance you use to control the browser or mobile device with. The browser object is the session instance you use to control the browser or mobile device with. If you use the WDIO test runner, you can access the WebDriver instance through the global `browser` or `driver` object or import it using [`@wdio/globals`](/docs/api/globals). If you use WebdriverIO in standalone mode the browser object is returned by the [`remote`](/docs/api/modules#remoteoptions-modifier) method. If you use WebdriverIO in standalone mode the browser object is returned by the [`remote`](/docs/api/modules#remoteoptions-modifier) method.

The session is initialized by the test runner. The same goes for ending the session. This is also done by the test runner process. The same goes for ending the session. This is also done by the test runner process.

## Properties

A browser object has the following properties:

| Name                    | Type       | Details                                                                                                                                                                         |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`          | `Object`   | Assigned capabilitie from the remote server.<br /><b>Example:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                                                                      |
| `requestedCapabilities` | `Object`   | Capabilities requested from the remote server.<br /><b>Example:</b><pre>{ browserName: 'chrome' }</pre>                                                                    |
| `sessionId`             | `String`   | Session id assigned from the remote server.                                                                                                                                     |
| `options`               | `Object`   | WebdriverIO [options](/docs/configuration) depending on how the browser object was created. See more [setup types](/docs/setuptypes). See more [setup types](/docs/setuptypes). |
| `commandList`           | `String[]` | A list of commands registered to the browser instance                                                                                                                           |
| `isMobile`              | `Boolean`  | Indicates a mobile session. Indicates a mobile session. See more under [Mobile Flags](#mobile-flags).                                                                           |
| `isIOS`                 | `Boolean`  | Indicates an iOS session. See more under [Mobile Flags](#mobile-flags). See more under [Mobile Flags](#mobile-flags).                                                           |
| `isAndroid`             | `Boolean`  | Indicates an Android session. See more under [Mobile Flags](#mobile-flags). Indicates a mobile session. See more under [Mobile Flags](#mobile-flags).                           |

## Methods

Based on the automation backend used for your session, WebdriverIO identifies which [Protocol Commands](/docs/api/protocols) will be attached to the [browser object](/docs/api/browser). For example if you run an automated session in Chrome, you will have access to Chromium specific commands like [`elementHover`](/docs/api/chromium#elementhover) but not any of the [Appium commands](/docs/api/appium). For example if you run an automated session in Chrome, you will have access to Chromium specific commands like [`elementHover`](/docs/api/chromium#elementhover) but not any of the [Appium commands](/docs/api/appium).

Furthermore WebdriverIO provides a set of convenient methods that are recommended to use, to interact with the [browser](/docs/api/browser) or [elements](/docs/api/element) on the page.

In addition to that the following commands are available:

| Name                 | Parameters                                                                                                             | Details                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to define custom commands that can be called from the browser object for composition purposes. Read more in the [Custom Command](/docs/customcommands) guide. Read more in the [Custom Command](/docs/customcommands) guide.                                                                                                                       |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to overwite any browser command with custom functionality. Use carefully as it can confuse framework users. Read more in the [Custom Command](/docs/customcommands#overwriting-native-commands) guide. Use carefully as it can confuse framework users. Read more in the [Custom Command](/docs/customcommands#overwriting-native-commands) guide. |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Allos to define a custom selector strategy, read more in the [Selectors](/docs/selectors#custom-selector-strategies) guide.                                                                                                                                                                                                                               |

## Remarks

### Mobile Flags

If you need to modify your test based on whether or not your session runs on a mobile device, you can access the mobile flags to check.

For example, given this config:

```js
// wdio.conf.js
export const config = {
    // ...
    capabilities: {
        platformName: 'iOS',
        app: 'net.company.SafariLauncher',
        udid: '123123123123abc',
        deviceName: 'iPhone',
        // ...
    }
    // ...
}
```

You can access these flags in your test like so:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

This can be useful if, for example, you want to define selectors in your [page objects](../pageobjects) based on the device type, like this:

```js
// mypageobject.page.js
import Page from './page'

class LoginPage extends Page {
    // ...
    get username() {
        const selectorAndroid = 'new UiSelector().text("Cancel").className("android.widget.Button")'
        const selectorIOS = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
        const selectorType = driver.isAndroid ? 'android' : 'ios'
        const selector = driver.isAndroid ? selectorAndroid : selectorIOS
        return $(`${selectorType}=${selector}`)
    }
    // ...
}
```

You can also use these flags to run only certain tests for certain device types:

```js
// mytest.e2e.js
describe('my test', () => {
    // ...
    // only run test with Android devices
    if (driver.isAndroid) {
        it('tests something only for Android', () => {
            // ...
        })
    }
    // ...
})
```

### Events
The browser object is an EventEmitter and a couple of events are emitted for your use cases.

Here is a list of events. Keep in mind that this is not the full list of available events yet. Here is a list of events. Keep in mind that this is not the full list of available events yet. Feel free to contribute to update the document by adding descriptions of more events here.

#### `request.performance`
This is an event to measure WebDriver level operations. This is an event to measure WebDriver level operations. Whenever WebdriverIO sends a request to the WebDriver backend, this event will be emitted with some useful information:

- `durationMillisecond`: Time duration of the request in millisecond.
- `error`: Error object if the request failed.
- `request`: Request object. `request`: Request object. You can find url, method, headers, etc.
- `retryCount`: If it's `0`, the request was the first attempt. It will increase when WebDriverIO retries under the hood. It will increase when WebDriverIO retries under the hood.
- `success`: Boolean to represent the request was succeeded or not. If it's `false`, `error` property will be provided as well. If it's `false`, `error` property will be provided as well.

An example event:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Custom Commands

You can set custom commands on the browser scope to abstract away workflows that are commonly used. Check out our guide on [Custom Commands](/docs/customcommands#adding-custom-commands) for more information. Check out our guide on [Custom Commands](/docs/customcommands#adding-custom-commands) for more information.
