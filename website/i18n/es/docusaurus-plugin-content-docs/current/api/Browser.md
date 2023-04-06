---
id: browser
title: El objeto navegador
---

__Extends:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

El objeto navegador es la instancia de sesión con la que se controla el navegador o el dispositivo móvil. Si utiliza el ejecutor de pruebas WDIO, puede acceder a la instancia WebDriver a través del objeto global `browser` o `driver` o importarlo utilizando [`@wdio/globals`](/docs/api/globals). Si utiliza WebdriverIO en modo autónomo, el objeto navegador es devuelto por el método [`remoto`](/docs/api/modules#remoteoptions-modifier).

La sesión es inicializada por el sistema de pruebas. Lo mismo ocurre para finalizar la sesión. Esto también lo hace el proceso de ejecución de pruebas.

## Propiedades

Un objeto navegador tiene las siguientes propiedades:

| Nombre                   | Tipo       | Información                                                                                                                                                |
| ------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capacidades`            | `Objeto`   | Capacidad asignada desde el servidor remoto.<br /><b>Ejemplo:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                                                 |
| `capacidadesSolicitadas` | `Objeto`   | Capacidades solicitadas al servidor remoto.<br /><b>Ejemplo:</b><pre>{ browserName: 'chrome' }</pre>                                                  |
| `sessionId`              | `String`   | Id de sesión asignado desde el servidor remoto.                                                                                                            |
| `opciones`               | `Objeto`   | WebdriverIO [options](/docs/configuration) depending on how the browser object was created. See more [setup types](http://localhost:3000/docs/setuptypes). |
| `commandList`            | `String[]` | A list of commands registered to the browser instance                                                                                                      |
| `isMobile`               | `Boolean`  | Indicates a mobile session. See more under [Mobile Flags](#mobile-flags).                                                                                  |
| `isIOS`                  | `Boolean`  | Indicates an iOS session. See more under [Mobile Flags](#mobile-flags).                                                                                    |
| `isAndroid`              | `Boolean`  | Indicates an Android session. See more under [Mobile Flags](#mobile-flags).                                                                                |

## Métodos

En función del backend de automatización utilizado para su sesión, WebdriverIO identifica qué [comandos de protocolo](/docs/api/protocols) se adjuntarán al [objeto navegador](/docs/api/browser). Por ejemplo, si ejecuta una sesión automatizada en Chrome, tendrá acceso a comandos específicos de Chromium como [`elementHover`](/docs/api/chromium#elementhover) pero no a ninguno de los [comandos de Appium](/docs/api/appium).

Además WebdriverIO proporciona un conjunto de métodos convenientes que se recomienda utilizar, para interactuar con los [navegador](/docs/api/browser) o los[elementos](/docs/api/element) en la página.

Además, dispone de los siguientes comandos:

| Nombre               | Parámetros                                                                                                             | Detalles                                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Permite definir comandos personalizados que pueden ser llamados desde el objeto navegador con fines de compisición. Read more in the [Custom Command](/docs/customcommands) guide.                                                               |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to overwite any browser command with custom functionality. Utilícelo con cuidado ya que puede confundir a los usuarios del marco. Más información en la guía [Comandos personalizados](/docs/customcommands#overwriting-native-commands). |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Permite definir una estrategia de selector personalizada, lea más en la guía [Selectores](/docs/selectors#custom-selector-strategies).                                                                                                           |

## Avisos

### Banderas móviles

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

This can be useful if, for example, you want to define selectors in your [page objects](PageObjects.md) based on the device type, like this:

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
This is an event to measure WebDriver level operations. Whenever WebDriverIO requests to your WebDriver endoints, this event will be emitted with some useful information:

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
