---
id: multiremote
title: Multiremote
---

WebdriverIO allows you to run multiple WebDriver/Appium sessions in a single test. This becomes handy when you need to test application features where multiple users are required (e.g. chat or WebRTC applications). Instead of creating a couple of remote instances where you need to execute common commands like [newSession](/docs/api/webdriver.html#newsession) or [url](/docs/api/browser/url.html) on each of those instances, you can simply create a multiremote instance and control all browser at the same time. To do so just use the `multiremote` function and pass an object with named browser with their capabilities into it. By giving each capability a name you will be able to easy select and access that single instance when executing commands on a single instance.

## Using Standalone Mode

Here is an example demonstrating a how to create a multiremote WebdriverIO instance in **standalone mode**:

```js
import { multiremote } from 'webdriverio';

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
    });

    // open url with both browser at the same time
    await browser.url('http://json.org');

    // click on an element at the same time
    const elem = await browser.$('#someElem');
    await elem.click();

    // only click with one browser (Firefox)
    await elem.myFirefoxBrowser.click();
})()
```

## Using WDIO Testrunner

In order to use multiremote in the wdio testrunner just define the `capabilities` object in your `wdio.conf.js` as an object with the browser names as keys (instead of a list of capabilities):

```js
export.config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            desiredCapabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            desiredCapabilities: {
                browserName: 'firefox'
            }
        }
    }
    // ...
};
```

This would create two WebDriver sessions with Chrome and Firefox. Instead of just Chrome and Firefox you can also boot up two mobile devices using [Appium](http://appium.io/). Any kind of OS/browser combination is possible here (e.g. cross platform like mobile device and desktop browser). All commands you call with the `browser` variable gets executed in parallel with each instance. This helps to streamline your integration test and speedup the execution a bit. For example open up an url:

```js
browser.url('http://chat.socket.io/');
```

Each command result will be an object with the browser names as key and the actual command result as value, e.g.

```js
// wdio testrunner example
browser.url('https://www.whatismybrowser.com/');

const elem = $('.string-major');
const result = elem.getText();

console.log(result.resultChrome); // returns: 'Chrome 40 on Mac OS X (Yosemite)'
console.log(result.resultFirefox); // returns: 'Firefox 35 on Mac OS X (Yosemite)'
```

You will notice that each command gets executed one by one. That means that the command finishes once all browser have executed it. This is helpful because it keeps the browser actions synced and it makes it easier to understand what currently happens.

Sometimes it is necessary to do different things with each browser in order to test something. For instance if we want to test a chat application, there has to be one browser who inputs a text message while the other browser waits to receive that message and do an assertion on it. When using the WDIO testrunner it registers the browser names with their instances to the global scope, e.g.

```js
myChromeBrowser.$('#message').setValue('Hi, I am Chrome');
myChromeBrowser.$('#send').click();

const firefoxMessages = myFirefoxBrowser.$$('.messages')
// wait until messages arrive
firefoxMessages.waitForExist();
// check if one of the messages contain the Chrome message
assert.true(
    firefoxMessages.map((m) => m.getText()).includes('Hi, I am Chrome')
)
```

In that example the `myFirefoxBrowser` instance will start waiting on a messages once the `myChromeBrowser` instance clicked on the send button. Multiremote makes it easy and convenient to control multiple browser either doing the same thing in parallel or something different.

**Note:** Multiremote is not meant to execute all your tests in parallel. It should help you to coordinate more than one browser for sophisticated integration tests.