---
id: timeouts
title: Таймауты
---

Каждая команда в WebdriverIO это асинхронная операция где запрос высылается в Selenium server (либо в облачный сервис, например [Sauce Labs](https://saucelabs.com/)) и его ответ содержит результат когда действие было совершенно либо провалилось. Поэтому время является важным компонентом всего процесса тестирования. Когда определенные действия зависят от результата других действий, вам нужно убедиться в том, что они выполнены в правильном порядке. Таймауты играют важную роль в решении данных проблем.

## Таймауты Selenium

### Session Script Timeout

A session has an associated session script timeout that specifies a time to wait for asynchronous scripts to run. Unless stated otherwise it is 30 seconds. You can set this timeout via:

```js
browser.setTimeout({ 'script': 60000 });
browser.executeAsync((done) => {
    console.log('это не должно сломаться');
    setTimeout(done, 59000);
});
```

### Session Page Load Timeout

A session has an associated session page load timeout that specifies a time to wait for the page loading to complete. Unless stated otherwise it is 300,000 milliseconds. You can set this timeout via:

```js
browser.setTimeout({ 'pageLoad': 10000 });
```

> The `pageLoad` keyword is a part of the official WebDriver [specification](https://www.w3.org/TR/webdriver/#set-timeouts), but might not be [supported](https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/687) for your browser (the previous name is `page load`).

### Session Implicit Wait Timeout

A session has an associated session implicit wait timeout that specifies a time to wait for the implicit element location strategy when locating elements using the [`findElement`](/docs/api/webdriver.html#findelement) or [`findElements`](/docs/api/webdriver.html#findelements) commands (respectively [`$`](/docs/api/browser/$.html) or [`$$`](/docs/api/browser/$$.html) when running WebdriverIO with or without wdio testrunner). Unless stated otherwise it is zero milliseconds. You can set this timeout via:

```js
browser.setTimeout({ 'implicit': 5000 });
```

## WebdriverIO related timeouts

### WaitForXXX timeout

WebdriverIO provides multiple commands to wait on elements to reach a certain state (e.g. enabled, visible, existing). These commands take a selector argument and a timeout number which declares how long the instance should wait for that element to reach the state. The `waitforTimeout` option allows you to set the global timeout for all waitFor commands so you don't need to set the same timeout over and over again. Note the lowercase `f`.

```js
// wdio.conf.js
exports.config = {
    // ...
    waitforTimeout: 5000,
    // ...
};
```

In your test you now can do this:

```js
const myElem = $('#myElem');
myElem.waitForVisible();

// вы также можете перезаписать значение таймаута по умолчанию, если это необходимо
myElem.waitForVisible(10000);
```

## Framework related timeouts

Also the testing framework you use with WebdriverIO has to deal with timeouts especially since everything is asynchronous. It ensures that the test process don't get stuck if something went wrong. By default the timeout is set to 10 seconds which means that a single test should not take longer than that. A single test in Mocha looks like:

```js
it('should login into the application', () => {
    browser.url('/login');

    const form = $('form');
    const username = $('#username');
    const password = $('#password');

    username.setValue('userXY');
    password.setValue('******');
    form.submit();

    expect(browser.getTitle()).to.be.equal('Admin Area');
});
```

In Cucumber the timeout applies to a single step definition. However if you want to increase the timeout because your test takes longer than the default value you need to set it in the framework options. This is for Mocha:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'mocha',
    mochaOpts: {
        timeout: 20000
    },
    // ...
}
```

Для Jasmine:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'jasmine',
    jasmineNodeOpts: {
        defaultTimeoutInterval: 20000
    },
    // ...
}
```

и для Cucumber:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 20000
    },
    // ...
}
```