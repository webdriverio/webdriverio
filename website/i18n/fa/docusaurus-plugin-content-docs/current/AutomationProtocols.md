---
id: automationProtocols
title: پروتکل های اتوماسیون
---

با WebdriverIO، هنگام اجرای تست های E2E خود به صورت محلی یا در فضای ابری، می توانید بین چندین فناوری اتوماسیون یکی را انتخاب کنید. به طور پیش فرض WebdriverIO همیشه یک درایور مرورگر را بررسی می کند که با پروتکل WebDriver در `localhost:4444`مطابقت داشته باشد. اگر نتواند چنین درایوری را پیدا کند، به استفاده از ابزار توسعه کروم با استفاده از Puppeteer در لایه های زیرین بازمی‌گردد.

تقریباً تمام مرورگرهای مدرنی که از [WebDriver](https://w3c.github.io/webdriver/) پشتیبانی می کنند، از رابط بومی دیگری به نام [DevTools](https://chromedevtools.github.io/devtools-protocol/) نیز پشتیبانی می کنند که می تواند برای اهداف اتوماسیون استفاده شود.

هر دو بسته به مورد استفاده و همچنین بسته به محیط شما، مزایا و معایبی دارند.

## پروتکل WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) یک رابط کنترل از راه دور است که امکان بررسی و کنترل user agent را فراهم می کند. این یک پروتکل خنثی نسبت به پلتفرم و زبان را به عنوان راهی برای برنامه های خارج از فرآیند ارائه می کند تا از راه دور رفتار مرورگرهای وب را آموزش دهند.

پروتکل WebDriver برای خودکارسازی مرورگر از دیدگاه کاربر طراحی شده است، به این معنی که هر کاری که کاربر قادر به انجام آن است، شما می توانید با مرورگر انجام دهید. این پروتکل مجموعه ای از دستورات را ارائه می دهد که تعاملات رایج با یک برنامه کاربردی (مثلاً پیمایش، کلیک کردن، یا خواندن وضعیت یک عنصر) را انتزاعی می کند. از آنجایی که این یک استاندارد وب است، به خوبی در تمام سازندگان اصلی مرورگرها پشتیبانی می شود و همچنین به عنوان پروتکل زیربنایی برای اتوماسیون تلفن همراه با استفاده از [Appium](http://appium.io) استفاده می شود.

برای استفاده از این پروتکل اتوماسیون، به یک سرور پراکسی نیاز دارید که تمام دستورات را ترجمه کرده و در محیط هدف (یعنی مرورگر یا اپلیکیشن موبایل) اجرا کند.

برای اتوماسیون مرورگر، سرور پروکسی معمولاً درایور مرورگر است. درایورهای موجود برای همه مرورگرها وجود دارد:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

برای هر نوع اتوماسیون تلفن همراه، باید [Appium](http://appium.io) را نصب و راه‌اندازی کنید. به شما این امکان را می دهد که برنامه های موبایل (iOS/Android) یا حتی دسکتاپ (macOS/Windows) را با استفاده از همان تنظیمات WebdriverIO خودکار کنید.

همچنین خدمات زیادی وجود دارد که به شما امکان می دهد تست اتوماسیون خود را در فضای ابری در مقیاس بالا انجام دهید. به جای اینکه مجبور باشید همه این درایورها را به صورت محلی راه‌اندازی کنید، می توانید فقط با این سرویس ها (مثلاً [Sauce Labs](https://saucelabs.com)) در فضای ابری صحبت کنید و نتایج را در پلتفرم آنها بررسی کنید. ارتباط بین اسکریپت تست و محیط اتوماسیون به صورت زیر خواهد بود:

![WebDriver Setup](/img/webdriver.png)

### مزایا

- استاندارد وب رسمی W3C که توسط همه مرورگرهای اصلی پشتیبانی می شود
- پروتکل ساده شده که تعاملات متداول کاربر را پوشش می دهد
- پشتیبانی از اتوماسیون موبایل (و حتی برنامه های دسکتاپ بومی)
- قابل استفاده به صورت محلی و همچنین در فضای ابری استفاده کرد از طریق سرویس هایی مانند [Sauce Labs](https://saucelabs.com)

### معایب

- برای تجزیه و تحلیل عمیق مرورگر (به عنوان مثال، ردیابی یا رهگیری رویدادهای شبکه) طراحی نشده است
- مجموعه محدودی از قابلیت های اتوماسیون (به عنوان مثال، عدم پشتیبانی از کنترل CPU یا شبکه)
- تلاش اضافی برای راه‌اندازی درایور مرورگر با سلنیوم مستقل/Chromedriver/و غیره

## پروتکل DevTools

رابط DevTools یک رابط مرورگر بومی است که معمولاً برای اشکال‌زدایی مرورگر از یک برنامه راه دور استفاده می‌شود (مثلاً [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)). Next to its capabilities to inspect the browser in nearly all possible forms, it can also be used to control it.

While every browser used to have its own internal DevTools interface that was not really exposed to the user, more and more browsers are now adopting the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). It is used to either debug a web application using Chrome DevTools or control Chrome using tools like [Puppeteer](https://pptr.dev).

The communication happens without any proxy, directly to the browser using WebSockets:

![DevTools Setup](/img/devtools.png)

WebdriverIO allows you to use the DevTools capabilities as an alternative automation technology for WebDriver if you have special requirements to automate the browser. With the [`devtools`](https://www.npmjs.com/package/devtools) NPM package, you can use the same commands that WebDriver provides, which then can be used by WebdriverIO and the WDIO testrunner to run its useful commands on top of that protocol. It uses Puppeteer to under the hood and allows you to run a sequence of commands with Puppeteer if needed.

To use DevTools as your automation protocol switch the `automationProtocol` flag to `devtools` in your configurations or just run WebdriverIO without a browser driver run in the background.

<Tabs
  defaultValue="testrunner"
  values={[
    {label: 'Testrunner', value: 'testrunner'},
 {label: 'Standalone', value: 'standalone'},
 ]
}>
<TabItem value="testrunner">

```js title="wdio.conf.js"
export const config = {
    // ...
    automationProtocol: 'devtools'
    // ...
}
```
```js title="devtools.e2e.js"
describe('my test', () => {
    it('can use Puppeteer as automation fallback', async () => {
        // WebDriver command
        await browser.url('https://webdriver.io')

        // get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
        const puppeteer = await browser.getPuppeteer()

        // use Puppeteer interfaces
        const page = (await puppeteer.pages())[0]
        await page.setRequestInterception(true)
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('webdriverio.png')) {
                return interceptedRequest.continue({
                    url: 'https://webdriver.io/img/puppeteer.png'
                })
            }

            interceptedRequest.continue()
        })

        // continue with WebDriver commands
        await browser.url('https://webdriver.io')

        /**
         * WebdriverIO logo is no replaced with the Puppeteer logo
         */
    })
})
```

__Note:__ there is no need to have either `selenium-standalone` or `chromedriver` services installed.

We recommend wrapping your Puppeteer calls within the `call` command, so that all calls are executed before WebdriverIO continues with the next WebDriver command.

</TabItem>
<TabItem value="standalone">

```js
import { remote } from 'webdriverio'

const browser = await remote({
    automationProtocol: 'devtools',
    capabilities: {
        browserName: 'chrome'
    }
})

// WebDriver command
await browser.url('https://webdriver.io')

// get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
const puppeteer = await browser.getPuppeteer()

// switch to Puppeteer to intercept requests
const page = (await puppeteer.pages())[0]
await page.setRequestInterception(true)
page.on('request', interceptedRequest => {
    if (interceptedRequest.url().endsWith('webdriverio.png')) {
        return interceptedRequest.continue({
            url: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png'
        })
    }

    interceptedRequest.continue()
})

// continue with WebDriver commands
await browser.refresh()
await browser.pause(2000)

await browser.deleteSession()
```

</TabItem>
</Tabs>

By accessing the Puppeteer interface, you have access to a variety of new capabilities to automate or inspect the browser and your application, e.g. intercepting network requests (see above), tracing the browser, throttle CPU or network capabilities, and much more.

### `wdio:devtoolsOptions` Capability

If you run WebdriverIO tests through the DevTools package, you can apply [custom Puppeteer options](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions). These options will be directly passed into the [`launch`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions) or [`connect`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerconnectoptions) methods of Puppeteer. Other custom devtools options are the following:

#### customPort
Start Chrome on a custom port.

Type: `number`<br /> Default: `9222` (default of Puppeteer)

Note: if you pass in `goog:chromeOptions/debuggerAddress`, `wdio:devtoolsOptions/browserWSEndpoint` or `wdio:devtoolsOptions/browserURL` options, WebdriverIO will try to connect with given connection details rather than starting a browser. For example you can connect to Testingbots cloud via:

```js
import { format } from 'util'
import { remote } from 'webdriverio'

(async () => {
    const browser = await remote({
        capabilities: {
            'wdio:devtoolsOptions': {
                browserWSEndpoint: format(
                    `wss://cloud.testingbot.com?key=%s&secret=%s&browserName=chrome&browserVersion=latest`,
                    process.env.TESTINGBOT_KEY,
                    process.env.TESTINGBOT_SECRET
                )
            }
        }
    })

    await browser.url('https://webdriver.io')

    const title = await browser.getTitle()
    console.log(title) // returns "should return "WebdriverIO - click""

    await browser.deleteSession()
})()
```

### Advantages

- Access to more automation capabilities (e.g. network interception, tracing etc.)
- No need to manage browser drivers

### Disadvantages

- Only supports Chromium based browser (e.g. Chrome, Chromium Edge) and (partially) Firefox
- Does __not__ support execution on cloud vendors such as Sauce Labs, BrowserStack etc.
