---
id: globals
title: متغیر های جهانی
---

در فایل های تست شما، WebdriverIO هر یک از این روش ها و اشیاء را در محیط جهانی قرار می دهد. برای استفاده از آنها لازم نیست چیزی را import کنید. با این حال، اگر import صریح را ترجیح می‌دهید، می‌توانید `import { browser, $, $$, expect } را از '@wdio/globals'` انجام دهید و `injectGlobals: false` را در پیکربندی WDIO خود تنظیم کنید.

اگر به شکل دیگری پیکربندی نشده باشد، اشیاء جهانی به صورت زیر تنظیم می شوند:

- `browser`: WebdriverIO [Browser object](https://webdriver.io/docs/api/browser)
- `driver`: لقبی برای `browser` (در هنگام اجرای تست های تلفن همراه استفاده می شود)
- `multiremotebrowser`: نام مستعار برای `browser` یا `driver` اما فقط برای [جلسه چند browser](/docs/multiremote) تنظیم شده است
- `$`: دستور برای دریافت یک element (در [سند API](/docs/api/browser/$) بیشتر ببینید)
- `$$`: دستور برای دریافت چند element (در [سند API](/docs/api/browser/$$) بیشتر ببینید)
- `expect`: فریمورک assertion برای WebdriverIO (به [سند API](/docs/api/expect-webdriverio) مراجعه کنید)

__نکته:__ WebdriverIO هیچ کنترلی بر فریمورک های استفاده شده (مثلاً Mocha یا Jasmine) ندارد که متغیرهای سراسری را هنگام راه‌اندازی کردن محیط آنها تنظیم می کند.
