---
id: browser
title: Об'єкт Browser
---

__Успадковується від:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

Об’єкт браузера – це екземпляр сеансу, який ви використовуєте для керування браузером або мобільним пристроєм. Якщо ви використовуєте засіб виконання тестів WebdriverIO, ви можете отримати доступ до екземпляра Browser через глобальні змінні `browser` або `driver` або імпортувати його з пакунка [`@wdio/globals`](/docs/api/globals). Якщо ви використовуєте WebdriverIO в автономному режимі, екземпляр Browser повертається методом [`remote`](/docs/api/modules#remoteoptions-modifier).

Сеанс ініціалізується виконавцем тесту. Те саме стосується завершення сеансу. Це також виконується процесом виконання тестів.

## Властивості

Об’єкт браузера має такі властивості:

| Назва                   | Тип        | Опис                                                                                                                                                   |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `capabilities`          | `Object`   | Assigned capabilities from the remote server.<br /><b>Example:</b><pre>\{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: \{<br />    chromedriverVersion: '105.0.5195.52',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  \},<br />  'goog:chromeOptions': \{ debuggerAddress: 'localhost:64679' \},<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: \{},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: \{ implicit: 0, pageLoad: 300000, script: 30000 \},<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />\}</pre>                                            |
| `requestedCapabilities` | `Object`   | Параметри, що були надіслані на віддалений сервер.<br /><b>Приклад:</b><pre>\{ browserName: 'chrome' \}</pre>                                       |
| `sessionId`             | `String`   | Ідентифікатор сеансу, призначений з віддаленого сервера.                                                                                               |
| `options`               | `Object`   | WDIO [параметри](/docs/configuration) які використовувались для створення об’єкту браузера. Подивитися більше про [способи запуску](/docs/setuptypes). |
| `commandList`           | `String[]` | Список команд, зареєстрованих в екземплярі браузера                                                                                                    |
| `isMobile`              | `Boolean`  | Вказує на мобільний сеанс. Подивіться більше про [мобільні прапорці](#mobile-flags).                                                                   |
| `isIOS`                 | `Boolean`  | Вказує на сеанс iOS. Подивіться більше про [мобільні прапорці](#mobile-flags).                                                                         |
| `isAndroid`             | `Boolean`  | Вказує на сеанс Android. Подивіться більше про [мобільні прапорці](#mobile-flags).                                                                     |

## Методи

На основі серверної частини автоматизації, яка використовується для вашого сеансу, WebdriverIO визначає, які [команди протоколів](/docs/api/protocols) будуть приєднані до [об’єкта браузера](/docs/api/browser). Наприклад, якщо ви запускаєте автоматизований сеанс у Chrome, ви матимете доступ до спеціальних команд Chromium, таких як [`elementHover`](/docs/api/chromium#elementhover), але не до жодної з [команд Appium](/docs/api/appium).

Крім того, WebdriverIO надає набір зручних методів, які рекомендується використовувати для взаємодії з [браузером](/docs/api/browser) або [елементами](/docs/api/element) на сторінці.

На додаток до цього доступні такі команди:

| Назва                | Параметри                                                                                                              | Опис                                                                                                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Дозволяє додати спеціальні команди, які можна викликати з об’єкта браузера для цілей композиції. Докладніше читайте в розділі [Клієнтські Команди](/docs/customcommands).                                                                                         |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Дозволяє перезаписувати будь-яку команду браузера клієнтською функціональністю. Використовуйте обережно, оскільки це може заплутати користувачів фреймворку. Докладніше читайте в розділі [Клієнтські Команди](/docs/customcommands#overwriting-native-commands). |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Allows to define a custom selector strategy, read more in the [Selectors](/docs/selectors#custom-selector-strategies) guide.                                                                                                                                      |

## Примітки

### Мобільні Прапорці

Якщо вам потрібно налаштувати свій тест залежно від того, чи працює ваш сеанс на мобільному пристрої, ви можете використати мобільні прапорці, щоб перевірити це.

Наприклад, із цією конфігурацією:

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

Ви зможете отримати доступ до таких прапорців у своєму тесті:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

Це може бути корисним, якщо, наприклад, ви хочете визначити селектори у своїх [об’єктах сторінки](../pageobjects) на основі типу пристрою, як це:

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

Ви також можете використовувати ці прапорці для запуску лише певних тестів для певних типів пристроїв:

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

### Події
Об’єкт браузера є також і об'єктом EventEmitter, і деякі подій викликатимуться залежно від використання.

Ось список подій. Майте на увазі, що це ще не повний список доступних подій. Не соромтеся робити свій внесок в оновлення документа, додаючи тут описи інших подій.

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
Це подія для відстежування операцій на рівні WebDriver протоколу. Кожного разу, коли WebdriverIO надсилає запит на WebDriver сервер, цю подію буде викликано з параметрами:

- `durationMillisecond`: тривалість запиту в мілісекундах.
- `error`: об’єкт помилки, якщо запит провалився.
- `request`: об'єкт запиту, де можна знайти адресу, метод, заголовки тощо.
- `retryCount`: кількість спроб, якщо дорівнює `0`, запит був першою спробою. Він збільшиться, коли WebDriverIO повторить спробу під капотом.
- `success`: логічне значення, що вказує на те чи було виконано запит. Якщо дорівнює `false`, властивість `error` також буде присутня.

Приклад події:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Клієнтські Команди

Ви можете додати власні команди до об'єкта браузера, щоб абстрагувати набори команд які часто використовуються. Ознайомтеся з нашим розділом про [Користувацькі Команди](/docs/customcommands#adding-custom-commands), щоб дізнатися більше.
