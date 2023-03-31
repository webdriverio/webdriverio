---
id: multiremote
title: Multiremote
---

WebdriverIO allows you to run multiple automated sessions in a single test. This becomes handy when you’re testing features that require multiple users (for example, chat or WebRTC applications).

Instead of creating a couple of remote instances where you need to execute common commands like [`newSession`](/docs/api/webdriver#newsession) or [`url`](/docs/api/browser/url) on each instance, you can simply create a **multiremote** instance and control all browsers at the same time.

To do so, just use the `multiremote()` function, and pass in an object with names keyed to `capabilities` for values. By giving each capability a name, you can easily select and access that single instance when executing commands on a single instance.

:::info

Multiremote is _not_ meant to execute all your tests in parallel.
It is intended to help coordinate multiple browsers and/or mobile devices for special integration tests (e.g. chat applications).

:::

All multiremote instances return an array of results. The first result represents the capability defined first in the capability object the second result the second capability and so on.

## Using Standalone Mode

Here is an example of how to create a multiremote instance in __standalone mode__:

```js
import { multiremote } from 'webdriverio'

(async () => {
    const browser = await multiremote({
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    })

    // open url with both browser at the same time
    await browser.url('http://json.org')

    // call commands at the same time
    const title = await browser.getTitle()
    expect(title).toEqual(['JSON', 'JSON'])

    // click on an element at the same time
    const elem = await browser.$('#someElem')
    await elem.click()

    // only click with one browser (Firefox)
    await elem.getInstance('myFirefoxBrowser').click()
})()
```

## Using WDIO Testrunner

In order to use multiremote in the WDIO testrunner, just define the `capabilities` object in your `wdio.conf.js` as an object with the browser names as keys (instead of a list of capabilities):

```js
export const config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }
    // ...
}
```

This will create two WebDriver sessions with Chrome and Firefox. Instead of just Chrome and Firefox you can also boot up two mobile devices using [Appium](http://appium.io) or one mobile device and one browser.

You can even boot up one of the [cloud services backend](https://webdriver.io/docs/cloudservices.html) together with local Webdriver/Appium, or Selenium Standalone instances. WebdriverIO automatically detect cloud backend capabilities if you specified either of `bstack:options` ([Browserstack](https://webdriver.io/docs/browserstack-service.html)), `sauce:options` ([SauceLabs](https://webdriver.io/docs/sauce-service.html)), or `tb:options` ([TestingBot](https://webdriver.io/docs/testingbot-service.html)) in browser capabilities.

```js
export const config = {
    // ...
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myBrowserStackFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox',
                'bstack:options': {
                    // ...
                }
            }
        }
    },
    services: [
        ['browserstack', 'selenium-standalone']
    ],
    // ...
}
```

Any kind of OS/browser combination is possible here (including mobile and desktop browsers). All commands your tests call via the `browser` variable are executed in parallel with each instance. This helps streamline your integration tests and speed up their execution.

For example, if you open up a URL:

```js
browser.url('https://socketio-chat-h9jt.herokuapp.com/')
```

Each command’s result will be an object with the browser names as the key, and the command result as value, like so:

```js
// wdio testrunner example
await browser.url('https://www.whatismybrowser.com')

const elem = await $('.string-major')
const result = await elem.getText()

console.log(result[0]) // returns: 'Chrome 40 on Mac OS X (Yosemite)'
console.log(result[1]) // returns: 'Firefox 35 on Mac OS X (Yosemite)'
```

Notice that each command is executed one by one. This means that the command finishes once all browsers have executed it. This is helpful because it keeps the browser actions synced, which makes it easier to understand what’s currently happening.

Sometimes it is necessary to do different things in each browser in order to test something. For instance, if we want to test a chat application, there has to be one browser who sends a text message while another browser waits to receive it, and then run an assertion on it.

When using the WDIO testrunner, it registers the browser names with their instances to the global scope:

```js
const myChromeBrowser = browser.getInstance('myChromeBrowser')
await myChromeBrowser.$('#message').setValue('Hi, I am Chrome')
await myChromeBrowser.$('#send').click()

// wait until messages arrive
await $('.messages').waitForExist()
// check if one of the messages contain the Chrome message
assert.true(
    (
        await $$('.messages').map((m) => m.getText())
    ).includes('Hi, I am Chrome')
)
```

In this example, the `myFirefoxBrowser` instance will start waiting on a message once the `myChromeBrowser` instance has clicked on `#send` button.

Multiremote makes it easy and convenient to control multiple browsers, whether you want them doing the same thing in parallel, or different things in concert.

## Accessing browser instances using strings via the browser object
In addition to accessing the browser instance via their global variables (e.g. `myChromeBrowser`, `myFirefoxBrowser`), you can also access them via the `browser` object, e.g. `browser["myChromeBrowser"]` or `browser["myFirefoxBrowser"]`. You can get a list of all your instances via `browser.instances`. This is especially useful when writing re-usable test steps that can be performed in either browser, e.g.:

wdio.conf.js:
```js
    capabilities: {
        userA: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        userB: {
            capabilities: {
                browserName: 'chrome'
            }
        }
    }
```

Cucumber file:
    ```feature
    When User A types a message into the chat
    ```

Step definition file:
```js
When(/^User (.) types a message into the chat/, async (userId) => {
    await browser.getInstance(`user${userId}`).$('#message').setValue('Hi, I am Chrome')
    await browser.getInstance(`user${userId}`).$('#send').click()
})
```
