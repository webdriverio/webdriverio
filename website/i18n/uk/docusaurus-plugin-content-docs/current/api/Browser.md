---
id: browser
title: Об'єкт Browser
---

__Успадковується від:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

Об’єкт браузера – це екземпляр сеансу, який ви використовуєте для керування браузером або мобільним пристроєм. Якщо ви запускаєте свої тести через WDIO, ви можете отримати доступ до екземпляра Browser через глобальні змінні `browser` або `driver` або імпортувати його з пакунка [`@wdio/globals`](/docs/api/globals). Якщо ви використовуєте WDIO в автономному режимі, екземпляр Browser повертається методом [`remote`](/docs/api/modules#remoteoptions-modifier).

The session is initialized by the test runner. The same goes for ending the session. This is also done by the test runner process.

## Властивості

Об’єкт браузера має такі властивості:

| Назва                   | Тип        | Опис                                                                                                                                                   |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `capabilities`          | `Object`   | Призначені параметри з віддаленого сервера.<br /><b>Приклад:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                                              |
| `requestedCapabilities` | `Object`   | Параметри, що були надіслані на віддалений сервер.<br /><b>Приклад:</b><pre>{ browserName: 'chrome' }</pre>                                       |
| `sessionId`             | `String`   | Ідентифікатор сеансу, призначений з віддаленого сервера.                                                                                               |
| `options`               | `Object`   | WDIO [параметри](/docs/configuration) які використовувались для створення об’єкту браузера. Подивитися більше про [способи запуску](/docs/setuptypes). |
| `commandList`           | `String[]` | Список команд, зареєстрованих в екземплярі браузера                                                                                                    |
| `isMobile`              | `Boolean`  | Вказує на мобільний сеанс. See more under [Mobile Flags](#mobile-flags).                                                                               |
| `isIOS`                 | `Boolean`  | Indicates an iOS session. See more under [Mobile Flags](#mobile-flags).                                                                                |
| `isAndroid`             | `Boolean`  | Indicates an Android session. See more under [Mobile Flags](#mobile-flags).                                                                            |

## Methods

Based on the automation backend used for your session, WebdriverIO identifies which [Protocol Commands](/docs/api/protocols) will be attached to the [browser object](/docs/api/browser). For example if you run an automated session in Chrome, you will have access to Chromium specific commands like [`elementHover`](/docs/api/chromium#elementhover) but not any of the [Appium commands](/docs/api/appium).

Furthermore WebdriverIO provides a set of convenient methods that are recommended to use, to interact with the [browser](/docs/api/browser) or [elements](/docs/api/element) on the page.

In addition to that the following commands are available:

| Name                 | Parameters                                                                                                             | Details                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to define custom commands that can be called from the browser object for composition purposes. Read more in the [Custom Command](/docs/customcommands) guide.                                           |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to overwrite any browser command with custom functionality. Use carefully as it can confuse framework users. Read more in the [Custom Command](/docs/customcommands#overwriting-native-commands) guide. |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Allos to define a custom selector strategy, read more in the [Selectors](/docs/selectors#custom-selector-strategies) guide.                                                                                    |

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
