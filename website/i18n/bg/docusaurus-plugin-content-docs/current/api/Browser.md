---
id: browser
title: Обектът на браузъра
---

__Разширява:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

Обектът на браузъра е инстанцията на сесията, с която управлявате браузъра или мобилното устройство. Ако използвате WDIO test runner, можете да получите достъп до инстанцията на WebDriver чрез глобалния `browser` или `driver` обект или да го импортирате с помощта на [`@wdio/globals`](/docs/api/globals). Ако използвате WebdriverIO в самостоятелен режим, обектът на браузъра се връща от [`remote`](/docs/api/modules#remoteoptions-modifier) метод.

Сесията се инициализира от програмата за провеждане на тестове. Същото важи и за приключването на сесията. Това се прави и от процеса на тестване.

## Свойства

Обектът на браузъра има следните свойства:

| Name                    | Type       | Детайли                                                                                                                                                                                                                                                                  |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `capabilities`          | `Object`   | Присвоени възможности от отдалечения сървър.<br /><b>Пример:</b><pre></pre>                                                                                                                                                               |
| `requestedCapabilities` | `Object`   | Възможности, поискани от отдалечения сървър.<br /><b>Пример:</b><pre>\{ browserName: 'chrome' \}</pre>                                                                                                                                                               |
| `sessionId`             | `String`   | Идентификатор на сесията, присвоен от отдалечения сървър.                                                                                                                                                                                                                |
| `options`               | `Object`   | WebdriverIO [options](/docs/configuration) в зависимост от това как е създаден обектът на браузъра. Вижте още [типове настройки](/docs/setuptypes).                                                                                                                      |
| `commandList`           | `String[]` | Списък на командите, регистрирани в инстанцията на браузъра                                                                                                                                                                                                              |
| `isW3C`                 | `Boolean`  | Indicates if this is a W3C session                                                                                                                                                                                                                                       |
| `isChrome`              | `Boolean`  | Indicates if this Chrome instance                                                                                                                                                                                                                                        |
| `isFirefox`             | `Boolean`  | Indicates if this Firefox instance                                                                                                                                                                                                                                       |
| `isBidi`                | `Boolean`  | Indicates if this session uses Bidi                                                                                                                                                                                                                                      |
| `isSauce`               | `Boolean`  | Indicates if this session is Running on Sauce Labs                                                                                                                                                                                                                       |
| `isMacApp`              | `Boolean`  | Indicates if this session is Running for a native Mac App                                                                                                                                                                                                                |
| `isWindowsApp`          | `Boolean`  | Indicates if this session is Running for a native Windows App                                                                                                                                                                                                            |
| `isMobile`              | `Boolean`  | Показва мобилна сесия. Вижте още в [Мобилни флагове](#mobile-flags).                                                                                                                                                                                                     |
| `isIOS`                 | `Boolean`  | Показва сесия в iOS. Вижте още в [Мобилни флагове](#mobile-flags).                                                                                                                                                                                                       |
| `isAndroid`             | `Boolean`  | Показва сесия на Android. Вижте още в [Мобилни флагове](#mobile-flags).                                                                                                                                                                                                  |
| `isNativeContext`       | `Boolean`  | Indicates if the mobile is in the `NATIVE_APP` context. See more under [Mobile Flags](#mobile-flags).                                                                                                                                                                    |
| `mobileContext`         | `string`   | The will provide the **current** context the driver is in, for example `NATIVE_APP`, `WEBVIEW_<packageName>` for Android or `WEBVIEW_<pid>` for iOS. It will save an extra WebDriver to `driver.getContext()`. See more under [Mobile Flags](#mobile-flags). |


## Методи

Въз основа на използвания за сесията ви бекенд за автоматизация, WebdriverIO идентифицира кои [команди на протоколи](/docs/api/protocols) ще бъдат прикрепени към [обект на браузъра](/docs/api/browser). Например, ако стартирате автоматизирана сесия в Chrome, ще имате достъп до специфични за Chromium команди като [`elementHover`](/docs/api/chromium#elementhover), но не и някой от [команди на Appium](/docs/api/appium).

Освен това WebdriverIO предоставя набор от удобни методи, които е препоръчително да се използват, за да се взаимодейства с [браузъра](/docs/api/browser) или [елементи](/docs/api/element) на страницата.

Освен това са налични следните команди:

| Име                  | Параметри                                                                                                              | Детайли                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Позволява да се дефинират потребителски команди, които могат да се извикват от обекта на браузъра за целите на композицията. Прочетете повече в [Наръчник за потребителски команди](/docs/customcommands).                                                                     |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Позволява да се презапише всяка команда на браузъра с персонализирана функционалност. Използвайте го внимателно, тъй като може да обърка структура на потребителите. Прочетете повече в [Наръчник за потребителски команди](/docs/customcommands#overwriting-native-commands). |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Позволява да се дефинира персонализирана стратегия за селектор, прочетете повече в [Селектори](/docs/selectors#custom-selector-strategies) ръководство.                                                                                                                        |

## Забележки

### Мобилни флагове

Ако трябва да модифицирате теста си в зависимост от това дали сесията ви се изпълнява на мобилно устройство, можете да получите достъп до флаговете за мобилни устройства, за да проверите.

Например, при тази конфигурация:

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

Можете да получите достъп до тези флагове в теста си по следния начин:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

Това може да е полезно, ако например искате да дефинирате селектори във вашия [обектите на страницата](../pageobjects) въз основа на типа на устройството, например така:

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

Можете също така да използвате тези флагове, за да стартирате само определени тестове за определени типове устройства:

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

### Събития
Обектът на браузъра е EventEmitter и се излъчват няколко събития за вашите случаи на употреба.

Ето списък на събитията. Имайте предвид, че това все още не е пълният списък на наличните събития. Чувствайте се свободни да допринасяте за актуализирането на документа, като добавяте описания на повече събития тук.

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
Това е събитие за измерване на операциите на ниво WebDriver. Всеки път, когато WebdriverIO изпраща заявка към бекенда на WebDriver, това събитие ще бъде излъчено с полезна информация:

- `durationMillisecond`: Продължителност на заявката в милисекунди.
- `error`: Обект за грешка, ако заявката е неуспешна.
- `request`: Обект на заявката. Можете да намерите url, метод, заглавия и др.
- `retryCount`: Ако е `0`, заявката е на първият опит. Тя ще се увеличи, когато WebDriverIO повтори опитите.
- `success`: Булева, за да покаже, че заявката е била успешна или не. Ако е `false`, `error` ще бъде предоставена и собственост.

Пример за събитие:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Потребителски команди

Можете да зададете потребителски команди в обхвата на браузъра, за да абстрахирате често използваните работни процеси. Разгледайте нашето ръководство за [Подходящи команди](/docs/customcommands#adding-custom-commands) за повече информация.
