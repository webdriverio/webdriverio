name: modes
category: getstarted
tags: guide
index: 2
title: WebdriverIO - How to use WebdriverIO
---

# How to use WebdriverIO

WebdriverIO can be used for various purposes. It implements the Webdriver protocol API and can run browser in an automated way. The framework is designed to work in any arbitrary environment and for any kind of task. It is independent from any 3rd party frameworks and only requires Node.js to run.

### Standalone Mode

The probably simplest form to run WebdriverIO is in standalone mode. This has nothing to do with the Selenium server file which is usually called `selenium-server-standalone`. It basically just means that you require the `webdriverio` package in your project and use the API behind it to run your automation. Here is a simple example:

```js
var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = webdriverio.remote(options);

client
    .init()
    .url('https://duckduckgo.com/')
    .setValue('#search_form_input_homepage', 'WebdriverIO')
    .click('#search_button_homepage')
    .getTitle().then(function(title) {
        console.log('Title is: ' + title);
        // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
    })
    .end();
```

Using WebdriverIO in standalone mode allows you to integrate this automation tool in your own (test) project to create a new automation library. Popular examples of that are [Chimp](https://chimp.readme.io/) or [CodeceptJS](http://codecept.io/). You can also write plain Node scripts to scrape the World Wide Web for content or anything else where a running browser is required.

### The WDIO Testrunner

The main purpose of WebdriverIO though is end to end testing on big scale. We therefore implemented a test runner that helps you to build a reliable test suite that is easy to read and maintain. The test runner takes care of many problems you are usually facing when working with plain automation libraries. For one it organizes your test runs and splits up test specs so your tests can be executed with maximum concurrency. It also handles session management and provides a lot of features that help you to debug problems and find errors in your tests. Here is an same example from above written as test spec and executed by wdio:

```js
describe('DuckDuckGo search', function() {
    it('searches for WebdriverIO', function() {
        browser.url('https://duckduckgo.com/');
        browser.setValue('#search_form_input_homepage', 'WebdriverIO');
        browser.click('#search_button_homepage');

        var title = browser.getTitle();
        console.log('Title is: ' + title);
        // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
    });
});
```

The test runner is an abstraction of popular test frameworks like Mocha, Jasmine or Cucumber. Different than using the standalone mode all commands that get executed by the wdio test runner are synchronous. That means that you don't use promises anymore to handle async code. To run your tests using the wdio test runner check out the [Getting Started](/guide/testrunner/gettingstarted.html) section for more information.
