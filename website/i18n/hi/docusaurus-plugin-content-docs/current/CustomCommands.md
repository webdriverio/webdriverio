---
id: customcommands
title: Custom Commands
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

If you want to extend the `browser` instance with your own set of commands, the browser method  `addCommand` is here for you. You can write your command in a asynchronous way, just as in your specs.

## Parameters

### Command Name

A name that defines the command and will be attached to the browser or element scope.

Type: `String`

### Custom Function

A function that is being executed when the command is called. The `this` scope is either [`WebdriverIO.Browser`](/docs/api/browser) or [`WebdriverIO.Element`](/docs/api/element) depending whether the command gets attached to the browser or element scope.

Type: `Function`

### Target Scope

Flag to decide whether to attach the command to the browser or element scope. If set to `true` the command will be an element command.

Type: `Boolean`<br /> Default: `false`

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

We recommend defining custom logic in [page objects](PageObjects.md), so they are bound to a specific page.

## Extend Type Definitions

With TypeScript, it's easy to extend WebdriverIO interfaces. Add types to your custom commands like this:

1. Create a type definition file (e.g., `./src/types/wdio.d.ts`)
2. a. If using a module-style type definition file (using import/export and `declare global WebdriverIO` in the type definition file), make sure to include the file path in the `tsconfig.json` `include` property.

   b.  If using ambient-style type definition files (no import/export in type definition files and `declare namespace WebdriverIO` for custom commands), make sure the `tsconfig.json` does *not* contain any `include` section, since this will cause all type definition files not listed in the `include` section to not be recognized by typescript.

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
import got from 'got'

browser.addCommand('makeRequest', async (url) => {
    return got(url).json()
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

समग्र दृष्टिकोण `addCommand`के समान है, केवल अंतर यह है कि कमांड फ़ंक्शन में पहला तर्क मूल फ़ंक्शन है जिसे आप अधिलेखित करने वाले हैं। कृपया नीचे कुछ उदाहरण देखें।

### ओवरराइटिंग ब्राउज़र कमांड

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

### ओवरराइटिंग एलिमेंट कमांड

एलिमेंट स्तर पर ओवरराइटिंग कमांड लगभग समान है। बस `True` तीसरे तर्क के रूप में `overwriteCommand`पास करें:

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
            await origClickFunction()
            return null
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

## अधिक वेबड्राइवर कमांड जोड़ें

यदि आप WebDriver प्रोटोकॉल का उपयोग कर रहे हैं और ऐसे प्लेटफ़ॉर्म पर परीक्षण चला रहे हैं जो [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) में किसी भी प्रोटोकॉल परिभाषा द्वारा परिभाषित नहीं किए गए अतिरिक्त कमांड का समर्थन करता है, तो आप उन्हें `addCommand` इंटरफ़ेस के माध्यम से मैन्युअल रूप से जोड़ सकते हैं। `webdriver` पैकेज एक कमांड रैपर प्रदान करता है जो इन नए एंडपॉइंट्स को उसी तरह पंजीकृत करने की अनुमति देता है जैसे अन्य कमांड, समान पैरामीटर चेक और त्रुटि प्रबंधन प्रदान करते हैं। इस नए समापन बिंदु को पंजीकृत करने के लिए कमांड रैपर को इम्पोर्ट करें और इसके साथ एक नया कमांड निम्नानुसार पंजीकृत करें:

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

इस आदेश को अमान्य पैरामीटर के साथ कॉल करने से पूर्वनिर्धारित प्रोटोकॉल कमांड के समान त्रुटि प्रबंधन होता है, उदाहरण के लिए:

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

कमांड को सही ढंग से कॉल करना, उदाहरण के लिए `browser.myNewCommand('foo', 'bar')`, सही ढंग से एक वेबड्राइवर अनुरोध बनाता है जैसे `http://localhost:4444/session/7bae3c4c55c3bf82f54894ddc83c5f31/foobar/foo` जैसे पेलोड के साथ `{ foo: 'bar' }`.

:::note
`:sessionId` url पैरामीटर स्वचालित रूप से वेबड्राइवर सत्र की सत्र आईडी के साथ प्रतिस्थापित किया जाएगा। अन्य यूआरएल पैरामीटर लागू किए जा सकते हैं लेकिन उन्हें `variables`के भीतर परिभाषित करने की आवश्यकता है।
:::

[`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) पैकेज में प्रोटोकॉल कमांड को कैसे परिभाषित किया जा सकता है, इसके उदाहरण देखें।
