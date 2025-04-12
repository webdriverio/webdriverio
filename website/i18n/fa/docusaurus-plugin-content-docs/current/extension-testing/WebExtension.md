---
id: web-extensions
title: تست افزودنی‌های وب
---

WebdriverIO ابزاری ایده آل برای خودکارسازی مرورگر است. افزودنی‌های وب بخشی از مرورگر هستند و می توانند به همان روش خودکار شوند. هر زمان که برنامه افزودنی وب شما از اسکریپت‌های محتوا برای اجرای جاوا اسکریپت در وب‌سایت‌ها استفاده می‌کند یا یک پاپ آپ مدال ارائه می‌دهد، می‌توانید با استفاده از WebdriverIO یک آزمایش e2e برای آن اجرا کنید.

## Loading a Web Extension into the Browser

به عنوان اولین گام باید افزونه تحت آزمایش را به عنوان بخشی از session خود در مرورگر بارگذاری کنیم. این کار برای کروم و فایرفاکس متفاوت است.

:::info

این اسناد از افزونه‌های وب سافاری صرف نظر می‌کند، زیرا پشتیبانی از آن بسیار عقب مانده است و تقاضای کاربر نیز زیاد نیست. اگر در حال ساختن یک افزودنی وب برای سافاری هستید، [یک issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) را مطرح کنید و برای گنجاندن آن در اینجا نیز همکاری کنید.

:::

### Chrome

بارگیری یک برنامه افزودنی وب در کروم را می توان از طریق ارائه یک رشته رمزگذاری شده `base64` از فایل `crx` یا با ارائه مسیری به پوشه افزودنی وب انجام داد. The easiest is just to do the latter by defining your Chrome capabilities as following:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/web-extension/chrome.js
```

:::info

اگر مرورگر دیگری غیر از Chrome را خودکار کنید، مثلاً Brave، Edge یا Opera، به احتمال زیاد گزینه های مرورگر با مثال بالا مطابقت دارد، فقط با استفاده از یک نام قابلیت متفاوت، به عنوان مثال `ms:edgeOptions`.

:::

اگر افزودنی خود را به عنوان فایل `.crx` با استفاده از بسته [crx](https://www.npmjs.com/package/crx) در NPM به صورت فایل کامپایل کنید، می توانید افزودنی همراه را نیز از طریق زیر تزریق کنید:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/web-extension/crx.js
```

### Firefox

برای ایجاد نمایه فایرفاکس که شامل برنامه‌های افزودنی باشد، می‌توانید از سرویس [فایرفاکس پروفایل](/docs/firefox-profile-service) برای تنظیم session خود استفاده کنید. با این حال ممکن است با مشکلی مواجه شوید که برنامه افزودنی شما که محلی توسعه یافته است، به دلیل مشکلات امضا بارگیری نشود. در این حالت می‌توانید از طریق دستور [`installAddOn`](/docs/api/gecko#installaddon) یک افزونه را در هوک `before` بارگذاری کنید، به عنوان مثال:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/web-extension/firefox.js
```

برای تولید یک فایل `.xpi`، توصیه می شود از بسته [`web-ext`](https://www.npmjs.com/package/web-ext) NPM استفاده کنید. می توانید برای مثال برنامه افزودنی خود را با استفاده فرمان از زیر بسته بندی کنید:

```sh
npx web-ext build -s dist/ -a . -n web-extension-firefox.xpi
```

## Tips & Tricks

The following section contains a set useful tips and tricks that can be helpful when testing a web extension.

### Test Popup Modal in Chrome

If you define a `default_popup` browser action entry in your [extension manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) you can test that HTML page directly, since clicking on the extension icon in the browser top bar won't work. Instead, you have to open the popup html file directly.

In Chrome this works by retrieving the extension ID and opening the popup page through `browser.url('...')`. The behavior on that page will be the same as within the popup. To do so we recommend to write the following custom command:

```ts customCommand.ts
export async function openExtensionPopup (this: WebdriverIO.Browser, extensionName: string, popupUrl = 'index.html') {
  if ((this.capabilities as WebdriverIO.Capabilities).browserName !== 'chrome') {
    throw new Error('This command only works with Chrome')
  }
  await this.url('chrome://extensions/')

  const extensions = await this.$$('extensions-item')
  const extension = await extensions.find(async (ext) => (
    await ext.$('#name').getText()) === extensionName
  )

  if (!extension) {
    const installedExtensions = await extensions.map((ext) => ext.$('#name').getText())
    throw new Error(`Couldn't find extension "${extensionName}", available installed extensions are "${installedExtensions.join('", "')}"`)
  }

  const extId = await extension.getAttribute('id')
  await this.url(`chrome-extension://${extId}/popup/${popupUrl}`)
}

declare global {
  namespace WebdriverIO {
      interface Browser {
        openExtensionPopup: typeof openExtensionPopup
      }
  }
}
```

In your `wdio.conf.js` you can import this file and register the custom command in your `before` hook, e.g.:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/popup-modal.js
```

Now, in your test, you can access the popup page via:

```ts
await browser.openExtensionPopup('My Web Extension')
```
