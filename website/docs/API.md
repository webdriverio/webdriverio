---
id: api
title: Introduction
---

Welcome to the WebdriverIO docs page. These pages contain reference materials for all implemented selenium bindings and commands. WebdriverIO has all [JSONWire protocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) commands implemented and also supports special bindings for [Appium](http://appium.io).

:::info
These are the docs for the latest version (__>=7.x__) of WebdriverIO. If you are still using an older version, please visit the [old documentation websites](/versions)!
:::

## Examples

Each command documentation usually comes with an example that demonstrates its usage in WebdriverIO's testrunner in [sync mode](sync-vs-async#sync-mode). If you run WebdriverIO in standalone mode, you can still use all commands but you'll need to make sure that the execution order is handled properly by handling promises.

While you e.g. assign the result of a command in sync mode directly to a variable:

```js
it('can handle commands synchronously', () => {
    let value = $('#input').getValue()
    console.log(value) // outputs: some value
})
```

you need use `async/await` when running in standalone or not using sync mode at all:

```js
it('can handle commands using async/await', async function () {
    const inputElement = await $('#input')
    let value = await inputElement.getValue()
    console.log(value) // outputs: some value
})
```

It is recommended to use the testrunner to scale up your test suite, as it comes with a lot of useful add-ons like the [Sauce Service](_sauce-service.md) that save you from writing a lot of boilerplate code by yourself.

## Contribute

If you feel like you have a good example for a command, don't hesitate to open a PR and submit it. Just click on the orange button on the top right with the label _“EDIT”_. Make sure you understand the way we write these docs by checking the [Contributing](https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md) section.
