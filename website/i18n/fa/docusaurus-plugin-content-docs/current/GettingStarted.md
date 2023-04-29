---
id: gettingstarted
title: شروع کار
---

به مستندات WebdriverIO خوش آمدید. It will help you to get started fast. If you run into problems, you can find help and answers on our [Discord Support Server](https://discord.webdriver.io) or you can hit me on [Twitter](https://twitter.com/webdriverio).

:::نکته 
اینها اسناد آخرین نسخه (__>= 8.x__) WebdriverIO هستند. اگر هنوز از نسخه قدیمی‌تر استفاده می‌کنید، لطفاً از [وب‌سایت اسناد قدیمی](/versions) دیدن کنید!
:::

<LiteYouTubeEmbed id="rA4IFNyW54c" title="Getting Started with WebdriverIO" />

اگر در دایرکتوری ریشه یک پروژه موجود هستید دستور مقابل را اجرا کنید:

You can find more videos around WebdriverIO on the [official YouTube channel](https://youtube.com/@webdriverio). Make sure you subscribe!

:::

## راه‌اندازی تنظیمات WebdriverIO

To add a full WebdriverIO setup to an existing or new project using the [WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio), run:

تست را می توان با استفاده از دستور `run` و با اشاره به پیکربندی WebdriverIO که به تازگی ایجاد کرده اید اجرا کرد:

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio .
```

or if you want to create a new project:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```

or if you want to create a new project:

```sh
yarn create wdio ./path/to/new/project
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio .
```

or if you want to create a new project:

```sh
pnpm create wdio ./path/to/new/project
```

</TabItem>
</Tabs>

اگر دوست دارید فایل های تست خاصی را اجرا کنید، می توانید یک پارامتر `--spec` اضافه کنید:

<CreateProjectAnimation />

Wizard مجموعه ای از سوالات را مطرح می کند که شما را برای راه‌اندازی راهنمایی می کند. شما می‌توانید از یک پارامتر `--yes` که برای انتخاب یک تنظیم پیش‌فرض که از Mocha با Chrome با استفاده از الگوی [Page Object](https://martinfowler.com/bliki/PageObject.html) استفاده می‌شود، استفاده کنید.

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio . --yes
```

</TabItem>
</Tabs>

## اجرای تست

__توجه:__ همه دستورهای WebdriverIO ناهمزمان هستند و باید با استفاده از [`async/await`](https://javascript.info/async-await) به درستی مدیریت شوند.

```sh
npx wdio run ./wdio.conf.js
```

اگر دوست دارید فایل های تست خاصی را اجرا کنید، می توانید یک پارامتر `--spec` اضافه کنید:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

شما نیاز به نصب [Node.js](http://nodejs.org) دارید.

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## اجرا در یک اسکریپت

اگر می خواهید از WebdriverIO به عنوان یک موتور اتوماسیون در حالت [مستقل](/docs/setuptypes#standalone-mode) در یک اسکریپت Node.JS استفاده کنید، می توانید مستقیماً WebdriverIO را نصب کنید و از آن به عنوان یک بسته در کد خود استفاده کنید، به عنوان مثال برای ایجاد اسکرین شات از یک وب سایت:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__توجه:__ همه دستورهای WebdriverIO ناهمزمان هستند و باید با استفاده از [`async/await`](https://javascript.info/async-await) به درستی مدیریت شوند.

## ضبط تست

WebdriverIO ابزارهایی را ارائه می دهد که به شما کمک می کند تا با ضبط اقدامات خود روی صفحه شروع کنید و اسکریپت های آزمایش WebdriverIO را به طور خودکار تولید کنید. برای اطلاعات بیشتر به [ضبط تست با Chrome DevTools Recorder](/docs/record) مراجعه کنید.

## پیش نیازهای سیستم

شما نیاز به نصب [Node.js](http://nodejs.org) دارید.

- حداقل v16.x یا بالاتر را نصب کنید زیرا این قدیمی ترین نسخه فعال LTS است
- فقط نسخه هایی که نسخه LTS هستند یا خواهند شد، رسما پشتیبانی می شوند

اگر Node در حال حاضر روی سیستم شما نصب نیست، پیشنهاد می کنیم از ابزاری مانند [NVM](https://github.com/creationix/nvm) یا [Volta](https://volta.sh/) برای مدیریت چندین نسخه فعال Node.js استفاده کنید. NVM یک انتخاب محبوب است، در حالی که Volta نیز جایگزین خوبی است.
