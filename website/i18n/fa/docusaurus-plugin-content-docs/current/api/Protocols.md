---
id: protocols
title: Protocol Commands
---

WebdriverIO یک فریمورک اتوماسیون است که برای کنترل یک remote agent، به عنوان مثال برای یک مرورگر، دستگاه تلفن همراه یا تلویزیون، بر پروتکل‌های مختلف اتوماسیون متکی است. بر اساس دستگاه ریموت، پروتکل های مختلفی وارد بازی می شوند. این دستورها بسته به اطلاعات session توسط سرور remote (مثلاً درایور مرورگر) به شیء [Browser](/docs/api/browser) یا [Element](/docs/api/element) اختصاص داده می شوند.

در داخل WebdriverIO تقریباً برای تمام تعاملات با عامل راه دور از دستورات پروتکل استفاده می شود. با این حال دستورات اضافی اختصاص داده شده به [Browser](/docs/api/browser) یا [Element](/docs/api/element) Object استفاده از WebdriverIO را ساده می کند، به عنوان مثال دریافت متن یک element با استفاده از دستورات پروتکل به شکل زیر است:

```js
const searchInput = await browser.findElement('css selector', '#lst-ib')
await client.getElementText(searchInput['element-6066-11e4-a52e-4f735466cecf'])
```

با استفاده از دستورات راحت [Browser](/docs/api/browser) یا [Element](/docs/api/element) Object می توان دستورات را به مورد زیر کاهش داد:

```js
$('#lst-ib').getText()
```

در ادامه هر پروتکل جداگانه توضیح داده می‌شود.

## پروتکل WebDriver

پروتکل [WebDriver](https://w3c.github.io/webdriver/#elements) یک استاندارد وب برای خودکارسازی مرورگر است. این استاندارد، برخلاف برخی دیگر از ابزارهای E2E، تضمین می کند که اتوماسیون را می توان در مرورگر واقعی که توسط کاربران شما استفاده می شود، به عنوان مثال فایرفاکس، سافاری و کروم و مرورگر مبتنی بر Chromium مانند Edge، و نه تنها در موتورهای مرورگر، بلکه به عنوان مثال WebKit، که بسیار متفاوت هستند، انجام داد.

مزیت استفاده از پروتکل WebDriver در مقابل پروتکل‌های اشکال زدایی مانند [Chrome DevTools](https://w3c.github.io/webdriver/#elements) این است که شما مجموعه‌ای از دستورات دارید که اجازه می‌دهد با مرورگر به طور یکسان در تمام مرورگرها تعامل داشته باشید که احتمال ناپایداری تست ها را کاهش می‌دهد. علاوه بر این، توانایی های این پروتکل را برای مقیاس پذیری گسترده با استفاده از ارائه دهندگان خدمات ابری مانند [Sauce Labs](https://saucelabs.com/)، [BrowserStack](https://www.browserstack.com/) و [غیره](https://github.com/christian-bromann/awesome-selenium#cloud-services) ارائه می دهد.

## پروتکل WebDriver Bidi

پروتکل [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) نسل دوم این پروتکل است و در حال حاضر توسط اکثر سازندگان مرورگر بر روی آن کار می شود. Compared to its pre-predecessor the protocol supports a bi-directional communication (hence "Bidi") between the framework and the remote device. It furthermore introduces additional primitives for better browser introspection to better automate modern web applications in browser.

Given this protocol is currently work in progress more features will be added over time and supported by browser. If you use WebdriverIOs convenient commands nothing will change for you. WebdriverIO will make use of these new protocol capabilities as soon as they are available and supported in the browser.

## Appium

The [Appium](https://appium.io/) project provides capabilities to automate mobile, desktop and all other kinds of IoT devices. While WebDriver focuses on browser and the web, the vision of Appium is to use the same approach but for any arbitrary device. In addition to the commands that WebDriver defines, it has special commands that often are specific to the remote device that is being automated. For mobile testing scenarios this is ideal when you want to write and run the same tests for both Android and iOS applications.

According to Appium [documentation](https://appium.io/docs/en/about-appium/intro/?lang=en) it was designed to meet mobile automation needs according to a philosophy outlined by the following four tenets:

- You shouldn't have to recompile your app or modify it in any way in order to automate it.
- You shouldn't be locked into a specific language or framework to write and run your tests.
- A mobile automation framework shouldn't reinvent the wheel when it comes to automation APIs.
- A mobile automation framework should be open source, in spirit and practice as well as in name!

## Chromium

The Chromium protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session through [Chromedriver](https://chromedriver.chromium.org/chromedriver-canary).

## Firefox

The Firefox protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session through [Geckodriver](https://github.com/mozilla/geckodriver).

## Sauce Labs

The [Sauce Labs](https://saucelabs.com/) protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session using the Sauce Labs cloud.

## Selenium Standalone

The [Selenium Standalone](https://www.selenium.dev/documentation/grid/advanced_features/endpoints/) protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session using the Selenium Grid.

## JSON Wire Protocol

The [JSON Wire Protocol](https://www.selenium.dev/documentation/legacy/json_wire_protocol/) is the pre-predecessor of the WebDriver protocol and __deprecated__ today. While some commands might still be supported in certain environments, it is not recommended to use any of its commands.

## Mobile JSON Wire Protocol

The [Mobile JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md) is a super set of mobile commands on top of the JSON Wire Protocol. Given this one is deprecated the Mobile JSON Wire Protocol also got __deprecated__. Appium might still support some of its commands but it is not recommended to use them.
