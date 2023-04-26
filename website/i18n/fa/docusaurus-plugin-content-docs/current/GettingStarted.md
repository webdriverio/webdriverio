---
id: gettingstarted
title: شروع کار
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CreateProjectAnimation from '@site/src/pages/components/CreateProjectAnimation.js';

به مستندات WebdriverIO خوش آمدید. It will help you to get started fast. If you run into problems, you can find help and answers on our [Discord Support Server](https://discord.webdriver.io) or you can hit me on [Twitter](https://twitter.com/webdriverio).

:::نکته 
اینها اسناد آخرین نسخه (__>= 8.x__) WebdriverIO هستند. اگر هنوز از نسخه قدیمی‌تر استفاده می‌کنید، لطفاً از [وب‌سایت اسناد قدیمی](/versions) دیدن کنید!
:::

## راه‌اندازی تنظیمات WebdriverIO

To add a full WebdriverIO setup to an existing or new project using the [WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio), run:

اگر در دایرکتوری ریشه یک پروژه موجود هستید دستور مقابل را اجرا کنید:

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

این تک فرمان، ابزار WebdriverIO CLI را دانلود می کند و یک wizard برای پیکربندی راحت را اجرا می کند که به شما کمک می کند مجموعه تست خود را پیکربندی کنید.

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

You can start your test suite by using the `run` command and pointing to the WebdriverIO config that you just created:

```sh
npx wdio run ./wdio.conf.js
```

If you like to run specific test files you can add a `--spec` parameter:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

or define suites in your config file and run just the test files defined by in a suite:

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## Run in a script

If you would like to use WebdriverIO as an automation engine in [Standalone Mode](/docs/setuptypes#standalone-mode) within a Node.JS script you can also directly install WebdriverIO and use it as a package, e.g. to generate a screenshot of a website:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__Note:__ all WebdriverIO commands are asynchronous and need to be properly handled using [`async/await`](https://javascript.info/async-await).

## Record tests

WebdriverIO provides tools to help you get started by recording your test actions on screen and generate WebdriverIO test scripts automatically. See [Recorder tests with Chrome DevTools Recorder](/docs/record) for more information.

## System Requirements

You’ll need [Node.js](http://nodejs.org) installed.

- Install at least v16.x or higher as this is the oldest active LTS version
- Only releases that are or will become an LTS release are officially supported

If Node is not currently installed on your system, we suggest utilizing a tool such as [NVM](https://github.com/creationix/nvm) or [Volta](https://volta.sh/) to assist in managing multiple active Node.js versions. NVM is a popular choice, while Volta is also a good alternative.
