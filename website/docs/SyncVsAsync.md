---
id: sync-vs-async
title: Sync vs. Async Mode
---

:::caution

As of __14/04/2021__ sync mode will not be supported anymore starting from Node.js v16 due to [changes](https://chromium-review.googlesource.com/c/v8/v8/+/2537690) in Chromium. If you start a project with WebdriverIO we recommend to not use sync mode anymore. The community is working on a transition plan, [read more on that in this RFC](https://github.com/webdriverio/webdriverio/discussions/6702).

:::

WebdriverIO runs a set of asynchronous commands to interact with the browser or mobile device. In JavaScript asynchronous operations are handled via `async/await`. This however can be a confusing concept for people unfamiliar with the language. In addition to that it can make tests very verbose as almost every operation is asynchronous. To simplify its usage WebdriverIO provides the ability to run commands synchronous through [`node-fibers`](https://www.npmjs.com/package/fibers).

## How to enable/disable sync mode

To enable sync mode you only need to add the [`@wdio/sync`](https://www.npmjs.com/package/@wdio/sync) package to your dev dependencies:

```bash npm2yarn
npm install --save-dev @wdio/sync
```

The package will be automatically detected by the framework and the environment properly set up to run synchronous.

## Sync mode

If you're using [`@wdio/sync`](https://www.npmjs.com/package/@wdio/sync) then you can avoid awaiting for command calls. It is still required to deal with Promises from 3rd-party libraries, you should use [browser.call](api/browser/call) for this to wrap them and make them synchronous too.

:::caution
Synchronous Mode will depcrecated with Node.js v16. With an update to the
underlying Chromium version it became technically impossible to provide the
same synchronous behavior. We recommend to start transition to asynchronous
command execution. For more information, see our <a href="https://github.com/webdriverio/webdriverio/discussions/6702">RFC</a>.
:::

```js
// 3rd-party library example
// https://www.npmjs.com/package/got#gotgeturl-options
const { get } = require('got')

describe('suite sync', () => {
    // make sure to remove `async` keyword otherwise function treated as async
    // and you have to await every browser call.
    // The same is applicable to hooks in `wdio.conf.js` as well.
    it('test sync', () => {
        browser.pause(500)

        // wrap 3rd-party library calls with `browser.call`
        const response = browser.call(
            () => get('https://cat-fact.herokuapp.com/facts/', {
                responseType: 'json'
            })
        )
        console.log(response.body[0].type) // outputs: "cat"

        $('body').click() // You can chain functions in sync mode
    })

    // If you have `@wdio/sync` installed and configured, it is still possible to use async functions.
    // However, in such case you have to await every browser/element call like in async mode, and this can
    // be confusing when other tests are sync, so we discourage mixing modes, but it is possible to do so.
    // The best practice in sync mode is to wrap anything async with `browser.call`.
    it('using async function in sync mode', async () => {
        await browser.pause(500)

        const response = await get('https://cat-fact.herokuapp.com/facts/')
        console.log(response.body[0].type) // outputs: "cat"

        const el = await $('body')
        await el.click()
    })
})
```

### Common issues in sync mode

- `fibers` failed to install properly. The package usually comes with pre-built binaries but if your environment doesn't support it these need to be compiled which require [node-gyp](https://github.com/nodejs/node-gyp) and Python.

## Async Mode

If you decide to run in async mode all WebdriverIO commands return a Promise and need to be awaited to get the result, e.g.:

```js
describe('suite async', () => {
    it('test', async () => { // pay attention to `async` keyword
        const el = await $('body') // note `await` keyword
        await el.click()

        await browser.pause(500)

        console.log(browser.capabilities) // static properties should not be awaited

        await $('body').click()
    })
})
```

### Common issues in async mode

There can be quite some confusion when handling asynchronous commands manually. The usual problems are:

- previous command was not awaited:

    ```js
    const el = await $('body')
    el.waitForExist() // ERROR: await is missing here, you'll get `Unhandled promise rejection`.
    await el.click()
    ```

- Array loops (e.g., `forEach` & `map`) don't need `Promise.all`

    ```js
    const links = await $$('a')
    const linksText = await links.map((link) => {
        return link.getText();
    })
    ```
