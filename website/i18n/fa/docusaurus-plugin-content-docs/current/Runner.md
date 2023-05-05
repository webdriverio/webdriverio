---
id: runner
title: اجرا کننده
---

import CodeBlock from '@theme/CodeBlock';

یک اجرا کننده(runner) در WebdriverIO نحوه و مکان اجرای تست ها را هنگام استفاده از اجرا کننده تست هماهنگ می‌کند. WebdriverIO در حال حاضر از دو نوع مختلف اجرا کننده پشتیبانی می کند: محلی و اجرا کنند مرورگر.

## اجرا کننده محلی

[Local Runner](https://www.npmjs.com/package/@wdio/local-runner) فریمورک شما (مثلاً Mocha، Jasmine یا Cucumber) را در یک پروسه worker آغاز می کند و تمام فایل های تست شما را در محیط Node.js شما اجرا می کند. هر فایل تست در یک فرآیند worker جداگانه در هر capability اجرا می شود که حداکثر همزمانی را امکان‌پذیر می کند. هر پروسه worker از یک نمونه browser استفاده می‌کند و بنابراین session مرورگر خود را اجرا می‌کند که اجازه می‌دهد حداکثر ایزوله شدن را داشته باشد.

با توجه به اینکه هر تست در پروسه مجزای خود اجرا می شود، امکان اشتراک گذاری داده ها در بین فایل های تست وجود ندارد. دو راه برای حل این مشکل وجود دارد:

- از [`@wdio/shared-store-service`](https://www.npmjs.com/package/@wdio/shared-store-service) برای به اشتراک گذاری داده ها در بین همه worker ها استفاده کنید
- جمع کردن فایل های تست (بیشتر در [سازماندهی مجموعه تستها](https://webdriver.io/docs/organizingsuites#grouping-test-specs-to-run-sequentially) بخوانید)

اگر چیز دیگری در `wdio.conf.js` تعریف نشده باشد، اجرا کننده محلی پیش فرض در WebdriverIO است.

### نصب

برای استفاده از اجرا کننده محلی می توانید آن را از طریق زیر نصب کنید:

```sh
npm install --save-dev @wdio/local-runner
```

### تنظیم

اجرا کننده محلی راه‌انداز پیش‌فرض در WebdriverIO است، بنابراین نیازی به تعریف آن در `wdio.conf.js`نیست. اگر می خواهید به طور واضح آن را تنظیم کنید، می توانید آن را به صورت زیر تعریف کنید:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'local',
    // ...
}
```

## اجرا کننده مرورگر

بر خلاف [اجراکننده محلی](https://www.npmjs.com/package/@wdio/local-runner) ، [اجراکننده مرورگر](https://www.npmjs.com/package/@wdio/browser-runner) فریمورک را در مرورگر راه‌اندازی و اجرا می کند. این موضوع به شما امکان می‌دهد تا تست‌های واحد یا تست‌های کامپوننت را در یک مرورگر واقعی به جای JSDOM بر خلاف بسیاری از فریمورک های تست دیگر اجرا کنید.

در حالی که [JSDOM](https://www.npmjs.com/package/jsdom) به طور گسترده برای اهداف تست استفاده می شود، در نهایت یک مرورگر واقعی نیست و نمی توانید محیط های تلفن همراه را با آن شبیه سازی کنید. با این اجرا کننده WebdriverIO شما را قادر می سازد تا به راحتی تست های خود را در مرورگر اجرا کنید و از دستورها WebDriver برای تعامل با عناصر رندر شده در صفحه استفاده کنید.

مروری بر اجرای تست در JSDOM در مقابل اجرا کننده مرورگر در WebdriverIO است

|    | JSDOM                                                                                                                                                             | WebdriverIO Browser Runner                                                                            |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1. | تست های شما را در Node.js با استفاده از پیاده‌سازی مجدد استانداردهای وب، به ویژه استانداردهای WHATWG DOM و HTML اجرا می کند                                       | تست شما را در یک مرورگر واقعی اجرا می کند و کد را در محیطی که کاربران شما استفاده می کنند اجرا می کند |
| 2. | تعامل با مؤلفه ها فقط از طریق جاوا اسکریپت قابل تقلید است                                                                                                         | می توانید از [WebdriverIO API](api) برای تعامل با عناصر از طریق پروتکل WebDriver استفاده کنید         |
| 3. | پشتیبانی از Canvas به [وابستگی های اضافی نیاز دارد](https://www.npmjs.com/package/canvas) و [دارای محدودیت](https://github.com/Automattic/node-canvas/issues) است | شما به [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)واقعی دسترسی دارید    |
| 4. | JSDOM دارای [caveats](https://github.com/jsdom/jsdom#caveats) و Web API های پشتیبانی نشده است                                                                     | همه API های وب به عنوان اجرای تست در یک مرورگر واقعی پشتیبانی می شوند                                 |
| 5. | تشخیص خطاهای بین مرورگری غیر ممکن است                                                                                                                             | پشتیبانی از تمامی مرورگرها از جمله مرورگر موبایل                                                      |
| 6. | __نمی‌توان__ برای حالت های شبه عنصر آزمایش کرد                                                                                                                    | پشتیبانی از شبه حالت ها مانند `:hover` یا `:active`                                                   |

این اجرا کننده از [Vite](https://vitejs.dev/) برای کامپایل کد تست شما و بارگذاری آن در مرورگر استفاده می کند. دارای تنظیمات از پیش تعیین شده برای فریمورک‌های مؤلفه زیر است:

- React
- Preact
- Vue.js
- Svelte
- SolidJS

هر فایل تستی یا گروه فایل تست در یک صفحه اجرا می شود، به این معنی که بین هر تست، صفحه دوباره بارگذاری می شود تا جداسازی بین تست ها تضمین شود.

### نصب

برای استفاده از اجرا کننده مرورگر می توانید آن را از طریق زیر نصب کنید:

```sh
npm install --save-dev @wdio/browser-runner
```

### تنظیم

برای استفاده از اجرا کننده مرورگر، باید یک ویژگی `runner` در فایل `wdio.conf.js` خود تعریف کنید، به عنوان مثال:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'browser',
    // ...
}
```

### گزینه های اجرا کننده

اجرا کننده مرورگر تنظیمات زیر را امکان‌پذیر می کند:

#### `preset`

اگر مؤلفه‌ها را با استفاده از یکی از چارچوب‌های ذکر شده در بالا آزمایش می‌کنید، می‌توانید یک پیش‌تنظیم تعریف کنید که مطمئن شود همه چیز در خارج پیکربندی می‌شود. این گزینه را نمی توان همراه با `viteConfig`استفاده کرد.

__Type:__ `vue` | `svelte` | `solid` | `react` | `preact`<br /> __Example:__

```js title="wdio.conf.js"
export const {
    // ...
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
}
```

#### `viteConfig`

پیکربندی [Vite خود را تعریف کنید](https://vitejs.dev/config/). اگر از Vite.js برای توسعه استفاده می کنید، می توانید یک شی سفارشی ارسال کنید یا یک فایل `vite.conf.ts` موجود را وارد کنید. توجه داشته باشید که WebdriverIO تنظیمات Vite سفارشی را برای راه‌اندازی مهار تست نگه می دارد.

__Type:__ `string` or [`UserConfig`](https://github.com/vitejs/vite/blob/52e64eb43287d241f3fd547c332e16bd9e301e95/packages/vite/src/node/config.ts#L119-L272) or `(env: ConfigEnv) => UserConfig | Promise<UserConfig>`<br /> __Example:__

```js title="wdio.conf.ts"
import viteConfig from '../vite.config.ts'

export const {
    // ...
    runner: ['browser', { viteConfig }],
    // or just:
    runner: ['browser', { viteConfig: '../vites.config.ts' }],
    // or use a function if your vite config contains a lot of plugins
    // which you only want to resolve when value is read
    runner: ['browser', {
        viteConfig: () => ({
            // ...
        })
    }],
    // ...
}
```

#### `headless`

اگر روی `true` تنظیم شود، اجرا کننده قابلیت ها را برای اجرای تست ها headless به روز می کند. به طور پیش‌فرض این در محیط‌های CI فعال می‌شود که در آن یک متغیر محیطی `CI` روی `'1'` یا `'true'`تنظیم شده است.

__Type:__ `boolean`<br /> __Default:__ `false`, set to `true` if `CI` environment variable is set

#### `rootDir`

دایرکتوری ریشه پروژه.

__Type:__ `string`<br /> __Default:__ `process.cwd()`

#### `coverage`

WebdriverIO از گزارش پوشش کد با استفاده از [`istanbul`](https://istanbul.js.org/)پشتیبانی می کند. برای جزئیات بیشتر به [گزینه های پوشش](#coverage-options) مراجعه کنید.

__Type:__ `object`<br /> __Default:__ `undefined`

### گزینه های پوشش

گزینه های زیر امکان پیکربندی گزارش پوشش را فراهم می کند.

#### `enabled`

جمع‌آوری پوشش را فعال می کند.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `include`

فهرست فایل‌های موجود در پوشش به‌عنوان الگوهای glob.

__Type:__ `string[]`<br /> __Default:__ `[**]`

#### `exclude`

فهرست فایل هایی که در پوشش به عنوان الگوهای glob مستثنی شده اند.

__Type:__ `string[]`<br /> __Default:__

```
[
  'coverage/**',
  'dist/**',
  'packages/*/test{,s}/**',
  '**/*.d.ts',
  'cypress/**',
  'test{,s}/**',
  'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
  '**/__tests__/**',
  '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
  '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
]
```

#### `extension`

فهرست پسوندهای فایلی که گزارش باید شامل شود.

__Type:__ `string | string[]`<br /> __Default:__ `['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte']`

#### `reportsDirectory`

دایرکتوری برای نوشتن گزارش پوشش.

__Type:__ `string`<br /> __Default:__ `./coverage`

#### `reporter`

گزارش دهنده ای که برای پوشش استفاده می‌شود. برای فهرست دقیق همه گزارشگران به [مستندات استانبول](https://istanbul.js.org/docs/advanced/alternative-reporters/) مراجعه کنید.

__Type:__ `string[]`<br /> __Default:__ `['text', 'html', 'clover', 'json-summary']`

#### `perFile`

آستانه های هر فایل را بررسی کنید. `خط`، `توابع`، `شاخه ها` و `عبارات` را برای آستانه های حال حاضر ببینید.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `clean`

قبل از اجرای آزمایش نتایج پوشش تمیز شود.

__Type:__ `boolean`<br /> __Default:__ `true`

#### `lines`

آستانه برای خطوط.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `functions`

آستانه برای توابع.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `branches`

Threshold for branches.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `statements`

آستانه عبارات.

__Type:__ `number`<br /> __Default:__ `undefined`

### محدودیت ها

هنگام استفاده از مرورگر WebdriverIO، توجه به این نکته مهم است که نخ های مسدودکننده مانند `alert` یا `confirm` را نمی توان به صورت بومی استفاده کرد. این به این دلیل است که آنها صفحه وب را مسدود می کنند، به این معنی که WebdriverIO نمی تواند به برقراری ارتباط با صفحه ادامه دهد و باعث می شود که اجرا متوقف شود.

در چنین شرایطی، WebdriverIO ماک(mock) های پیش فرض را با مقادیر بازگشتی پیش فرض برای این API ها فراهم می کند. این تضمین می کند که اگر کاربر به طور تصادفی از API های وب پاپ آپ همزمان استفاده کند، اجرا متوقف نمی شود. با این حال، همچنان به کاربر توصیه می شود که این API های وب را برای تجربه بهتر mock کند. ادامه مطلب را در [Mock](/docs/component-testing/mocking) بخوانید.

### مثال‌ها

حتماً اسناد مربوط به تست کامپوننت [](https://webdriver.io/docs/component-testing) را بررسی کنید و برای مثال هایی که از این فریم ورک ها و سایر چارچوب های مختلف استفاده می کنند، به مخزن [نمونه](https://github.com/webdriverio/component-testing-examples) نگاهی بیندازید.

