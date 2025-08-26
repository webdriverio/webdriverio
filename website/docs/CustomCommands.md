---
id: customcommands
title: Custom Commands
---

If you want to extend the `browser` instance with your own set of commands, the browser method `addCommand` is here for you. You can write your command in an asynchronous way, just as in your specs.

## Parameters

### Command Name

A name that defines the command and will be attached to the browser or element scope.

Type: `String`

### Custom Function

A function that is being executed when the command is called. The `this` scope is either [`WebdriverIO.Browser`](/docs/api/browser) or [`WebdriverIO.Element`](/docs/api/element) depending whether the command gets attached to the browser or element scope.

Type: `Function`

### Target Scope

Flag to decide whether to attach the command to the browser or element scope. If set to `true` the command will be an element command.

Type: `Boolean`<br />
Default: `false`

### Disable implicitWait

Flag to decide whether to implicitly wait for the element to exist before calling the custom command.

Type: `Boolean`<br />
Default: `false`

## Examples

This example shows how to add a new command that returns the current URL and title as one result. The scope (`this`) is a [`WebdriverIO.Browser`](/docs/api/browser) object.

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

Additionally, you can extend the element instance with your own set of commands, by passing `true` as the final argument. The scope (`this`) in this case is a [`WebdriverIO.Element`](/docs/api/element) object.

```js
browser.addCommand("waitAndClick", async function () {
    // `this` is return value of $(selector)
    await this.waitForDisplayed()
    await this.click()
}, true)
```

By default, element custom commands wait for the element to exist before calling the custom command. Even though most of the time this is desired, if not, it can be disabled with `disableImplicitWait`:

```js
browser.addCommand("waitAndClick", async function () {
    // `this` is return value of $(selector)
    await this.waitForExists()
    await this.click()
}, true /* element scope flag */, undefined, undefined, true /* disable implicit wait flag */)
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

__Note:__ If you register a custom command to the `browser` scope, the command won't be accessible for elements. Likewise, if you register a command to the element scope, it won't be accessible in the `browser` scope:

```js
browser.addCommand("myCustomBrowserCommand", () => { return 1 })
const elem = await $('body')
console.log(typeof browser.myCustomBrowserCommand) // outputs "function"
console.log(typeof elem.myCustomBrowserCommand()) // outputs "undefined"

browser.addCommand("myCustomElementCommand", () => { return 1 }, true)
const elem2 = await $('body')
console.log(typeof browser.myCustomElementCommand) // outputs "undefined"
console.log(await elem2.myCustomElementCommand('foobar')) // outputs "1"

const elem3 = await $('body')
elem3.addCommand("myCustomElementCommand2", () => { return 2 })
console.log(typeof browser.myCustomElementCommand2) // outputs "undefined"
console.log(await elem3.myCustomElementCommand2('foobar')) // outputs "2"
```

__Note:__ If you need to chain a custom command, the command should end with `$`,

```js
browser.addCommand("user$", (locator) => { return ele })
browser.addCommand("user$", (locator) => { return ele }, true)
await browser.user$('foo').user$('bar').click()
```

Be careful to not overload the `browser` scope with too many custom commands.

We recommend defining custom logic in [page objects](pageobjects), so they are bound to a specific page.

### Multiremote

`addCommand` works in a similar way for multiremote, except the new command will propagate down to the children instances. You have to be mindful when using `this` object since the multiremote `browser` and its children instances have different `this`.

This example shows how to add a new command for multiremote.

```js
import { multiremotebrowser } from '@wdio/globals'

multiremotebrowser.addCommand('getUrlAndTitle', async function (this: WebdriverIO.MultiRemoteBrowser, customVar: any) {
    // `this` refers to:
    //      - MultiRemoteBrowser scope for browser
    //      - Browser scope for instances
    return {
        url: await this.getUrl(),
        title: await this.getTitle(),
        customVar: customVar
    }
})

multiremotebrowser.getUrlAndTitle()
/*
{
    url: [ 'https://webdriver.io/', 'https://webdriver.io/' ],
    title: [
        'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
        'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO'
    ],
    customVar: undefined
}
*/

