layout: api
name: api
title: WebdriverIO - API Docs
---

# WebdriverIO API Docs

Welcome to the WebdriverIO docs page. These pages contain reference materials for all implemented selenium bindings and commands. WebdriverIO has all [JSONWire protocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) commands implemented and also supports special bindings for [Appium](http://appium.io).

## Examples

Each command documentation usually comes with an example that demonstrates the usage of it using WebdriverIO's testrunner running its commands synchronously. If you run WebdriverIO in standalone mode you still can use all commands but need to make sure that the execution order is handled properly by chaining the commands and resolving the promise chain. So instead of assigning the value directly to a variable, as the wdio testrunner allows it:

```js
it('can handle commands synchronously', function () {
    var value = browser.getValue('#input');
    console.log(value); // outputs: some value
});
```

you need return the command promise so it gets resolved properly as well as access the value when the promise got resolve:

```js
it('handles commands as promises', function () {
    return browser.getValue('#input').then(function (value) {
        console.log(value); // outputs: some value
    });
});
```

Of course you can use Node.JS latest [async/await](https://github.com/yortus/asyncawait) functionality to bring synchronous syntax into your testflow like:

```js
it('can handle commands using async/await', async function () {
    var value = await browser.getValue('#input');
    console.log(value); // outputs: some value
});
```

However it is recommended to use the testrunner to scale up your test suite as it comes with a lot of useful add ons like the [Sauce Service](http://webdriver.io/guide/services/sauce.html) that helps you to avoid writing a lot of boilerplate code by yourself.

## Element as first citizen

To make the code more readable and easier to write we handle element calls as first citizen objects. This means that if you call the [`element`](/api/protocol/element.html) to query an element, WebdriverIO propagates its prototype to the result so you can chain another command to it. This is useful when writing tests with the [Page Object Pattern](http://martinfowler.com/bliki/PageObject.html) where you want to store your page elements in a page object to access them in the test. Simplified this can look like:

```js
it('should use elements as first citizen', function () {
    var input = browser.element('.someInput');

    input.setValue('some text');
    // is the same as calling
    browser.setValue('.someInput', 'some text');
});
```

Each command that takes a selector as first argument can be executed without passing along the selector again and again. This not only looks nice, it also avoids querying the same element over and over again. The same works in standalone mode:

```js
it('should use elements as first citizen in standalone mode', function () {
    return browser.element('.someInput').setValue('some text');
});
```

## Contribute

If you feel like you have a good example for a command, don't hesitate to open a PR and submit it. Just click on the orange button on the top right with the label _"Improve this doc"_. Make sure you understand the way we write these docs by checking the [Contribute](/contribute.html) section.
