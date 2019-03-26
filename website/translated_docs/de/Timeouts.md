---
id: timeouts
title: Timeouts
---
Jeder Befehl in WebdriverIO ist ein asynchroner Vorgang, wo eine Anfrage an einem WebDriver-Server (oder einen Cloud-Dienst wie [Sauce Labs](https://saucelabs.com/)) geschickt wird und dessen Antwort das Ergebnis enthält, sobald die Aktion wie z.B. ein klick abgeschlossen oder fehlgeschlagen ist. Daher ist Zeit eine entscheidende Komponente im gesamten Test Prozess. Wenn eine bestimmte Aktion vom Ergebnis einer anderen Aktion abhängt, müssen Sie sicherstellen, dass diese in der richtigen Reihenfolge ausgeführt werden. Timeouts spielen eine wichtige Rolle beim Umgang mit diesen Fragen.

## WebDriver Timeouts

### Skript Timeout

Jede Session hat ein zugehöriges Session-Skript-Timeout, die eine Zeit angibt, wie lange asynchrone Skripte laufen dürfen. Wenn nicht anders angegeben, ist diese 30 Sekunden. Sie können diesen Timeout festlegen über:

```js
browser.setTimeout({ 'script': 60000 });
browser.executeAsync((done) => {
    console.log('this should not fail');
    setTimeout(done, 59000);
});
```

### Ladezeit Timeout

Jede Session hat ein spezifisches Ladezeit Timeout, welches angibt, wie lange gewartet wird bis die Seite geladen ist. Wenn nicht anders angegeben, ist diese 300 Sekunden. You can set this timeout via:

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

// you can also overwrite the default timeout if needed
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

For Jasmine:

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

and for Cucumber:

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