multiremotebrowser.getInstance('browserA').getUrlAndTitle()
/*
{
    url: 'https://webdriver.io/',
    title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
    customVar: undefined
}
*/
```

## Extend Type Definitions

With TypeScript, it's easy to extend WebdriverIO interfaces. Add types to your custom commands like this:

1. Create a type definition file (e.g., `./src/types/wdio.d.ts`)
2. a. If using a module-style type definition file (using import/export and `declare global WebdriverIO` in the type definition file), make sure to include the file path in the `tsconfig.json` `include` property.

   b. If using ambient-style type definition files (no import/export in type definition files and `declare namespace WebdriverIO` for custom commands), make sure the `tsconfig.json` does *not* contain any `include` section, since this will cause all type definition files not listed in the `include` section to not be recognized by TypeScript.

<Tabs
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
    {label: 'Ambient Type Definitions (no tsconfig include)', value: 'ambient'},
  ]
}>
<TabItem value="modules">

```json title="tsconfig.json"
{
    "compilerOptions": { ... },
    "include": [
        "./test/**/*.ts",
        "./src/types/**/*.ts"
    ]
}
```

</TabItem>
<TabItem value="ambient">

```json title="tsconfig.json"
{
    "compilerOptions": { ... }
}
```

</TabItem>
</Tabs>

3. Add definitions for your commands according to your execution mode.

<Tabs
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
    {label: 'Ambient Type Definitions', value: 'ambient'},
  ]
}>
<TabItem value="modules">

```typescript
declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface MultiRemoteBrowser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface Element {
            elementCustomCommand: (arg: any) => Promise<number>
        }
    }
}
```

</TabItem>
<TabItem value="ambient">

```typescript
declare namespace WebdriverIO {
    interface Browser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface MultiRemoteBrowser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface Element {
        elementCustomCommand: (arg: any) => Promise<number>
    }
}
```

</TabItem>
</Tabs>

## Integrate 3rd Party Libraries

If you use external libraries (e.g., to do database calls) that support promises, a nice approach to integrate them is to wrap certain API methods with a custom command.

When returning the promise, WebdriverIO ensures that it doesn't continue with the next command until the promise is resolved. If the promise gets rejected, the command will throw an error.

```js
browser.addCommand('makeRequest', async (url) => {
    const response = await fetch(url)
    return await response.json()
})
```

Then, just use it in your WDIO test specs:

```js
it('execute external library in a sync way', async () => {
    await browser.url('...')
    const body = await browser.makeRequest('http://...')
    console.log(body) // returns response body
})
```

**Note:** The result of your custom command is the result of the promise you return.

## Overwriting Commands

You can also overwrite native commands with `overwriteCommand`.

It is not recommended to do this, because it may lead to unpredictable behavior of the framework!

The overall approach is similar to `addCommand`, the only difference is that the first argument in the command function is the original function that you are about to overwrite. Please see some examples below.

### Overwriting Browser Commands

```js
/**
 * Print milliseconds before pause and return its value.
 * 
 * @param pause - name of command to be overwritten
 * @param this of func - the original browser instance on which the function was called
 * @param originalPauseFunction of func - the original pause function
 * @param ms of func - the actual parameters passed
  */
browser.overwriteCommand('pause', async function (this, originalPauseFunction, ms) {
    console.log(`sleeping for ${ms}`)
    await originalPauseFunction(ms)
    return ms
})

// then use it as before
console.log(`was sleeping for ${await browser.pause(1000)}`)
```

### Overwriting Element Commands

Overwriting commands on element level is almost the same. Simply pass `true` as the third argument to `overwriteCommand`:

```js
/**
 * Attempt to scroll to element if it is not clickable.
 * Pass { force: true } to click with JS even if element is not visible or clickable.
 * Show that the original function argument type can be kept with `options?: ClickOptions`
 *
 * @param this of func - the element on which the original function was called
 * @param originalClickFunction of func - the original pause function
 * @param options of func - the actual parameters passed
 */
browser.overwriteCommand(
    'click',
    async function (this, originalClickFunction, options?: ClickOptions & { force?: boolean }) {
        const { force, ...restOptions } = options || {}
        if (!force) {
            try {
                // attempt to click
                await originalClickFunction(options)
                return
            } catch (err) {
                if ((err as Error).message.includes('not clickable at point')) {
                    console.warn('WARN: Element', this.selector, 'is not clickable.', 'Scrolling to it before clicking again.')

                    // scroll to element and click again
                    await this.scrollIntoView()
                    return originalClickFunction(options)
                }
                throw err
            }
        }

        // clicking with js
        console.warn('WARN: Using force click for', this.selector)
        await browser.execute((el) => {
            el.click()
        }, this)
    },
    true, // don't forget to pass `true` as 3rd argument
)

// then use it as before
const elem = await $('body')
await elem.click()

// or pass params
await elem.click({ force: true })
```

## Add More WebDriver Commands

If you are using the WebDriver protocol and run tests on a platform that supports additional commands not defined by any of the protocol definitions in [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) you can manually add them through the `addCommand` interface. The `webdriver` package offers a command wrapper that allows to register these new endpoints in the same way as other commands, providing the same parameter checks and error handling. To register this new endpoint import the command wrapper and register a new command with it as follows:

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

See examples of how protocol commands can be defined in the [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) package.
