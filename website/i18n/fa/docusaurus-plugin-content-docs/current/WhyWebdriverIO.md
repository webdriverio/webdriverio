---
id: why-webdriverio
title: چرا Webdriver.IO؟
---

WebdriverIO یک فریمورک اتوماسیون پیشرو است، برای ایجاد تست خودکار اپلیکیشن های مدرن تحت وب و موبایلی. WebdriverIO تعامل با برنامه شما را ساده می کند و همچنین مجموعه ای از افزونه ها را ارائه می دهد که به شما کمک می کند یک مجموعه تستی بسازید که به راحتی مقیاس پذیر، قدرتمند و پایدار است.

همچنین طوری طراحی شده است که:

- __توسعه پذیر__ - افزودن توابع کمکی با استفاده از آن و یا ایجاد مجموعه های پیچیده تر و یا ترکیب کردن دستورات موجود __ساده__ و __مفید است__
- __سازگار__ - WebdriverIO را می توان بر روی [WebDriver Protocol](https://w3c.github.io/webdriver/) برای __آزمایش با مرورگر های مختلف__ و همچنین با [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) برای اتوماسیون مبتنی بر Chromium با استفاده از [Puppeteer](https://pptr.dev/)اجرا کرد.
- __ویژگی های غنی__ - تنوع عظیم افزونه های داخلی و افزونه های ساخته شده توسط جامعه WebdriverIO به شما این امکان را می دهد که به راحتی در پروژه شما __ادغام شود__ تا تنظیمات خود را برای برآورده کردن نیازهای خود __ گسترش__ دهید.

می توانید از WebdriverIO برای اتوماسیون موارد زیر استفاده کنید:

- 🌐 <span>&nbsp;</span> __برنامه های تحت وب مدرن__ نوشته شده توسط React، Vue، Angular، Svelte یا سایر فریم ورک های فرانت اند
- 📱 <span>&nbsp;</span> __اپ های موبایلی هایبرید__ یا __برنامه های بومی موبایل__ در یک شبیه‌ساز یا امولاتور و یا روی یک دستگاه واقعی اجرا می شود
- 💻 <span>&nbsp;</span> __برنامه های کامپیوتر بومی__ (به عنوان مثال برنامه هایی که با Electron.js نوشته شده است)
- 📦 <span>&nbsp;</span> __یونیت تست یا کامپوننت تست__ برای کامپوننت ها در مرورگر

## بر اساس استانداردهای وب

WebdriverIO از قدرت پروتکل [WebDriver](https://w3c.github.io/webdriver/) و [WebDriver-BiDi](https://github.com/w3c/webdriver-bidi) استفاده می کند که توسط همه سازنده های مرورگر مدرن و توسعه یافته پشتیبانی می شود و یک تیت واقعی بین مرورگرهای مختلف را تضمین می کند. در حالی که سایر ابزارهای اتوماسیون از شما می‌خواهند موتورهای مرورگر اصلاح‌شده‌ای را دانلود کنید که توسط کاربران واقعی استفاده نمی‌شوند یا رفتار کاربر را با تزریق جاوا اسکریپت تقلید کنند، WebdriverIO بر یک استاندارد مشترک توافق شده برای اتوماسیون متکی است که [آزمایش شده است](https://wpt.fyi/results/webdriver/tests?label=experimental&label=master&aligned) و سازگاری را برای دهه‌های آینده تضمین می‌کند.

Furthermore WebdriverIO has also support for alternative, proprietary automation protocols like [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/) for debugging and introspection purposes. این موضوع به کاربر این امکان را می دهد که به طور یکپارچه بین دستورات معمولی مبتنی بر WebDriver و تعاملات قدرمتند مرورگر از طریق [Puppeteer](https://pptr.dev/)حرکت کند.

در مورد تفاوت های بین استانداردهای اتوماسیون در بخش [پروتکل های اتوماسیون](automationProtocols) بیشتر بخوانید.

## واقعا منبع باز

در مقایسه با بسیاری از ابزارهای اتوماسیون در اکوسیستم، WebdriverIO یک پروژه واقعاً متن باز است که با حاکمیت باز اجرا می شود و متعلق به یک نهاد غیرانتفاعی به نام [OpenJS Foundation](https://openjsf.org/)است. این موضوع از نظر قانونی پروژه را ملزم به رشد و هدایت به نفع همه شرکت کنندگان می کند. تیم پروژه برای صداقت و همکاری ارزش قائل است و بر اساس منافع پولی هدایت نمی شود.

این موضوع باعث می شود که پروژه در نحوه توسعه و روند ادامه آن مستقل باشد. It allows us to provide free 24/7 support in our [community channel](https://discord.webdriver.io) as we build a sustainable community that supports and learns from each other. در نهایت، فرصت‌های زیادی را به افرادی که در این پروژه مشارکت می‌کنند و با آن درگیر هستند، به دلیل حاکمیت باز [](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md) ارائه می‌دهد.
