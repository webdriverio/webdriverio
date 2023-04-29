---
id: browser
title: Das Browser-Objekt
---

__Verlängerungen:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

Das Browser-Objekt ist die Session-Instanz, mit der Sie den Browser oder das mobile Gerät steuern. Wenn Sie den WDIO Testrunner benutzen, kônnen Sie die globale Variable `browser` oder `driver` nutzen oder importieren sie die Variables vom [`@wdio/globals`](/docs/api/globals) Paket. Wenn Sie WebdriverIO im Standalone-Modus verwenden, wird das Browser-Objekt durch die [`remote`](/docs/api/modules#remoteoptions-modifier) Methode zurückgegeben.

Das Beenden der Session wird ebenfalls vom Testrunner übernommen. Das Beenden der Session wird ebenfalls vom Testrunner übernommen. Das Beenden der Session wird ebenfalls vom Testrunner übernommen.

## Eigenschaften

Ein Browser-Objekt hat folgende Eigenschaften:

| Namen                   | Typ        | Details                                                                                                                                |
| ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`          | `Object`   | Zugewiesene Capabilities vom WebDriver Server.<br /><b>Beispiel:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                           |
| `requestedCapabilities` | `Object`   | Angefragte Capabilities vom WebDriver Server.<br /><b>Beispiel:</b><pre>{ browserName: 'chrome' }</pre>                            |
| `sessionId`             | `String`   | Session-Id vom Remote-Server zugewiesen.                                                                                               |
| `options`               | `Object`   | WebdriverIO [Optionen](/docs/configuration) je nachdem, wie das Browserobjekt erstellt wurde. Weitere [Setup-Typen](/docs/setuptypes). |
| `commandList`           | `String[]` | Eine Liste der Befehle, die in der Browser-Instanz registriert sind                                                                    |
| `isMobile`              | `Boolean`  | Zeigt eine mobile Session an. Mehr unter [Mobile Flags](#mobile-flags).                                                                |
| `isIOS`                 | `Boolean`  | Zeigt eine iOS-Session an. Mehr unter [Mobile Flags](#mobile-flags).                                                                   |
| `isAndroid`             | `Boolean`  | Zeigt eine Android-Sitzung an. Mehr unter [Mobile Flags](#mobile-flags).                                                               |

## Methoden

Basierend auf dem für Ihre Sitzung verwendeten Automatisierungs-Backend WebdriverIO identifiziert welche [Protokollbefehle](/docs/api/protocols) dem [Browser-Objekt](/docs/api/browser) hinzugefügt werden. Zum Beispiel, bei einer automatisierten Sitzung in Chrome haben Sie Zugriff auf Chrome-spezifische Befehle wie [`elementHover`](/docs/api/chromium#elementhover) , aber keine der [Appium Befehle](/docs/api/appium).

Außerdem bietet WebdriverIO eine Reihe von praktischen Methoden, die zur Verwendung empfohlen werden um mit dem [Browser](/docs/api/browser) oder [Elementen](/docs/api/element) auf der Seite zu interagieren.

Zusätzlich stehen folgende Befehle zur Verfügung:

| Namen                | Parameter                                                                                                              | Details                                                                                                                                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Ermöglicht die Definition benutzerdefinierter Befehle, die aus dem Browser-Objekt für Kompositionszwecke aufgerufen werden können. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands)                                                     |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to overwrite any browser command with custom functionality. Verwenden Sie diese Funktionalität sorgfältig, da es Framework-Benutzer verwirren kann. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands#overwriting-native-commands) |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Befehl um eine benutzerdefinierte Selektorstrategie zu definieren, lesen Sie mehr in der [Selectors](/docs/selectors#custom-selector-strategies) Anleitung.                                                                                                       |

## Bemerkungen

### Mobile Markierungen

Wenn sich Ihr Test anders verhalten soll, basierend darauf, ob dieser auf einem Mobilen-Endgerät ausgeführt wird oder nicht, können Sie auf die mobilen Attribute der Session zurückgreifen.

Zum Beispiel mit dieser Konfiguration:

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
