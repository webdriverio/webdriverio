---
id: typescript
title: راه اندازی TypeScript
---

می‌توانید با استفاده از [TypeScript](http://www.typescriptlang.org) تست‌ها را برای تکمیل خودکار و امنیت نوع بنویسید.

شما به [`typescript`](https://github.com/microsoft/TypeScript) و [`ts-node`](https://github.com/TypeStrong/ts-node) به عنوان `devDependencies` نیاز دارید، از طریق:

```bash npm2yarn
$ npm install typescript ts-node --save-dev
```

WebdriverIO به طور خودکار تشخیص می دهد که آیا این وابستگی ها نصب شده اند و پیکربندی و تست های شما را برای شما کامپایل می کند. مطمئن شوید که فایل `tsconfig.json` در همان دایرکتوری با پیکربندی WDIO وجود دارد. اگر نیاز به پیکربندی نحوه اجرای ts-node دارید، از متغیرهای محیطی (Environment Variables) برای [ts-node](https://www.npmjs.com/package/ts-node#options) استفاده کنید یا از تنظیم wdio در بخش autoCompileOpts استفاده کنید.

## پیکربندی

You can provide custom `ts-node` options through the environment (by default it uses the tsconfig.json in the root relative to your wdio config if the file exists):

```sh
# run wdio testrunner with custom options
TS_NODE_PROJECT=./config/tsconfig.e2e.json TS_NODE_TYPE_CHECK=true wdio run wdio.conf.ts
```

حداقل نسخه TypeScript نسخه `4.0.5` است.

## راه اندازی فریمورک

و `tsconfig.json` شما به موارد زیر نیاز دارد:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types"]
    }
}
```

از وارد کردن `webdriverio` یا `@wdio/sync` خودداری کنید. `نوع WebdriverIO` و `WebDriver` بعد از اضافه شدن به `انواع` در `tsconfig.json` در همه جا قابل دسترسی خواهد بود. اگر از سرویس های اضافی WebdriverIO، افزونه ها یا بسته اتوماسیون `devtools` استفاده می کنید، آنها را به لیست `انواع` نیز اضافه کنید زیرا بسیاری از آنها نوع های اضافه تری را ارائه می دهند.

## نوع ها در فریمورک

بسته به فریمورکی که استفاده می کنید، باید انواع آن فریمورک را به ویژگی انواع در `tsconfig.json` خود اضافه کنید و همچنین تعاریف نوع آن را نصب کنید. به خصوص اگر می‌خواهید برای کتابخانه ادعای داخلی [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio) پشتیبانی از نوع را داشته باشید، این امر بسیار مهم است.

به عنوان مثال، اگر تصمیم دارید از فریمورک Mocha استفاده کنید، باید `@types/mocha` را نصب کنید و آن را به این صورت اضافه کنید تا همه انواع در سطح جهانی در دسترس باشند:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'},
 ]
}>
<TabItem value="mocha">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

</TabItem>
<TabItem value="jasmine">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/jasmine-framework"]
    }
}
```

</TabItem>
<TabItem value="cucumber">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/cucumber-framework"]
    }
}
```

</TabItem>
</Tabs>

## سرویس‌ها

اگر از سرویس‌هایی استفاده می‌کنید که دستوراتی را به محدوده browser اضافه می‌کنند، باید آنها را نیز در `tsconfig.json` خود قرار دهید. به عنوان مثال، اگر از `@wdio/lighthouse-service` استفاده می کنید، مطمئن شوید که آن را به `انواع` نیز اضافه می کنید، به عنوان مثال:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework",
            "@wdio/lighthouse-service"
        ]
    }
}
```

افزودن سرویس ها و گزارشگران به پیکربندی TypeScript شما همچنین امنیت نوع فایل پیکربندی WebdriverIO شما را تقویت می کند.

## تعریف انواع

هنگام اجرای دستورات WebdriverIO معمولاً همه ویژگی ها نوع مشخصی دارند، بنابراین نیازی به درگیری برای اضافه کردن انواع اضافی را ندارید. با این حال ممکن است مواردی باشد که می خواهید متغیرها را از قبل تعریف کنید. برای اطمینان از ایمن بودن نوع این موارد می توانید از همه انواع تعریف شده در بسته [`@wdio/types`](https://www.npmjs.com/package/@wdio/types) استفاده کنید. به عنوان مثال اگر دوست دارید گزینه remote را برای `webdriverio` تعریف کنید، می توانید این کار را اینطور انجام دهید:

```ts
import type { Options } from '@wdio/types'

const config: Options.WebdriverIO = {
    hostname: 'http://localhost',
    port: '4444' // Error: Type 'string' is not assignable to type 'number'.ts(2322)
    capabilities: {
        browserName: 'chrome'
    }
}
```

## نکات و ترفندها

### کامپایل و Lint

برای اینکه کاملاً ایمن باشید، می‌توانید بهترین مثال‌ها را دنبال کنید: کد خود را با کامپایلر TypeScript کامپایل کنید ( `tsc` یا `npx tsc`را اجرا کنید) و [Eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) را روی [هوک پیش از commit](https://github.com/typicode/husky) اجرا کنید.
