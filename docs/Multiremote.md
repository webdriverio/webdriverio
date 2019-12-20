---
id: multiremote
title: Multiremote
---

WebdriverIO allows you to run multiple WebDriver/Appium sessions in a single test. This becomes handy when you’re testing features that require multiple users (for example, chat or WebRTC applications). 

Instead of creating a couple of remote instances where you need to execute common commands like [`newSession`](/docs/api/webdriver.html#newsession) or [`url`](/docs/api/browser/url.html) on each instance, you can simply create a **multiremote** instance and control all browsers at the same time. 

To do so, just use the `multiremote()` function, and pass in an object with names keyed to `capabilities` for values. By giving each capability a name, you can easily select and access that single instance when executing commands on a single instance.

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

    // click on an element at the same time
    const elem = await browser.$('#someElem')
    await elem.click()

    // only click with one browser (Firefox)
    await elem.myFirefoxBrowser.click()
})()
```

## Using WDIO Testrunner

In order to use multiremote in the WDIO testrunner, just define the `capabilities` object in your `wdio.conf.js` as an object with the browser names as keys (instead of a list of capabilities):

```js
export.config = {
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

This will create two WebDriver sessions with Chrome and Firefox. Instead of just Chrome and Firefox you can also boot up two mobile devices using [Appium](http://appium.io). 

Any kind of OS/browser combination is possible here (including mobile and desktop browsers). All commands your tests call via the `browser` variable are executed in parallel with each instance. This helps streamline your integration tests and speed up their execution. 

For example, if you open up a URL:

```js
browser.url('http://chat.socket.io')
```

Each command’s result will be an object with the browser names as the key, and the command result as value, like so:

```js
// wdio testrunner example
browser.url('https://www.whatismybrowser.com')

const elem = $('.string-major')
const result = elem.getText()

console.log(result.resultChrome) // returns: 'Chrome 40 on Mac OS X (Yosemite)'
console.log(result.resultFirefox) // returns: 'Firefox 35 on Mac OS X (Yosemite)'
```

Notice that each command is executed one by one. This means that the command finishes once all browsers have executed it. This is helpful because it keeps the browser actions synced, which makes it easier to understand what’s currently happening.

Sometimes it is necessary to do different things in each browser in order to test something. For instance, if we want to test a chat application, there has to be one browser who sends a text message while another browser waits to receive it, and then run an assertion on it. 

When using the WDIO testrunner, it registers the browser names with their instances to the global scope:

```js
myChromeBrowser.$('#message').setValue('Hi, I am Chrome')
myChromeBrowser.$('#send').click()

const firefoxMessages = myFirefoxBrowser.$$('.messages')
// wait until messages arrive
firefoxMessages.waitForExist()
// check if one of the messages contain the Chrome message
assert.true(
    firefoxMessages.map((m) => m.getText()).includes('Hi, I am Chrome')
)
```

In this example, the `myFirefoxBrowser` instance will start waiting on a message once the `myChromeBrowser` instance has clicked on `#send` button. 

Multiremote makes it easy and convenient to control multiple browsers, whether you want them doing the same thing in parallel, or different things in concert.

__NOTE:__ Multiremote is _not_ meant to execute all your tests in parallel. 
It is intended to help coordinate multiple browsers for sophisticated integration tests.
