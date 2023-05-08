---
id: autocompletion
title: تکمیل خودکار
---

## IntelliJ

تکمیل خودکار در IDEA و WebStorm خارج از جعبه کار می کند.

اگر برای مدتی کد نوشته باشید، احتمالاً تکمیل خودکار را دوست دارید. تکمیل خودکار در بسیاری از ویرایشگرهای کد خارج از جعبه موجود است.

![تکمیل خودکار](/img/autocompletion/0.png)

تعاریف نوع بر اساس [JSDoc](http://usejsdoc.org/) برای مستندسازی کد استفاده می شود. این موضوع به دیدن جزئیات بیشتر در مورد پارامترها و انواع آنها کمک می کند.

![تکمیل خودکار](/img/autocompletion/1.png)

از میانبرهای استاندارد <kbd>⇧ + ⌥ + SPACE</kbd> در پلتفرم IntelliJ برای مشاهده اسناد موجود استفاده کنید:

![تکمیل خودکار](/img/autocompletion/2.png)

## Visual Studio Code (VSCode)

Visual Studio Code معمولاً دارای پشتیبانی نوع خودکار است و نیازی به اقدامی نیست.

![تکمیل خودکار](/img/autocompletion/14.png)

اگر از جاوا اسکریپت وانیلی(خالی) استفاده می کنید و می خواهید پشتیبانی از نوع مناسب داشته باشید، باید `jsconfig.json` در ریشه پروژه خود ایجاد کنید و به بسته های wdio استفاده شده رجوع بدهید، به عنوان مثال:

```json title="jsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework"
        ]
    }
}
```
