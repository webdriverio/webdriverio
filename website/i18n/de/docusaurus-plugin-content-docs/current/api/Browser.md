---
id: browser
title: Das Browser-Objekt
---

__Verlängerungen:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

Das Browser-Objekt ist die Session-Instanz, mit der Sie den Browser oder das mobile Gerät steuern. Wenn Sie den WDIO Testrunner benutzen, kônnen Sie die globale Variable `browser` oder `driver` nutzen oder importieren sie die Variables vom [`@wdio/globals`](/docs/api/globals) Paket. Wenn Sie WebdriverIO im Standalone-Modus verwenden, wird das Browser-Objekt durch die [`remote`](/docs/api/modules#remoteoptions-modifier) Methode zurückgegeben.

Das Beenden der Session wird ebenfalls vom Testrunner übernommen. Das Beenden der Session wird ebenfalls vom Testrunner übernommen. Das Beenden der Session wird ebenfalls vom Testrunner übernommen.

## Eigenschaften

Ein Browser-Objekt hat folgende Eigenschaften:

| Namen                   | Typ        | Details                                                                                                                                                                                                                                                                  |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `capabilities`          | `Object`   | Assigned capabilities from the remote server.<br /><b>Example:</b><pre>\{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: \{<br />    chromedriverVersion: '105.0.5195.52',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  \},<br />  'goog:chromeOptions': \{ debuggerAddress: 'localhost:64679' \},<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: \{},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: \{ implicit: 0, pageLoad: 300000, script: 30000 \},<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />\}</pre>                                                                                                                                                              |
| `requestedCapabilities` | `Object`   | Angefragte Capabilities vom WebDriver Server.<br /><b>Beispiel:</b><pre>\{ browserName: 'chrome' \}</pre>                                                                                                                                                              |
| `sessionId`             | `String`   | Session-Id vom Remote-Server zugewiesen.                                                                                                                                                                                                                                 |
| `options`               | `Object`   | WebdriverIO [Optionen](/docs/configuration) je nachdem, wie das Browserobjekt erstellt wurde. Weitere [Setup-Typen](/docs/setuptypes).                                                                                                                                   |
| `commandList`           | `String[]` | Eine Liste der Befehle, die in der Browser-Instanz registriert sind                                                                                                                                                                                                      |
| `isW3C`                 | `Boolean`  | Indicates if this is a W3C session                                                                                                                                                                                                                                       |
| `isChrome`              | `Boolean`  | Indicates if this Chrome instance                                                                                                                                                                                                                                        |
| `isFirefox`             | `Boolean`  | Indicates if this Firefox instance                                                                                                                                                                                                                                       |
| `isBidi`                | `Boolean`  | Indicates if this session uses Bidi                                                                                                                                                                                                                                      |
| `isSauce`               | `Boolean`  | Indicates if this session is Running on Sauce Labs                                                                                                                                                                                                                       |
| `isMacApp`              | `Boolean`  | Indicates if this session is Running for a native Mac App                                                                                                                                                                                                                |
| `isWindowsApp`          | `Boolean`  | Indicates if this session is Running for a native Windows App                                                                                                                                                                                                            |
| `isMobile`              | `Boolean`  | Zeigt eine mobile Session an. Mehr unter [Mobile Flags](#mobile-flags).                                                                                                                                                                                                  |
| `isIOS`                 | `Boolean`  | Zeigt eine iOS-Session an. Mehr unter [Mobile Flags](#mobile-flags).                                                                                                                                                                                                     |
| `isAndroid`             | `Boolean`  | Zeigt eine Android-Sitzung an. Mehr unter [Mobile Flags](#mobile-flags).                                                                                                                                                                                                 |
| `isNativeContext`       | `Boolean`  | Indicates if the mobile is in the `NATIVE_APP` context. See more under [Mobile Flags](#mobile-flags).                                                                                                                                                                    |
| `mobileContext`         | `string`   | The will provide the **current** context the driver is in, for example `NATIVE_APP`, `WEBVIEW_<packageName>` for Android or `WEBVIEW_<pid>` for iOS. It will save an extra WebDriver to `driver.getContext()`. See more under [Mobile Flags](#mobile-flags). |


## Methoden

Basierend auf dem für Ihre Sitzung verwendeten Automatisierungs-Backend WebdriverIO identifiziert welche [Protokollbefehle](/docs/api/protocols) dem [Browser-Objekt](/docs/api/browser) hinzugefügt werden. Zum Beispiel, bei einer automatisierten Sitzung in Chrome haben Sie Zugriff auf Chrome-spezifische Befehle wie [`elementHover`](/docs/api/chromium#elementhover) , aber keine der [Appium Befehle](/docs/api/appium).

Außerdem bietet WebdriverIO eine Reihe von praktischen Methoden, die zur Verwendung empfohlen werden um mit dem [Browser](/docs/api/browser) oder [Elementen](/docs/api/element) auf der Seite zu interagieren.

Zusätzlich stehen folgende Befehle zur Verfügung:

| Namen                | Parameter                                                                                                              | Details                                                                                                                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Ermöglicht die Definition benutzerdefinierter Befehle, die aus dem Browser-Objekt für Kompositionszwecke aufgerufen werden können. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands)                                                                        |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Ermöglicht das Überschreiben aller Browserbefehle mit benutzerdefinierten Funktionen. Verwenden Sie diese Funktionalität sorgfältig, da es Framework-Benutzer verwirren kann. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands#overwriting-native-commands) |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Ermöglicht das Definieren einer benutzerdefinierten Selektorstrategie. Weitere Informationen finden Sie im [Selektoren](/docs/selectors#custom-selector-strategies) Guide.                                                                                                           |

## Bemerkungen

### Mobile Markierungen

Wenn sich Ihr Test anders verhalten soll, basierend darauf, ob dieser auf einem Mobilen-Endgerät ausgeführt wird oder nicht, können Sie auf die mobilen Attribute der Session zurückgreifen.

Zum Beispiel mit dieser Konfiguration:

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

Sie können auf diese Markierungen in Ihrem Test wie folgt zugreifen:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

Dies kann nützlich sein, um zum Beispiel Selektoren basierend vom Device Typ im [Page Objekt](../pageobjects) zu definieren:

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

Sie können ebenfalls bestimmte mobile Markierungen (z.B. isAndroid oder isIOS) verwenden, um Tests nur auf bestimmten Gerätetypen auszuführen:

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
Das Browser-Objekt ist ein EventEmitter und ein paar Ereignisse werden für Ihren Gebrauch emittiert.

Hier ist eine Liste der Ereignisse. Beachten Sie, dass dies noch nicht die vollständige Liste der verfügbaren Events ist. Zögern Sie nicht, das Dokument zu aktualisieren, indem Sie hier Beschreibungen von weiteren Events hinzufügen.

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

- `method`: WebDriver Bidi command method
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
Dies ist ein Ereignis, um Operationen auf WebDriver Ebene zu messen. Immer wenn WebdriverIO eine Anfrage an das WebDriver-Backend sendet, wird dieses Ereignis mit einigen nützlichen Informationen emittiert:

- `durationMillisecond`: Zeitdauer der Anfrage in Millisekunden.
- `error`: Fehlerobjekt wenn die Anfrage fehlgeschlagen ist.
- `request`: Request Objekt. Hier finden Sie Url, Methode, Header, etc.
- `retryCount`: Wenn es `0`ist, war die Anfrage der erste Versuch. Die Zahl erhöht sich, wenn WebDriverIO unter der Haube den Befehl erneut ausführt.
- `success`: Boolean die anzeigt, ob der Befehl erfolgreich ausgeführt wurde. Wenn es `false`ist, wird eine `error` Eigenschaft ebenfalls zur Verfügung gestellt.

Ein Beispielereignis:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Benutzerdefinierte Befehle

Sie können benutzerdefinierte Befehle dem Browser Objekt hinzufügen, um Workflows, die häufig verwendet werden, in einzelne Befehle zu verpacken. Schauen Sie sich unsere Anleitung unter [Benutzerdefinierte Befehle](/docs/customcommands#adding-custom-commands) für weitere Informationen an.
