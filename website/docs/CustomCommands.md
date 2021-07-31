---
id: customcommands
title: Custom Commands
---

## Adding custom commands

If you want to extend the `browser` instance with your own set of commands, the browser method  `addCommand` is here for you.

You can write your command in a synchronous way (default), just as in your specs&mdash;or, you can write it in an asynchronous way (like when using WebdriverIO in standalone mode).

This example shows how to add a new command that returns the current URL and title as one result, using only synchronous commands:

```js
browser.addCommand('getUrlAndTitle', async function (customVar) {
    // `this` refers to the `browser` scope
    return {
        url: await this.getUrl(),
        title: await this.getTitle(),
        customVar: customVar
    }
})
```

Additionally, you can extend the element instance with your own set of commands, by passing `true` as the final argument.

By default, element is expected to exist in `waitforTimeout` milliseconds, or an exception will be thrown.

```js
browser.addCommand("waitAndClick", async function () {
    // `this` is return value of $(selector)
    await this.waitForDisplayed()
    await this.click()
}, true)
```

Custom commands give you the opportunity to bundle a specific sequence of commands you use frequently as a single call. You can define custom commands at any point in your test suite; just make sure that the command is defined *before* its first use. (The `before` hook in your `wdio.conf.js` is one good place to create them.)

Once defined, you can use them as follows:

```js
it('should use my custom command', async () => {
    await browser.url('http://www.github.com')
    const result = await browser.getUrlAndTitle('foobar')

    assert.strictEqual(result.url, 'https://github.com/')
    assert.strictEqual(result.title, 'GitHub · Where software is built')
    assert.strictEqual(result.customVar, 'foobar')
})
```

If you need to control element existence in a custom command, it is possible either to:

- add the command to `browser`, and pass a selector; *OR*
- add the command to `element` using name that starts with one of the following: `waitUntil`, `waitFor`, `isExisting`, `isDisplayed`.

```js
browser.addCommand('isDisplayedWithin', async function (timeout) {
    try {
        await this.waitForDisplayed(timeout)
        return true
    } catch (err) {
        return false
    }
}, true)
```

__Note:__ If you register a custom command to the `browser` scope, the command won't be accessible for elements. Likewise, if you register a command to the element scope, it won't be accessible in the `browser` scope:

```js
browser.addCommand("myCustomBrowserCommand", () => { return 1 })
const elem = await $('body')
console.log(typeof browser.myCustomBrowserCommand) // outputs "function"
console.log(typeof elem.myCustomBrowserCommand()) // outputs "undefined"

browser.addCommand("myCustomElementCommand", () => { return 1 }, true)
const elem2 = await $('body')
console.log(typeof browser.myCustomElementCommand) // outputs "undefined"
console.log(elem2.myCustomElementCommand('foobar')) // outputs "function"

const elem3 = await $('body')
elem3.addCommand("myCustomElementCommand2", () => { return 1 })
console.log(typeof browser.myCustomElementCommand2) // outputs "undefined"
console.log(elem3.myCustomElementCommand2('foobar')) // outputs "function"
```

Be careful to not overload the `browser` scope with too many custom commands.

We recommend defining custom logic in [page objects](PageObjects.md), so they are bound to a specific page.

## Integrate 3rd party libraries

If you use external libraries (e.g., to do database calls) that support promises, a nice approach to integrate them is to wrap certain API methods with a custom command.

When returning the promise, WebdriverIO ensures that it doesn't continue with the next command until the promise is resolved. If the promise gets rejected, the command will throw an error.

```js
import request from 'request'

browser.addCommand('makeRequest', async (url) => {
    return request.get(url).then((response) => response.body)
})
```

Then, just use it in your WDIO test specs synchronously:

```js
it('execute external library in a sync way', async () => {
    await browser.url('...')
    const body = await browser.makeRequest('http://...')
    console.log(body) // returns response body
})
```

**Note:** The result of your custom command is the result of the promise you return. Also, there is no support for synchronous commands in standalone mode; therefore, you must _always_ handle asynchronous commands using promises.

