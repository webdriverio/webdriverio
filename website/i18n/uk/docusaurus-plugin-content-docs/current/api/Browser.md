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
| `capabilities`          | `Object`   | Призначені параметри з віддаленого сервера.<br /><b>Приклад:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                                              |
| `requestedCapabilities` | `Object`   | Параметри, що були надіслані на віддалений сервер.<br /><b>Приклад:</b><pre>{ browserName: 'chrome' }</pre>                                       |
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
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Дозволяє визначити спеціальну стратегію селектора. Докладніше читайте в розділі [Селектори](/docs/selectors#custom-selector-strategies).                                                                                                                          |

## Примітки

### Мобільні Прапорці

Якщо вам потрібно налаштувати свій тест залежно від того, чи працює ваш сеанс на мобільному пристрої, ви можете використати мобільні прапорці, щоб перевірити це.

Наприклад, із цією конфігурацією:

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

#### `request.performance`
This is an event to measure WebDriver level operations. Whenever WebdriverIO sends a request to the WebDriver backend, this event will be emitted with some useful information:

- `durationMillisecond`: Time duration of the request in millisecond.
- `error`: Error object if the request failed.
- `request`: Request object. You can find url, method, headers, etc.
- `retryCount`: If it's `0`, the request was the first attempt. It will increase when WebDriverIO retries under the hood.
- `success`: Boolean to represent the request was succeeded or not. If it's `false`, `error` property will be provided as well.

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

You can set custom commands on the browser scope to abstract away workflows that are commonly used. Check out our guide on [Custom Commands](/docs/customcommands#adding-custom-commands) for more information.
