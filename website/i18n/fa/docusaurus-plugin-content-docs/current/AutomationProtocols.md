---
id: automationProtocols
title: پروتکل های اتوماسیون
---

با WebdriverIO، هنگام اجرای تست های E2E خود به صورت محلی یا در فضای ابری، می توانید بین چندین فناوری اتوماسیون یکی را انتخاب کنید. By default, WebdriverIO will attempt to start a local automation session using the [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol.

## WebDriver Bidi Protocol

The [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) is an automation protocol to automate browsers using bi-directional communication. It's the successor of the [WebDriver](https://w3c.github.io/webdriver/) protocol and enables a lot more introspection capabilities for various testing use cases.

This protocol is currently under development and new primitives might be added in the future. All browser vendors have committed to implementing this web standard and a lot of [primitives](https://wpt.fyi/results/webdriver/tests/bidi?label=experimental&label=master&aligned) have already been landed in browsers.

## پروتکل WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) یک رابط کنترل از راه دور است که امکان بررسی و کنترل user agent را فراهم می کند. این یک پروتکل خنثی نسبت به پلتفرم و زبان را به عنوان راهی برای برنامه های خارج از فرآیند ارائه می کند تا از راه دور رفتار مرورگرهای وب را آموزش دهند.

پروتکل WebDriver برای خودکارسازی مرورگر از دیدگاه کاربر طراحی شده است، به این معنی که هر کاری که کاربر قادر به انجام آن است، شما می توانید با مرورگر انجام دهید. این پروتکل مجموعه ای از دستورات را ارائه می دهد که تعاملات رایج با یک برنامه کاربردی (مثلاً پیمایش، کلیک کردن، یا خواندن وضعیت یک عنصر) را انتزاعی می کند. Since it is a web standard, it is well supported across all major browser vendors and also is being used as an underlying protocol for mobile automation using [Appium](http://appium.io).

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