## Overwriting native commands

You can also overwrite native commands with `overwriteCommand`.

It is not recommended to do this, because it may lead to unpredictable behavior of the framework!

The overall approach is similar to `addCommand`, the only difference is that the first argument in the command function is the original function that you are about to overwrite. Please see some examples below.

**NOTE:** Examples below assume sync mode. If you are not using it, don't forget to add `async`/`await`.

### Overwriting browser commands

```js
/**
 * print milliseconds before pause and return its value.
 */
// 'pause'            - name of command to be overwritten
// origPauseFunction  - original pause function
browser.overwriteCommand('pause', async (origPauseFunction, ms) => {
    console.log(`sleeping for ${ms}`)
    await origPauseFunction(ms)
    return ms
})

// then use it as before
console.log(`was sleeping for ${await browser.pause(1000)}`)
```

#### Overwriting element commands

Overwriting commands on element level is almost the same. Simply pass `true` as the third argument to `overwriteCommand`:

```js
/**
 * Attempt to scroll to element if it is not clickable.
 * Pass { force: true } to click with JS even if element is not visible or clickable.
 */
// 'click'            - name of command to be overwritten
// origClickFunction  - original click function
browser.overwriteCommand('click', async function (origClickFunction, { force = false } = {}) {
    if (!force) {
        try {
            // attempt to click
            return origClickFunction()
        } catch (err) {
            if (err.message.includes('not clickable at point')) {
                console.warn('WARN: Element', this.selector, 'is not clickable.',
                    'Scrolling to it before clicking again.')

                // scroll to element and click again
                await this.scrollIntoView()
                return origClickFunction()
            }
            throw err
        }
    }

    // clicking with js
    console.warn('WARN: Using force click for', this.selector)
    await browser.execute((el) => {
        el.click()
    }, this)
}, true) // don't forget to pass `true` as 3rd argument

// then use it as before
const elem = await $('body')
await elem.click()

// or pass params
await elem.click({ force: true })
```

## Add More WebDriver Commands

If you are using the WebDriver protocol and run tests on a platform that supports additional commands not defined by any of the protocol definitions in [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/protocols) you can manually add them through the `addCommand` interface. The `webdriver` package offers a command wrapper that allows to register these new endpoints in the same way as other commands, providing the same parameter checks and error handling. To register this new endpoint import the command wrapper and register a new command with it as follows:

```js
import { command } from 'webdriver'

browser.addCommand('myNewCommand', command('POST', '/session/:sessionId/foobar/:someId', {
    command: 'myNewCommand',
    description: 'a new WebDriver command',
    ref: 'https://vendor.com/commands/#myNewCommand',
    variables: [{
        name: 'someId',
        description: 'some id to something'
    }],
    parameters: [{
        name: 'foo',
        type: 'string',
        description: 'a valid parameter',
        required: true
    }]
}))
```

Calling this command with invalid parameters results in the same error handling as predefined protocol commands, e.g.:

```js
// call command without required url parameter and payload
await browser.myNewCommand()

/**
 * results in the following error:
 * Error: Wrong parameters applied for myNewCommand
 * Usage: myNewCommand(someId, foo)
 *
 * Property Description:
 *   "someId" (string): some id to something
 *   "foo" (string): a valid parameter
 *
 * For more info see https://my-api.com
 *    at Browser.protocolCommand (...)
 *    ...
 */
```

Calling the command correctly, e.g. `browser.myNewCommand('foo', 'bar')`, correctly makes a WebDriver request to e.g. `http://localhost:4444/session/7bae3c4c55c3bf82f54894ddc83c5f31/foobar/foo` with a payload like `{ foo: 'bar' }`.

:::note
The `:sessionId` url parameter will be automatically substituted with the session id of the WebDriver session. Other url parameter can be applied but need to be defined within `variables`.
:::

See examples of how protocol commands can be defined in the [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/protocols) package.
