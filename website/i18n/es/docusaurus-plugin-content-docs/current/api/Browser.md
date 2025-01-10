---
id: browser
title: El objeto navegador
---

__Extensión:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

El objeto navegador es la instancia de sesión con la que se controla el navegador o el dispositivo móvil. Si utiliza el ejecutor de pruebas WDIO, puede acceder a la instancia WebDriver a través del objeto global `browser` o `driver` o importarlo utilizando [`@wdio/globals`](/docs/api/globals). Si utiliza WebdriverIO en modo autónomo, el objeto navegador es devuelto por el método [`remoto`](/docs/api/modules#remoteoptions-modifier).

La sesión es inicializada por el sistema de pruebas. Lo mismo ocurre para finalizar la sesión. Esto también lo hace el proceso de ejecución de pruebas.

## Propiedades

Un objeto navegador tiene las siguientes propiedades:

| Nombre                   | Tipo       | Información                                                                                                                                                                                                                                                              |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `capacidades`            | `Objeto`   | Assigned capabilities from the remote server.<br /><b>Example:</b><pre>\{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: \{<br />    chromedriverVersion: '105.0.5195.52',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  \},<br />  'goog:chromeOptions': \{ debuggerAddress: 'localhost:64679' \},<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: \{},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: \{ implicit: 0, pageLoad: 300000, script: 30000 \},<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />\}</pre>                                                                                                                                                              |
| `capacidadesSolicitadas` | `Objeto`   | Capacidades solicitadas al servidor remoto.<br /><b>Ejemplo:</b><pre>\{ browserName: 'chrome' \}</pre>                                                                                                                                                                |
| `sessionId`              | `String`   | Id de sesión asignado desde el servidor remoto.                                                                                                                                                                                                                          |
| `opciones`               | `Object`   | Se crearon [opciones](/docs/configuration) WebdriverIO, dependiendo de cómo se creó el objeto del navegador. Ver más [tipos de configuración](/docs/setuptypes).                                                                                                         |
| `commandList`            | `String[]` | Una lista de comandos registrados a la instancia del navegador                                                                                                                                                                                                           |
| `isW3C`                  | `Boolean`  | Indicates if this is a W3C session                                                                                                                                                                                                                                       |
| `isChrome`               | `Boolean`  | Indicates if this Chrome instance                                                                                                                                                                                                                                        |
| `isFirefox`              | `Boolean`  | Indicates if this Firefox instance                                                                                                                                                                                                                                       |
| `isBidi`                 | `Boolean`  | Indicates if this session uses Bidi                                                                                                                                                                                                                                      |
| `isSauce`                | `Boolean`  | Indicates if this session is Running on Sauce Labs                                                                                                                                                                                                                       |
| `isMobile`               | `Boolean`  | Indica una sesión móvil. Vea más en [Banderas móviles](#mobile-flags).                                                                                                                                                                                                   |
| `isIOS`                  | `Boolean`  | Indica una sesión de iOS. Vea más en [Banderas móviles](#mobile-flags).                                                                                                                                                                                                  |
| `isAndroid`              | `Boolean`  | Indica una sesión Android. Vea más en [Banderas móviles](#mobile-flags).                                                                                                                                                                                                 |
| `isNativeContext`        | `Boolean`  | Indicates if the mobile is in the `NATIVE_APP` context. See more under [Mobile Flags](#mobile-flags).                                                                                                                                                                    |
| `mobileContext`          | `string`   | The will provide the **current** context the driver is in, for example `NATIVE_APP`, `WEBVIEW_<packageName>` for Android or `WEBVIEW_<pid>` for iOS. It will save an extra WebDriver to `driver.getContext()`. See more under [Mobile Flags](#mobile-flags). |


## Métodos

En función del backend de automatización utilizado para su sesión, WebdriverIO identifica qué [comandos de protocolo](/docs/api/protocols) se adjuntarán al [objeto navegador](/docs/api/browser). Por ejemplo, si ejecuta una sesión automatizada en Chrome, tendrá acceso a comandos específicos de Chromium como [`elementHover`](/docs/api/chromium#elementhover) pero no a ninguno de los [comandos de Appium](/docs/api/appium).

Además WebdriverIO proporciona un conjunto de métodos convenientes que se recomienda utilizar, para interactuar con los [navegador](/docs/api/browser) o los[elementos](/docs/api/element) en la página.

Además, dispone de los siguientes comandos:

| Nombre               | Parámetros                                                                                                             | Detalles                                                                                                                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Permite definir comandos personalizados que pueden ser llamados desde el objeto navegador con fines de composición. Más información en la guía [Comandos personalizados](/docs/customcommands).                                                    |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to overwrite any browser command with custom functionality. Utilícelo con cuidado, ya que puede confundir a los usuarios del marco. Más información en la guía [Comandos personalizados](/docs/customcommands#overwriting-native-commands). |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Allows to define a custom selector strategy, read more in the [Selectors](/docs/selectors#custom-selector-strategies) guide.                                                                                                                       |

## Avisos

### Banderas móviles

Si necesita modificar su prueba basada en si su sesión se ejecuta o no en un dispositivo móvil, puede acceder a las banderas móviles para comprobar.

Por ejemplo, dado los dos archivos:

```js
// wdio.conf.js
export const config = {
    // ...
    capabilities: \\{
        platformName: 'iOS',
        app: 'net.company.SafariLauncher',
        udid: '123123123123abc',
        deviceName: 'iPhone',
        // ...
    }
    // ...
}
```

Puedes acceder a estas banderas en tu prueba así:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

Esto puede ser útil si, por ejemplo, quiere definir selectores en sus [objetos de página](../pageobjects) basados en el tipo de dispositivo, de la siguiente manera:

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

También puede utilizar estas banderas para ejecutar sólo ciertas pruebas para ciertos tipos de dispositivos:

```js
// mytest.e2e.js
describe('mi test', () => {
    // ...
    // sólo ejecutar pruebas con dispositivos Android
    if (driver.isAndroid) {
        it('prueba algo sólo para Android', () => {
            // ...
        })
    }
    // ...
})
```

### Eventos
El objeto del navegador es un EventEmitter y se emiten un par de eventos para sus casos de uso.

He aquí una lista de eventos. Tenga en cuenta que esta no es la lista completa de eventos disponibles todavía. Siéntase libre de contribuir a actualizar el documento añadiendo descripciones de más eventos aquí.

#### `request.start`
This event is fired before a WebDriver request is sent to the driver. It contains information about the request and its payload.

```ts
browser.on('request.start', (ev: RequestInit) => {
    // ...
})
```

#### `request.end`
This event is fired once the request to the driver received a response. The event object either contains the response body as result or an error if the WebDriver command failed.

```ts
browser.on('request.end', (ev: { result: unknown, error?: Error }) => {
    // ...
})
```

#### `request.retry`
The retry event can notify you when WebdriverIO attempts to retry running the command, e.g. due to a network issue. It contains information about the error that caused the retry and the amount of retries already done.

```ts
browser.on('request.retry', (ev: { error: Error, retryCount: number }) => {
    // ...
})
```

#### `command`

This event is emitted whenever WebdriverIO sends a WebDriver Classic command. It contains the following information:

- `command`: the command name, e.g. `navigateTo`
- `method`: the HTTP method used to send the command request, e.g. `POST`
- `endpoint`: the command endpoint, e.g. `/session/fc8dbda381a8bea36a225bd5fd0c069b/url`
- `body`: the command payload, e.g. `{ url: 'https://webdriver.io' }`

#### `result`

This event is emitted whenever WebdriverIO receives a result of a WebDriver Classic command. It contains the same information as the `command` event with the addition of the following information:

- `result`: the command result

#### `bidiCommand`

This event is emitted whenever WebdriverIO sends a WebDriver Bidi command to the browser driver. It contains information about:

- `method`: WebDriver Bidi command methid
- `params`: associated command parameter (see [API](/docs/api/webdriverBidi))

#### `bidiResult`

In case of a successful command execution, the event payload will be:

- `type`: `success`
- `id`: the command id
- `result`: the command result (see [API](/docs/api/webdriverBidi))

In case of a command error, the event payload will be:

- `type`: `error`
- `id`: the command id
- `error`: the error code, e.g. `invalid argument`
- `message`: details about the error
- `stacktrace`: a stack trace

#### `request.start`
This event is fired before a WebDriver request is sent to the driver. It contains information about the request and its payload.

```ts
browser.on('request.start', (ev: RequestInit) => {
    // ...
})
```

#### `request.end`
This event is fired once the request to the driver received a response. The event object either contains the response body as result or an error if the WebDriver command failed.

```ts
browser.on('request.end', (ev: { result: unknown, error?: Error }) => {
    // ...
})
```

#### `request.retry`
The retry event can notify you when WebdriverIO attempts to retry running the command, e.g. due to a network issue. It contains information about the error that caused the retry and the amount of retries already done.

```ts
browser.on('request.retry', (ev: { error: Error, retryCount: number }) => {
    // ...
})
```

#### `request.performance`
Este es un evento para medir las operaciones de nivel de WebDriver. Cada vez que WebdriverIO envíe una solicitud al backend de WebDriver, este evento se emitirá con alguna información útil:

- `durationMilisegundo`: Duración del tiempo de la solicitud en milisegundo.
- `error`: Objeto de error si la solicitud falló.
- `request`: Solicitar objeto. Puede encontrar el url, método, cabezas, etc.
- `retryCount`: Si es `0`, la solicitud fue el primer intento. Se incrementará cuando WebDriverIO vuelva a intentarlo bajo el capó.
- `success`: Booleano para representar la solicitud fue exitoso o no. Si es `false`, `error` propiedad también será proporcionada.

Un ejemplo de evento:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Comandos personalizados

Puede configurar comandos personalizados en el ámbito del navegador para abstruir los flujos de trabajo que se utilizan comúnmente. Consulte nuestra guía en [Comandos personalizados](/docs/customcommands#adding-custom-commands) para más información.
