---
id: browser
title: பிரௌசர் ஆப்ஜெக்ட்
---

__ Extends:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

பிரௌசர் ஆப்ஜெக்ட் என்பது பிரௌசர் அல்லது மொபைல் சாதனத்தைக் கட்டுப்படுத்த நீங்கள் பயன்படுத்தும் செஷன் நிகழ்வாகும். நீங்கள் WDIO டெஸ்ட் ரன்னரைப் பயன்படுத்தினால், குளோபல் ` browser ` அல்லது ` driver ` ஆப்ஜெக்ட் மூலம் WebDriver நிகழ்வை அணுகலாம் அல்லது [`@wdio/globals`](/docs/api/globals)ஐப் பயன்படுத்தி இறக்குமதி செய்யலாம். நீங்கள் தனித்தனி முறையில் WebdriverIO ஐப் பயன்படுத்தினால், பிரௌசர் ஆப்ஜெக்ட் [` remote `](/docs/api/modules#remoteoptions-modifier) முறையில் திருப்பியளிக்கப்படும்.

டெஸ்ட் ரன்னெறால் செஷன் தொடங்கப்படுகிறது. செஷனை முடிப்பதற்கும் இதுவே செல்கிறது. இது டெஸ்ட் ரன்னர் செயல்முறையாலும் செய்யப்படுகிறது.

## Properties

பிரௌசர் ஆப்ஜெக்ட் பின்வரும் பண்புகளைக் கொண்டுள்ளது:

| பெயர்                   | வகை        | விவரங்கள்                                                                                                                                             |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`          | `Object`   | ரிமோட் சர்வரிலிருந்து ஒதுக்கப்பட்ட திறன்.<br /><b> Example:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                                               |
| `requestedCapabilities` | `Object`   | ரிமோட் சர்வரிலிருந்து கேட்கப்பட்ட திறன்கள்.<br /><b> Example:</b><pre>{ browserName: 'chrome' }</pre>                                             |
| `sessionId`             | `String`   | Session id assigned from the remote server.                                                                                                           |
| `options`               | `Object`   | பிரௌசர் ஆப்ஜெக்ட் எவ்வாறு உருவாக்கப்பட்டது என்பதைப் பொறுத்து WebdriverIO [options](/docs/configuration). மேலும் [setup types](/docs/setuptypes)காண்க. |
| `commandList`           | `String[]` | பிரௌசர் நிகழ்வில் பதிவுசெய்யப்பட்ட கட்டளைகளின் பட்டியல்                                                                                               |
| `isMobile`              | `Boolean`  | மொபைல் அமர்வைக் குறிக்கிறது. [Mobile Flags](#mobile-flags)இன் கீழ் மேலும் பார்க்கவும்.                                                                |
| `isIOS`                 | `Boolean`  | மொபைல் அமர்வைக் குறிக்கிறது. [Mobile Flags](#mobile-flags)இன் கீழ் மேலும் பார்க்கவும்.                                                                |
| `isAndroid`             | `Boolean`  | Android அமர்வைக் குறிக்கிறது. [Mobile Flags](#mobile-flags)இன் கீழ் மேலும் பார்க்கவும்.                                                               |

## Methods

Based on the automation backend used for your session, WebdriverIO identifies which [Protocol Commands](/docs/api/protocols) will be attached to the [browser object](/docs/api/browser). For example if you run an automated session in Chrome, you will have access to Chromium specific commands like [`elementHover`](/docs/api/chromium#elementhover) but not any of the [Appium commands](/docs/api/appium).

Furthermore WebdriverIO provides a set of convenient methods that are recommended to use, to interact with the [browser](/docs/api/browser) or [elements](/docs/api/element) on the page.

In addition to that the following commands are available:

| Name                 | Parameters                                                                                                             | Details                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to define custom commands that can be called from the browser object for composition purposes. Read more in the [Custom Command](/docs/customcommands) guide.                                           |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to overwrite any browser command with custom functionality. Use carefully as it can confuse framework users. Read more in the [Custom Command](/docs/customcommands#overwriting-native-commands) guide. |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Allows to define a custom selector strategy, read more in the [Selectors](/docs/selectors#custom-selector-strategies) guide.                                                                                   |

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

Here is a list of events. Keep in mind that this is not the full list of available events yet. Feel free to contribute to update the document by adding descriptions of more events here.

#### `request.performance`
This is an event to measure WebDriver level operations. Whenever WebdriverIO sends a request to the WebDriver backend, this event will be emitted with some useful information:

- `durationMillisecond`: Time duration of the request in millisecond.
- `error`: Error object if the request failed.
- `request`: Request object. You can find url, method, headers, etc.
- `retryCount`: If it's `0`, the request was the first attempt. It will increase when WebDriverIO retries under the hood.
- `success`: Boolean to represent the request was succeeded or not. If it's `false`, `error` property will be provided as well.

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

You can set custom commands on the browser scope to abstract away workflows that are commonly used. Check out our guide on [Custom Commands](/docs/customcommands#adding-custom-commands) for more information.
