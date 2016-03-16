name: multiremote
category: usage
tags: guide
index: 4
title: WebdriverIO - Multiremote
---

Run multiple browser at the same time
=====================================

WebdriverIO allows you to run multiple Selenium sessions in a single test. This becomes handy when you need to test application features where multiple users are required (e.g. chat or WebRTC applications). Instead of creating a couple of remote instances where you need to execute common commands like [init](http://webdriver.io/api/protocol/init.html) or [url](http://webdriver.io/api/protocol/url.html) on each of those instances, you can simply create a multiremote instance and control all browser at the same time. To do so just use the `multiremote` function and pass an object with named browser with their capabilities into it. By giving each capability a name you will be able to easy select and access that single instance when executing commands on a single instance. Here is an example demonstrating a how to create a multiremote WebdriverIO instance in standalone mode:

```js
var webdriverio = require('webdriverio');
var browser = webdriverio.multiremote({
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
});
```

This would create two Selenium sessions with Chrome and Firefox. Instead of just Chrome and Firefox you can also boot up two mobile devices using [Appium](http://appium.io/). Any kind of OS/browser combination is possible here. All commands you call with the `browser` variable gets executed in parallel with each instance. This helps to streamline your integration test and speedup the execution a bit. For example initialise the session and open up an url:

```js
browser.init().url('http://chat.socket.io/');
```

Using the multiremote instance changes the way how results are accessible in callback functions. Since more than one browser executes the command we also receive more than one result.

```js
browser
    .init()
    .url('https://www.whatismybrowser.com/')
    .getText('.string-major').then(function(result) {
        console.log(result.resultChrome); // returns: 'Chrome 40 on Mac OS X (Yosemite)'
        console.log(result.resultFirefox); // returns: 'Firefox 35 on Mac OS X (Yosemite)'
    })
    .end();
```

You will notice that each command gets executed one by one. That means that the command finishes once all browser have executed it. This is helpful because it keeps the browser actions synced and it makes it easier to understand what currently happens.

Sometimes it is necessary to do different things with each browser in order to test something. For instance if we want to test a chat application, there has to be one browser who inputs a text message while the other browser waits to receive that message and do an assertion on it. You can get access to a single instance by using the `select` method.

```js
var myChromeBrowser = browser.select('myChromeBrowser');
var myFirefoxBrowser = browser.select('myFirefoxBrowser');
 
myChromeBrowser
    .setValue('#message', 'Hi, I am Chrome')
    .click('#send');
 
myFirefoxBrowser
    .waitForExist('.messages', 5000)
    .getText('.messages').then(function(messages) {
        assert.equal(messages, 'Hi, I am Chrome');
    });
```

In that example the `myFirefoxBrowser` instance will start waiting on a messages once the `myChromeBrowser` instance clicked on the send button. The execution is in parallel. Multiremote makes it easy and convenient to control multiple browser either doing the same thing in parallel or something different. In the latter case it might be the case where you want to sync up your instances to do something in parallel again. To do so just call the `sync` method. All methods which are chained behind the `sync` method get executed in parallel again:

```js
// these commands get executed in parallel by all defined instances
browser.init().url('http://example.com');
 
// do something with the Chrome browser
myChromeBrowser.setValue('.chatMessage', 'Hey Whats up!').keys('Enter')
 
// do something with the Firefox browser
myFirefoxBrowser.getText('.message').then(function (message) {
    console.log(messages);
    // returns: "Hey Whats up!"
});
 
// now sync instances again
browser.sync().url('http://anotherwebsite.com');
```

All these examples demonstrate the usage of multiremote in standalone mode. You can of course also use it with the wdio test runner. To do so just define the `capabilities` object in your `wdio.conf.js` as an object with the browser names as keys:

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

Since all commands are running synchronous with the wdio test runner, all multiremote commands are synchronous as well. That means that the previous described `sync` method got obsolete. In your test specs each single browser is globally available by its browser name:

```js
it('should do something with two browser', function () {
    browser.url('http://google.com');
    console.log(browser.getTitle()); // returns {myChromeBrowser: 'Google', myFirefoxBrowser: 'Google'}
 
    myFirefoxBrowser.url('http://yahoo.com');
    console.log(myFirefoxBrowser.getTitle()); // return 'Yahoo'
 
    console.log(browser.getTitle()); // returns {myChromeBrowser: 'Google', myFirefoxBrowser: 'Yahoo'}
});
```

__Note:__ Multiremote is not meant to execute all your tests in parallel. It should help you to coordinate more than one browser for sophisticated integration tests.
