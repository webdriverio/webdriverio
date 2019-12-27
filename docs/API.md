---
id: api
title: API Docs
---

Welcome to the WebdriverIO docs page. These pages contain reference materials for all implemented selenium bindings and commands. WebdriverIO has all [JSONWire protocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) commands implemented and also supports special bindings for [Appium](http://appium.io).

> __Note:__ These are the docs for the latest version (v5.0.0) of WebdriverIO. If you are still using v4 or older please use the legacy docs website [v4.webdriver.io](http://v4.webdriver.io)!

## Examples

Each command documentation usually comes with an example that demonstrates its usage in WebdriverIO's testrunner (in sync mode). 

If you run WebdriverIO in standalone mode, you can still use all commands, but you'll need to make sure that the execution order is handled properly by chaining the commands and resolving the promise chain. So, instead of assigning the value directly to a variable, as the WDIO testrunner allows it...

```js
it('can handle commands synchronously', () => {
    let value = $('#input').getValue()
    console.log(value) // outputs: some value
})
```

...you need return the command promise, so it's resolved properly (and allows you to access the resolved value in your test):

```js
it('handles commands as promises', () => {
    return $('#input').getValue().then((value) => {
        console.log(value) // outputs: some value
    })
})
```

Of course you can use NodeJS’s latest [`async`/`await`](https://github.com/yortus/asyncawait) functionality to bring synchronous syntax into your testflow like:

```js
it('can handle commands using async/await', async function () {
    const inputElement = await $('#input')
    let value = await inputElement.getValue()
    console.log(value) // outputs: some value
})
```

However, it is recommended to use the testrunner to scale up your test suite, as it comes with a lot of useful add-ons like the [Sauce Service](_sauce-service.md) that save you from writing a lot of boilerplate code by yourself.

## Contribute

If you feel like you have a good example for a command, don't hesitate to open a PR and submit it. Just click on the orange button on the top right with the label _“EDIT”_. Make sure you understand the way we write these docs by checking the [Contributing](https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md) section.
