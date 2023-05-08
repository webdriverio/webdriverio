---
id: web-extension-testing
title: تست افزودنی‌های وب
---

WebdriverIO ابزاری ایده آل برای خودکارسازی مرورگر است. افزودنی‌های وب بخشی از مرورگر هستند و می توانند به همان روش خودکار شوند. هر زمان که برنامه افزودنی وب شما از اسکریپت‌های محتوا برای اجرای جاوا اسکریپت در وب‌سایت‌ها استفاده می‌کند یا یک پاپ آپ مدال ارائه می‌دهد، می‌توانید با استفاده از WebdriverIO یک آزمایش e2e برای آن اجرا کنید.

## بارگیری یک افزودنی وب در مرورگر

به عنوان اولین گام باید افزونه تحت آزمایش را به عنوان بخشی از session خود در مرورگر بارگذاری کنیم. این کار برای کروم و فایرفاکس متفاوت است.

:::info

این اسناد از افزونه‌های وب سافاری صرف نظر می‌کند، زیرا پشتیبانی از آن بسیار عقب مانده است و تقاضای کاربر نیز زیاد نیست. اگر در حال ساختن یک افزودنی وب برای سافاری هستید، [یک issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) را مطرح کنید و برای گنجاندن آن در اینجا نیز همکاری کنید.

:::

### Chrome

بارگیری یک برنامه افزودنی وب در کروم را می توان از طریق ارائه یک رشته رمزگذاری شده `base64` از فایل `crx` یا با ارائه مسیری به پوشه افزودنی وب انجام داد. ساده‌ترین کار این است که دومین پیشنهاد را با تعریف قابلیت های Chrome خود به صورت زیر انجام دهید:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            // given your wdio.conf.js is in the root directory and your compiled
            // web extension files are located in the `./dist` folder
            args: [`--load-extension=${path.join(__dirname, '..', '..', 'dist')}`]
        }
    }]
}
```

:::info

اگر مرورگر دیگری غیر از Chrome را خودکار کنید، مثلاً Brave، Edge یا Opera، به احتمال زیاد گزینه های مرورگر با مثال بالا مطابقت دارد، فقط با استفاده از یک نام قابلیت متفاوت، به عنوان مثال `ms:edgeOptions`.

:::

اگر افزودنی خود را به عنوان فایل `.crx` با استفاده از بسته [crx](https://www.npmjs.com/package/crx) در NPM به صورت فایل کامپایل کنید، می توانید افزودنی همراه را نیز از طریق زیر تزریق کنید:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extPath = path.join(__dirname, `web-extension-chrome.crx`)
const chromeExtension = (await fs.readFile(extPath)).toString('base64')

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            extensions: [chromeExtension]
        }
    }]
}
```

### Firefox

برای ایجاد نمایه فایرفاکس که شامل برنامه‌های افزودنی باشد، می‌توانید از سرویس [فایرفاکس پروفایل](/docs/firefox-profile-service) برای تنظیم session خود استفاده کنید. با این حال ممکن است با مشکلی مواجه شوید که برنامه افزودنی شما که محلی توسعه یافته است، به دلیل مشکلات امضا بارگیری نشود. در این حالت می‌توانید از طریق دستور [`installAddOn`](/docs/api/gecko#installaddon) یک افزونه را در هوک `before` بارگذاری کنید، به عنوان مثال:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extensionPath = path.resolve(__dirname, `web-extension.xpi`)

export const config = {
    // ...
    before: async (capabilities) => {
        const browserName = (capabilities as Capabilities.Capabilities).browserName
        if (browserName === 'firefox') {
            const extension = await fs.readFile(extensionPath)
            await browser.installAddOn(extension.toString('base64'), true)
        }
    }
}
```

برای تولید یک فایل `.xpi`، توصیه می شود از بسته [`web-ext`](https://www.npmjs.com/package/web-ext) NPM استفاده کنید. می توانید برای مثال برنامه افزودنی خود را با استفاده فرمان از زیر بسته بندی کنید:

```sh
npx web-ext build -s dist/ -a . -n web-extension-firefox.xpi
```
