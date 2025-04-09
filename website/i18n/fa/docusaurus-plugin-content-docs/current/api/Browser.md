---
id: browser
title: آبجکت Browser
---

__گسترشی برای:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

آبجکت Browser نمونه شیئی است که برای کنترل مرورگر یا تلفن همراه از آن استفاده می‌کنید. اگر از اجرا کننده WDIO استفاده می‌کنید، می‌توانید به نمونه WebDriver از طریق شیء جهانی `browser` یا `driver` دسترسی داشته باشید یا آن را با استفاده از [`@wdio/globals`](/docs/api/globals)ایمپورت کنید. اگر از WebdriverIO در حالت مستقل استفاده می کنید، شی browser از طریق تابع [`remote`](/docs/api/modules#remoteoptions-modifier) برگردانده می شود.

یک session توسط اجرا کننده تست مقداردهی اولیه می شود. در مورد پایان دادن به session نیز همین امر برقرار است. این امر نیز توسط اجرا کننده تست انجام می‌پذیرد.

## ویژگی ها

یک شی browser دارای ویژگی های زیر است:

| نام                       | نوع        | جزئیات                                                                                                                                                                                                                                                                   |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `قابلیت ها(capabilities)` | `شیء`      | Assigned capabilities from the remote server.<br /><b>Example:</b><pre>\{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: \{<br />    chromedriverVersion: '105.0.5195.52',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  \},<br />  'goog:chromeOptions': \{ debuggerAddress: 'localhost:64679' \},<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: \{},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: \{ implicit: 0, pageLoad: 300000, script: 30000 \},<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />\}</pre>                                                                                                                                                              |
| `قابلیت های درخواست شده`  | `شیء`      | قابلیت (capabilitie) درخواست شده از طرف سرور remote.<br /><b>مثال:</b><pre>\{ browserName: 'chrome' \}</pre>                                                                                                                                                       |
| `sessionId`               | `String`   | Session id که از سرور remote اختصاص داده شده است.                                                                                                                                                                                                                        |
| `options`                 | `Object`   | [options](/docs/configuration) های WebdriverIO که به این بستگی دارد که شئ browser چگونه ایجاد شده است. اطلاعات بیشتر در [راه اندازی types](/docs/setuptypes).                                                                                                            |
| `commandList`             | `String[]` | لیستی از دستورات ثبت شده در نمونه ی browser                                                                                                                                                                                                                              |
| `isW3C`                   | `Boolean`  | Indicates if this is a W3C session                                                                                                                                                                                                                                       |
| `isChrome`                | `Boolean`  | Indicates if this Chrome instance                                                                                                                                                                                                                                        |
| `isFirefox`               | `Boolean`  | Indicates if this Firefox instance                                                                                                                                                                                                                                       |
| `isBidi`                  | `Boolean`  | Indicates if this session uses Bidi                                                                                                                                                                                                                                      |
| `isSauce`                 | `Boolean`  | Indicates if this session is Running on Sauce Labs                                                                                                                                                                                                                       |
| `isMacApp`                | `Boolean`  | Indicates if this session is Running for a native Mac App                                                                                                                                                                                                                |
| `isWindowsApp`            | `Boolean`  | Indicates if this session is Running for a native Windows App                                                                                                                                                                                                            |
| `isMobile`                | `Boolean`  | یک session برای تلفن همراه را نشان می دهد. در [پرچم های موبایل](#mobile-flags) بیشتر بخوانید.                                                                                                                                                                            |
| `isIOS`                   | `Boolean`  | یک session برای ios را نشان می دهد. در [پرچم های موبایل](#mobile-flags) بیشتر بخوانید.                                                                                                                                                                                   |
| `isAndroid`               | `Boolean`  | یک session برای Android را نشان می دهد. در [پرچم های موبایل](#mobile-flags) بیشتر بخوانید.                                                                                                                                                                               |
| `isNativeContext`         | `Boolean`  | Indicates if the mobile is in the `NATIVE_APP` context. See more under [Mobile Flags](#mobile-flags).                                                                                                                                                                    |
| `mobileContext`           | `string`   | The will provide the **current** context the driver is in, for example `NATIVE_APP`, `WEBVIEW_<packageName>` for Android or `WEBVIEW_<pid>` for iOS. It will save an extra WebDriver to `driver.getContext()`. See more under [Mobile Flags](#mobile-flags). |


## متود ها(توابع)

بر اساس پشتیبان اتوماسیون مورد استفاده برای session شما، WebdriverIO مشخص می کند که کدام [دستور های پروتکل](/docs/api/protocols) به شی [browser](/docs/api/browser) متصل می شود. برای مثال، اگر یک session خودکار را در Chrome اجرا کنید، به دستورات خاص Chromium مانند [`elementHover`](/docs/api/chromium#elementhover) دسترسی خواهید داشت اما به هیچ یک از [فرمان های Appium](/docs/api/appium) دسترسی ندارید.

علاوه بر این WebdriverIO مجموعه ای از روش های راحت را ارائه می دهد که برای تعامل با مرورگر [](/docs/api/browser) یا [عناصر](/docs/api/element) در صفحه توصیه می شود از آنها استفاده کنید.

علاوه بر آن دستورات زیر نیز موجود است:

| نام                  | پارامترها                                                                                                              | جزئیات                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | اجازه می دهد تا دستورات سفارشی را تعریف کرد که می توان از شی browser برای ترکیب های مختلف فراخوانی شود. در راهنمای [Custom Command](/docs/customcommands) بیشتر بخوانید.                                                     |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Allows to overwrite any browser command with custom functionality. با دقت استفاده شود زیرا می تواند کاربران فریمورک را گیج کند. در راهنمای [Custom Command](/docs/customcommands#overwriting-native-commands) بیشتر بخوانید. |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Allows to define a custom selector strategy, read more in the [Selectors](/docs/selectors#custom-selector-strategies) guide.                                                                                                 |

## ملاحظات

### پرچم های موبایل

اگر نیاز دارید تست خود را بر اساس اینکه آیا session شما در دستگاه تلفن همراه اجرا می شود یا نه تغییر دهید، می توانید برای بررسی پرچم های تلفن همراه را چک کنید.

به عنوان مثال، با توجه به این پیکربندی:

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

شما می توانید در تست خود به این پرچم ها دسترسی داشته باشید:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

این موضوع می تواند مفید باشد اگر برای مثال بخواهید انتخابگر خودتان را در [ اشیاء صفحه](../pageobjects) بر اساس نوع دستگاه تعریف کنید. برای مثال:

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

همچنین می‌توانید از این پرچم‌ها برای اجرای تست‌های خاص برای انواع دستگاه‌های خاص استفاده کنید:

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

### رویدادها
شی browser یک EventEmitter است و چند رویداد برای استفاده های مختلف شما ارسال می شود.

در اینجا لیستی از رویدادها وجود دارد. به خاطر داشته باشید که این هنوز لیست کامل رویدادهای موجود نیست. شما می توانید سند را با افزودن توضیحات بیشتر به روز رسانی کنید.

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
این رویدادی برای اندازه گیری عملیات ها در سطح WebDriver است. هر زمان که WebdriverIO درخواستی را به Backend WebDriver ارسال می کند، این رویداد با اطلاعات مفیدی منتشر می شود:

- `durationMillisecond`: مدت زمان درخواست بر حسب میلی ثانیه.
- `error`: در صورت عدم موفقیت درخواست، شیء خطا.
- `request`: شی درخواست. شما می توانید آدرس صفحه، روش ارسال، هدر و غیره را پیدا کنید.
- `retryCount`: اگر `0`باشد، درخواست اولین تلاش بوده است. زمانی که WebDriverIO دوباره در لایه های زیرین تلاش می کند، افزایش می یابد.
- `success`: مقدار بولین برای نشان دادن موفقیت درخواست. اگر `false`باشد، ویژگی `error` نیز ارائه خواهد شد.

یک رویداد نمونه:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### دستورات سفارشی

می‌توانید دستورات سفارشی را در محدوده browser تنظیم کنید تا کار هایی که به طور مرتب استفاده می‌شود را در جایی دور انتزاعی کنید. برای اطلاعات بیشتر راهنمای ما در مورد [دستورات سفارشی](/docs/customcommands#adding-custom-commands) را بررسی کنید.
