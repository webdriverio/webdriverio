---
id: browser
title: L'objet Browser
---

__Comprend :__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

L'objet "browser" est l'instance de session que vous utilisez pour contrôler le navigateur ou périphérique mobile. Si vous utilisez l'exécuteur de test WDIO, vous pouvez accéder à l'instance WebDriver via l'objet global `browser` ou `driver` ou l'importer à l'aide de [`@wdio/globals`](/docs/api/globals). Si vous utilisez WebdriverIO en mode autonome, l'objet `browser` est renvoyé par la méthode [`remote`](/docs/api/modules#remoteoptions-modifier).

La session est initialisée par l'exécuteur de test. Il en va de même pour la clôture de la session. Cela est également fait par le processus d'exécuteur de test.

## Attributs

Un objet `browser` possède les propriétés suivantes :

| Nom                   | Type       | Détails                                                                                                                                                                                                                                                                  |
| --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `capacités`           | `Object`   | Assigned capabilities from the remote server.<br /><b>Example:</b><pre>\{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: \{<br />    chromedriverVersion: '105.0.5195.52',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  \},<br />  'goog:chromeOptions': \{ debuggerAddress: 'localhost:64679' \},<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: \{},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: \{ implicit: 0, pageLoad: 300000, script: 30000 \},<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />\}</pre>                                                                                                                                                              |
| `capacités demandées` | `Object`   | Capacités demandées au serveur distant.<br /><b>Exemple :</b><pre>\{ browserName: 'chrome' \}</pre>                                                                                                                                                                    |
| `sessionId`           | `String`   | Id de session attribué à partir du serveur distant.                                                                                                                                                                                                                      |
| `options`             | `Object`   | WebdriverIO [options](/docs/configuration) selon la façon dont l'objet navigateur a été créé. Voir plus [types de configuration](/docs/setuptypes).                                                                                                                      |
| `commandList`         | `String[]` | Une liste de commandes enregistrées dans l'instance du navigateur                                                                                                                                                                                                        |
| `isW3C`               | `Boolean`  | Indicates if this is a W3C session                                                                                                                                                                                                                                       |
| `isChrome`            | `Boolean`  | Indicates if this Chrome instance                                                                                                                                                                                                                                        |
| `isFirefox`           | `Boolean`  | Indicates if this Firefox instance                                                                                                                                                                                                                                       |
| `isBidi`              | `Boolean`  | Indicates if this session uses Bidi                                                                                                                                                                                                                                      |
| `isSauce`             | `Boolean`  | Indicates if this session is Running on Sauce Labs                                                                                                                                                                                                                       |
| `isMacApp`            | `Boolean`  | Indicates if this session is Running for a native Mac App                                                                                                                                                                                                                |
| `isWindowsApp`        | `Boolean`  | Indicates if this session is Running for a native Windows App                                                                                                                                                                                                            |
| `isMobile`            | `Boolean`  | Indique une session mobile. Voir plus sous [Mobile Flags](#mobile-flags).                                                                                                                                                                                                |
| `isIOS`               | `Boolean`  | Indique une session iOS. Voir plus sous [Mobile Flags](#mobile-flags).                                                                                                                                                                                                   |
| `isAndroid`           | `Boolean`  | Indique une session Android. Voir plus sous [Mobile Flags](#mobile-flags).                                                                                                                                                                                               |
| `isNativeContext`     | `Boolean`  | Indicates if the mobile is in the `NATIVE_APP` context. See more under [Mobile Flags](#mobile-flags).                                                                                                                                                                    |
| `mobileContext`       | `string`   | The will provide the **current** context the driver is in, for example `NATIVE_APP`, `WEBVIEW_<packageName>` for Android or `WEBVIEW_<pid>` for iOS. It will save an extra WebDriver to `driver.getContext()`. See more under [Mobile Flags](#mobile-flags). |


## Méthodes

Basé sur le backend d'automatisation utilisé pour votre session, WebdriverIO identifie quelles [commandes du protocole](/docs/api/protocols) seront attachées à l'objet [browser](/docs/api/browser). Par exemple, si vous lancez une session automatisée dans Chrome, vous aurez accès aux commandes spécifiques à Chromium telles que [`elementHover`](/docs/api/chromium#elementhover) mais aucune des [commandes Appium](/docs/api/appium).

De plus, WebdriverIO fournit un ensemble de méthodes pratiques qu'il est recommandé d'utiliser pour interagir avec [le navigateur](/docs/api/browser) ou [les éléments](/docs/api/element) sur la page.

En plus de cela, les commandes suivantes sont disponibles :

| Nom                  | Paramètres                                                                                                             | Détails                                                                                                                                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Permet de définir des commandes personnalisées pouvant être appelées depuis l'objet `browser` à des fins de composition. Pour en savoir plus, consultez le guide [Commande personnalisée](/docs/customcommands).                                                                                          |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Permet d'écraser n'importe quelle commande de navigateur avec des fonctionnalités personnalisées. Utilisez-le avec précaution car cela peut perturber les utilisateurs du framework . Pour en savoir plus, consultez le guide [Commande personnalisée](/docs/customcommands#overwriting-native-commands). |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Permet de définir une stratégie de sélection personnalisée, Pour en savoir plus consultez le guide de [Sélections](/docs/selectors#custom-selector-strategies).                                                                                                                                           |

## Remarques

### Drapeaux mobiles

Si vous devez modifier votre test selon que votre session s'exécute ou non sur un appareil mobile, vous pouvez accéder aux indicateurs mobiles à vérifier.

Par exemple, compte tenu de cette configuration :

```js
// wdio.conf.js
export const config = {
    // ...
    // wdio.conf.js
export const config = {
    // ...
    }
    // ...
}
```

Vous pouvez accéder à ces drapeaux dans votre test comme suit :

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

Cela peut être utile si, par exemple, vous souhaitez définir des sélecteurs dans vos [objets de page](../pageobjects) en fonction du type d'appareil, comme ceci :

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

Vous pouvez également utiliser ces indicateurs pour exécuter uniquement certains tests pour certains types d'appareils :

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

### Événements
L'objet `browser` est un EventEmitter et quelques événements sont émis pour vos cas d'utilisation.

Voici une liste d'événements. Gardez à l'esprit qu'il ne s'agit pas de la liste complète des événements disponibles. N'hésitez pas à contribuer en mettant à jour le document et en ajoutant des descriptions des autres événements ici.

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
Il s'agit d'un événement pour mesurer les opérations au niveau WebDriver. Chaque fois que WebdriverIO envoie une requête au backend WebDriver, cet événement sera émis avec quelques informations utiles :

- `durationMillisecond`: Durée de la requête en milliseconde.
- `error`: objet d'erreur si la requête a échoué.
- `request`: Objet de la requête. Vous pouvez trouver l'Url, la méthode, les en-têtes, etc.
- `retryCount`: Si c'est `0`, la requête était la première tentative. Il augmentera lorsque WebDriverIO réessaiera par la suite.
- `success`: Booléen pour représenter si la requête a été réussi ou non. Si c'est `false`, la propriété `error` sera également fournie.

Un exemple d'événement :
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Commandes personnalisées

Vous pouvez définir des commandes personnalisées sur la portée du navigateur pour abstraire les workflows qui sont couramment utilisés. Consultez notre guide sur [Commandes personnalisées](/docs/customcommands#adding-custom-commands) pour plus d'informations.
