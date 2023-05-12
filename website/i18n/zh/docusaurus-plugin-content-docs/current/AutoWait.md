---
id: autowait
title: Auto-waiting
---

One of the most common reasons for flaky tests are interactions with elements that don't exist in your application at the time you want to interact with it. Modern web applications are very dynamic, elements show up and disappear. As a human we are waiting unconsciously for elements but in an automated script we don't consider this as an action. There are two ways to wait on an element to show up.

## Implicit vs. Explicit

The WebDriver protocol offers [implicit timeouts](https://w3c.github.io/webdriver/#timeouts) that allow specify how long the driver is suppose to wait for an element to show up. By default this timeout is set to `0` and therefore makes the driver return with an `no such element` error immediately if an element could not be found on the page. Increasing this timeout using the [`setTimeout`](/docs/api/browser/setTimeout) would make the driver wait and increases the chances that the element shows up eventually.

:::note

Read more about WebDriver and framework related timeouts in the [timeouts guide](/docs/timeouts)

:::

A different approach is to use explicit waiting which is built into the WebdriverIO framework in commands such as [`waitForExist`](/docs/api/element/waitForExist). With this technique the framework polls for the element by calling multiple [`findElements`](/docs/api/webdriver#findelements) commands until the timeout is reached.

## Built-in Waiting

Both waiting mechanisms are incompatible with each other and can cause longer wait times. As implicit waits are a global setting it is applied to all elements which is sometimes not the desired behavior. Therefore WebdriverIO provides a built-in wait mechanism that automatically explicitly waits on the element before interacting with it.

:::info Recommendation

We recommend __not__ using implicit waits at all and have WebdriverIO handle element wait actions.

:::

Using implicit waits is also problematic in cases you are interested to wait until an element disappears. WebdriverIO uses polls for the element until it receives an error. Having an implicit wait option set unnecessarily delays the execution of the command and can cause long test durations.

You can set a default value for WebdriverIOs automatic explicit waiting by setting a [`waitforTimeout`](/docs/configuration#waitfortimeout) option in your configuration.

## Limitations

WebdriverIO can only wait for elements when they are implicitly defined. This is always the case when using the [`$`](/docs/api/browser/$) to fetch an element. It however is not supported when fetching a set of elements like this:

```js
const divs = await $$('div')
await divs[2].click() // can throw "Cannot read property 'click' of undefined"
```

It is an absolute legitimate action to fetch a set of elements and click on the nth element of that set. However WebdriverIO doesn't know how many elements you are expecting to show up. As [`$$`](/docs/api/browser/$$) returns an [array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of WebdriverIO elements you have to manually check if the return value contains enough items. We recommend using [`waitUntil`](/docs/api/browser/waitUntil) for this, e.g.:

```js
const div = await browser.waitUntil(async () => {
    const elems = await $$('div')
    if (elems.length !== 2) {
        return false
    }

    return elems[2]
}, {
    timeoutMsg: 'Never found enough div elements'
})
await div.click()
```
