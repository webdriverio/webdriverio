---
id: setuptypes
title: Способи використання
---

WebdriverIO можна використовувати для різних цілей. Він реалізує API для виконання команд WebDriver протоколу та може запускати браузер готовий для автоматизації. Фреймворк розроблений для роботи в будь-якому середовищі та для будь-яких завдань. Він не залежить від сторонніх фреймворків і потребує лише Node.js для роботи.

## Імплементації протоколів

Для базової взаємодії з WebDriver та іншими протоколами автоматизації WebdriverIO використовує власні імплементації протоколів, що базуються на NPM пакунку [`webdriver`](https://www.npmjs.com/package/webdriver):

<Tabs
  defaultValue="webdriver"
  values={[
    {label: 'WebDriver', value: 'webdriver'},
 {label: 'Chrome DevTools', value: 'devtools'},
 ]
}>
<TabItem value="webdriver">

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/webdriver.js#L5-L20
```

</TabItem>
<TabItem value="devtools">

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/devtools.js#L2-L17
```

</TabItem>
</Tabs>

Усі [команд протоколу](api/webdriver) повертають необроблену відповідь від драйвера автоматизації. Пакет дуже мінімалістичний і __не має__ розумної логіки, як-от автоматичне очікування, щоб спростити мінімізувати використання протоколу.

Команди протоколу, що зможуть бути використані з екземпляром, залежать від відповіді драйвера на запит початку сеансу. Наприклад, якщо відповідь вказує, на те що було розпочато мобільний сеанс, пакунок дозволяє всі команди протоколу Appium і Mobile JSON Wire цьому екземпляру.

Ви можете використовувати той самий набір команд (крім мобільних) за допомогою Chrome DevTools протоколу із [`devtools`](https://www.npmjs.com/package/devtools) NPM пакунком. Він має той самий інтерфейс, що й пакунок `webdriver`, але виконує автоматизацію на основі [Puppeteer](https://pptr.dev/).

Щоб отримати додаткові відомості про інтерфейси цих пакунків, перегляньте розділ [Модулі](/docs/api/modules).

## Автономний режим

To simplify the interaction with the WebDriver protocol the `webdriverio` package implements a variety of commands on top of the protocol (e.g. the [`dragAndDrop`](api/element/dragAndDrop) command) and core concepts such as [smart selectors](selectors) or [auto-waits](autowait). The example from above can be simplified like this:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/standalone.js#L2-L19
```

Using WebdriverIO in standalone mode still gives you access to all protocol commands but provides a super set of additional commands that provide a higher level interaction with the browser. It allows you to integrate this automation tool in your own (test) project to create a new automation library. Popular examples include [Spectron](https://www.electronjs.org/spectron) or [CodeceptJS](http://codecept.io). You can also write plain Node scripts to scrape the web for content (or anything else that requires a running browser).

If no specific options are set WebdriverIO will try to find a browser driver on `http://localhost:4444/` and automatically switches to the Chrome DevTools protocol and Puppeteer as automation engine if such a driver can't be found. If you like to run based on WebDriver you need to either start that driver manually or through a script or [NPM package](https://www.npmjs.com/package/chromedriver).

For more information on the `webdriverio` package interfaces, see [Modules API](/docs/api/modules).

## The WDIO Testrunner

The main purpose of WebdriverIO, though, is end-to-end testing on a big scale. We therefore implemented a test runner that helps you to build a reliable test suite that is easy to read and maintain.

The test runner takes care of many problems that are common when working with plain automation libraries. For one, it organizes your test runs and splits up test specs so your tests can be executed with maximum concurrency. It also handles session management and provides lots of features to help you to debug problems and find errors in your tests.

Here is the same example from above, written as a test spec and executed by WDIO:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/testrunner.js
```

The test runner is an abstraction of popular test frameworks like Mocha, Jasmine, or Cucumber. To run your tests using the WDIO test runner, check out the [Getting Started](gettingstarted) section for more information.

For more information on the `@wdio/cli` testrunner package interface, see [Modules API](/docs/api/modules).
