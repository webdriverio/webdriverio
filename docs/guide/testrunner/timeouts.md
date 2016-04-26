name: Timeouts
category: testrunner
tags: guide
index: 5
title: WebdriverIO - Timeouts
---

Timeouts
========

Each command in WebdriverIO is an asynchronous operation where a request is fired to the Selenium server (or a cloud service like [Sauce Labs](https://saucelabs.com/)) and its response contains the result once the action has completed or failed. Therefor time is a crucial component in the whole testing process. Once a certain action depends on the state of a different action you need to make sure that they get executed in the right order. Timeouts play and important role when dealing with these issues.

## Selenium timeouts

### Session Script Timeout

A session has an associated session script timeout that specifies a time to wait for asynchronous scripts to run. Unless stated otherwise it is 30 seconds. You can set this timeout via:

```js
browser.timeouts('script', 60000);
browser.executeAsync(function (done) {
    console.log('this should not fail');
    setTimeout(done, 59000);
});
```

### Session Page Load Timeout

A session has an associated session page load timeout that specifies a time to wait for the page loading to complete. Unless stated otherwise it is 300,000 milliseconds. You can set this timeout via:

```js
browser.timeouts('page load', 10000);
```

### Session Implicit Wait Timeout

A session has an associated session implicit wait timeout that specifies a time to wait for the implicit element location strategy when locating elements using the [`element`](/api/protocol/element.html) or [`elements`](/api/protocol/elements.html) commands. Unless stated otherwise it is zero milliseconds. You can set this timeout via:

```js
browser.timeouts('implicit', 5000);
```

## WebdriverIO related timeouts

### WaitForXXX timeout

WebdriverIO provides multiple commands to wait on elements to reach a certain state (e.g. enabled, visible, existing). These commands take a selector argument and a timeout number which declares how long the instance should wait for that element to reach the state. The `waitforTimeout` option allows you to set the global timeout for all waitFor commands so you don't need to set the same timeout over and over again:

```js
// wdio.conf.js
exports.config = {
    // ...
    waitforTimeout: 5000,
    // ...
};
```

In your test you now can do this:

```js
var myElem = browser.element('#myElem');
myElem.waitForVisible();

// which is the same as
browser.waitForVisible('#myElem');

// which is the same as
browser.waitForVisible('#myElem', 5000);
```

## Framework related timeouts

Also the testing framework you use with WebdriverIO has to deal with timeouts especially since everything is asynchronous. It ensures that the test process don't get stuck if something went wrong. By default the timeout is set to 10 seconds which means that a single test should not take longer than that. A single test in Mocha looks like:

```js
it('should login into the application', function () {
    browser.url('/login');

    var form = browser.element('form');
    var username = browser.element('#username');
    var password = browser.element('#password');

    username.setValue('userXY');
    password.setValue('******');
    form.submit();

    expect(browser.getTitle()).to.be.equal('Admin Area');
});
```

In Cucumber the timeout applies to a single step definition. However if you want to increase the timeout because your test takes longer than the default value you need to set it in the framework options. This is for Mocha:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'mocha',
    mochaOpts: {
        timeout: 20000
    },
    // ...
}
```

For Jasmine:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'jasmine',
    jasmineNodeOpts: {
        defaultTimeoutInterval: 20000
    },
    // ...
}
```

and for Cucumber:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 20000
    },
    // ...
}
```
