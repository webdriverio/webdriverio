---
id: browser
title: Obiekt przeglądrki (The Browser Object)
---

__Dziedziczy:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

Obiekt przeglądarki (browser object) to instancja sesji, której używasz do sterowania przeglądarką albo urządzeniem mobilnym. Jeśli używasz test runnera WDIO, możesz uzyskać dostęp do instancji WebDrivera za pośrednictwem globalnego obiektu przeglądarki `browser`, sterownika `driver`, lub możesz go zaimportować za pomocą [`@wdio/globals`](/docs/api/globals). Jeśli używasz WebdriverIO w trybie autonomicznym (standalone), obiekt przeglądarki jest zwracany przez metodę [`remote`](/docs/api/modules#remoteoptions-modifier).

Sesja jest inicjowana przez test runner. To samo dotyczy zakończenia sesji. Odbywa się to również w procesie test runnera.

## Właściwości

Obiekt przeglądarki (browser) posiada następujące właściwości:

| Nazwa                   | Typ        | Szczegóły                                                                                                                                                                                                                                                                |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `capabilities`          | `Object`   | Przypisane możliwości (capabilities) ze zdalnego serwera.<br /><b>Przykład:</b><pre>\{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: \{<br />    chromedriverVersion: '105.0.5195.52',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  \},<br />  'goog:chromeOptions': \{ debuggerAddress: 'localhost:64679' \},<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: \{},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: \{ implicit: 0, pageLoad: 300000, script: 30000 \},<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />\}</pre>                                                                                                                                                  |
| `requestedCapabilities` | `Object`   | Możliwości (capabilities) żądane od zdalnego serwera.<br /><b>Przykład:</b><pre>\{ browserName: 'chrome' \}</pre>                                                                                                                                                      |
| `sessionId`             | `String`   | Identyfikator sesji (session id) przypisany ze zdalnego serwera.                                                                                                                                                                                                         |
| `options`               | `Object`   | [Opcje](/docs/configuration) (options) WebdriverIO w zależności od sposobu utworzenia obiektu przeglądarki. Zobacz więcej w sekcji [typy konfiguracji](/docs/setuptypes).                                                                                                |
| `commandList`           | `String[]` | Lista poleceń należących do instancji przeglądarki                                                                                                                                                                                                                       |
| `isW3C`                 | `Boolean`  | Indicates if this is a W3C session                                                                                                                                                                                                                                       |
| `isChrome`              | `Boolean`  | Indicates if this Chrome instance                                                                                                                                                                                                                                        |
| `isFirefox`             | `Boolean`  | Indicates if this Firefox instance                                                                                                                                                                                                                                       |
| `isBidi`                | `Boolean`  | Indicates if this session uses Bidi                                                                                                                                                                                                                                      |
| `isSauce`               | `Boolean`  | Indicates if this session is Running on Sauce Labs                                                                                                                                                                                                                       |
| `isMobile`              | `Boolean`  | Oznaczenie sesji mobilnej. Zobacz więcej w sekcji [Flagi mobilne](#mobile-flags).                                                                                                                                                                                        |
| `isIOS`                 | `Boolean`  | Oznaczenie sesji iOS. Zobacz więcej w sekcji [Flagi mobilne](#mobile-flags).                                                                                                                                                                                             |
| `isAndroid`             | `Boolean`  | Oznaczenie sesji Android. Zobacz więcej w sekcji [Flagi mobilne](#mobile-flags).                                                                                                                                                                                         |
| `isNativeContext`       | `Boolean`  | Indicates if the mobile is in the `NATIVE_APP` context. See more under [Mobile Flags](#mobile-flags).                                                                                                                                                                    |
| `mobileContext`         | `string`   | The will provide the **current** context the driver is in, for example `NATIVE_APP`, `WEBVIEW_<packageName>` for Android or `WEBVIEW_<pid>` for iOS. It will save an extra WebDriver to `driver.getContext()`. See more under [Mobile Flags](#mobile-flags). |


## Metody

Na podstawie backendu automatyzacji używanego w Twojej sesji, WebdriverIO określa, które [Polecenia protokołu](/docs/api/protocols) (protocol commands) zostaną dołączone do [obiektu przeglądarki](/docs/api/browser). Na przykład, jeśli uruchomisz zautomatyzowaną sesję w Chrome, będziesz mieć dostęp do poleceń specyficznych dla Chromium, takich jak [`elementHover`](/docs/api/chromium#elementhover), ale nie będziesz mieć dostępu do żadnego z [poleceń Appium](/docs/api/appium).

Ponadto WebdriverIO zapewnia zestaw wygodnych metod, które są rekomendowane w celu interakcji z [przeglądarką](/docs/api/browser) lub [elementami](/docs/api/element) na stronie.

Oprócz tego dostępne są następujące polecenia:

| Nazwa                | Parametry                                                                                                              | Szczegóły                                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Umożliwia zdefiniowanie niestandardowych poleceń, które mogą być wywoływane z obiektu przeglądarki do celów kompozycji. Przeczytaj więcej w przewodniku [Niestandardowe polecenie](/docs/customcommands) (custom command).                                                                                               |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Pozwala zastąpić dowolne polecenie przeglądarki niestandardową funkcjonalnością. Zachowaj ostrożność przy korzystaniu z tej metody, ponieważ może zdezorientować użytkowników frameworka. Przeczytaj więcej w przewodniku [Niestandardowe polecenie](/docs/customcommands#overwriting-native-commands) (custom command). |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Pozwala zdefiniować niestandardową strategię selektora, więcej w przewodniku [Selektory](/docs/selectors#custom-selector-strategies).                                                                                                                                                                                    |

## Uwagi

### Flagi mobilne

W razie konieczności modyfikacji testów na podstawie tego, czy sesja działa na urządzeniu mobilnym, możesz uzyskać dostęp do flag urządzeń mobilnych, aby to sprawdzić.

Na przykład, biorąc pod uwagę tę konfigurację:

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

Możesz uzyskać dostęp do tych flag w swoim teście w następujący sposób:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

Taki zabieg może okazać się pomocny, jeżeli, na przykład, chcesz zdefiniować selektory w ramach [page objects](../pageobjects) na podstawie typu urządzenia, jak poniżej:

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

Możesz także użyć tych flag, aby uruchomić tylko niektóre testy dla określonych typów urządzeń:

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

### Eventy
Obiekt przeglądarki jest EventEmitterem i emitowanych jest kilka eventów dla różnych przypadków użycia.

Poniżej znajduje się lista eventów. Pamiętaj, że nie jest to jeszcze pełna lista wszystkich dostępnych eventów. Możesz pomóc w aktualizacji dokumentu, dodając brakujące opisy eventów.

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

#### `request.performance`
Event mający na celu pomiar wydajności na poziomie WebDrivera. Ilekroć WebdriverIO wyśle żądanie do backendu WebDrivera, event zostanie wyemitowany z kilkoma przydatnymi informacjami:

- `durationMillisecond`: Czas trwania żądania w milisekundach.
- `error`: Błąd obiektu, jeśli żądanie się nie powiodło.
- `request`: Obiekt żądania. Zawiera url, metodę, nagłówki itp.
- `retryCount`: Jeśli zwrócone zostanie `0`, żądanie było pierwszą próbą. Wzrośnie po tym, jak WebDriverIO ponownie spróbuje wykonać żądanie.
- `success`: Zwraca wartość typu boolean na bazie tego, czy żądanie zakończyło się sukcesem lub nie. Jeśli zwrócony będzie `false`, zostanie przekazana również właściwość `error`.

Przykładowy event:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Niestandardowe polecenia

Możesz ustawić niestandardowe polecenia w zakresie przeglądarki, aby wyodrębnić często wykorzystywane przypadki użycia. Aby uzyskać więcej informacji, zapoznaj się z naszym przewodnikiem na temat [poleceń niestandardowych](/docs/customcommands#adding-custom-commands).
