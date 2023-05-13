---
id: browser
title: Obiekt przeglądrki (The Browser Object)
---

__Dziedziczy:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

Obiekt przeglądarki (browser object) to instancja sesji, której używasz do sterowania przeglądarką albo urządzeniem mobilnym. Jeśli używasz test runnera WDIO, możesz uzyskać dostęp do instancji WebDrivera za pośrednictwem globalnego obiektu przeglądarki `browser`, sterownika `driver`, lub możesz go zaimportować za pomocą [`@wdio/globals`](/docs/api/globals). Jeśli używasz WebdriverIO w trybie autonomicznym (standalone), obiekt przeglądarki jest zwracany przez metodę [`remote`](/docs/api/modules#remoteoptions-modifier).

Sesja jest inicjowana przez test runner. To samo dotyczy zakończenia sesji. Odbywa się to również w procesie test runnera.

## Właściwości

Obiekt przeglądarki (browser) posiada następujące właściwości:

| Nazwa                   | Typ        | Szczegóły                                                                                                                                                                 |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`          | `Object`   | Przypisane możliwości (capabilities) ze zdalnego serwera.<br /><b>Przykład:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                                                   |
| `requestedCapabilities` | `Object`   | Możliwości (capabilities) żądane od zdalnego serwera.<br /><b>Przykład:</b><pre>{ browserName: 'chrome' }</pre>                                                       |
| `sessionId`             | `String`   | Identyfikator sesji (session id) przypisany ze zdalnego serwera.                                                                                                          |
| `options`               | `Object`   | [Opcje](/docs/configuration) (options) WebdriverIO w zależności od sposobu utworzenia obiektu przeglądarki. Zobacz więcej w sekcji [typy konfiguracji](/docs/setuptypes). |
| `commandList`           | `String[]` | Lista poleceń należących do instancji przeglądarki                                                                                                                        |
| `isMobile`              | `Boolean`  | Oznaczenie sesji mobilnej. Zobacz więcej w sekcji [Flagi mobilne](#mobile-flags).                                                                                         |
| `isIOS`                 | `Boolean`  | Oznaczenie sesji iOS. Zobacz więcej w sekcji [Flagi mobilne](#mobile-flags).                                                                                              |
| `isAndroid`             | `Boolean`  | Oznaczenie sesji Android. Zobacz więcej w sekcji [Flagi mobilne](#mobile-flags).                                                                                          |

## Metody

Na podstawie backendu automatyzacji używanego w Twojej sesji, WebdriverIO określa, które [Polecenia protokołu](/docs/api/protocols) (protocol commands) zostaną dołączone do [obiektu przeglądarki](/docs/api/browser). Na przykład, jeśli uruchomisz zautomatyzowaną sesję w Chrome, będziesz mieć dostęp do poleceń specyficznych dla Chromium, takich jak [`elementHover`](/docs/api/chromium#elementhover), ale nie będziesz mieć dostępu do żadnego z [poleceń Appium](/docs/api/appium).

Ponadto WebdriverIO zapewnia zestaw wygodnych metod, które są rekomendowane w celu interakcji z [przeglądarką](/docs/api/browser) lub [elementami](/docs/api/element) na stronie.

Oprócz tego dostępne są następujące polecenia:

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
