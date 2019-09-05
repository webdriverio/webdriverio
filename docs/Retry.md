---
id: retry
title: Retry Flaky Tests
---

You can rerun certain tests with the WebdriverIO testrunner that turn out to be unstable due to things like a flaky network or race conditions. (However, it is not recommended to simply increase the rerun rate if tests become unstable!)

## Rerun suites in Mocha

Since version 3 of Mocha, you can rerun whole test suites (everything inside an `describe` block). If you use Mocha you should favor this retry mechanism instead of the WebdriverIO implementation that only allows you to rerun certain test blocks (everything within an `it` block). In order to use the `this.retries()` method, the suite block `describe` must use an unbound function `function(){}` instead of a fat arrow function `() => {}`, as described in [Mocha docs](https://mochajs.org/#arrow-functions). Using Mocha you can also set a retry count for all specs using `mochaOpts.retries` in your `wdio.conf.js`.

Here is an example:

```js
describe('retries', function() {
    // Retry all tests in this suite up to 4 times
    this.retries(4)

    beforeEach(() => {
        browser.url('http://www.yahoo.com')
    })

    it('should succeed on the 3rd try', function () {
        // Specify this test to only retry up to 2 times
        this.retries(2)
        console.log('run')
        expect(browser.isVisible('.foo')).to.eventually.be.true
    })
})
```

## Rerun single tests in Jasmine or Mocha

To rerun a certain test block you can just apply the number of reruns as last parameter after the test block function:

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', function () {
        console.log(this.wdioRetries) // returns number of retries
        // ...
    }, 3)
})
```

The same works for hooks too:

```js
describe('my flaky app', () => {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(() => {
        // ...
    }, 1)

    // ...
})
```

If you are using Jasmine, it also means that second parameter of both *test functions* (e.g., `it`) and *hooks* (e.g., `beforeEach`) , which is a `timeout` in Jasmine, is treated as retry count.

It is __not__ possible to rerun whole suites with Jasmine&mdash;only hooks or test blocks.

## Rerun Step Definitions in Cucumber

To define a rerun rate for a certain step definitions just apply a retry option to it, like:

```js
module.exports = function () {
    /**
     * step definition that runs max 3 times (1 actual run + 2 reruns)
     */
    this.Given(/^some step definition$/, { wrapperOptions: { retry: 2 } }, () => {
        // ...
    })
    // ...
})
```

Reruns can only be defined in your step definitions file, never in your feature file.

## Add retries on a per-specfile basis

Previously, only test- and suite-level retries were available, which are fine in most cases.

But in any tests which involve state (such as on a server or in a database) the state may be left invalid after the first test failure. Any subsequent retries may have no chance of passing, due to the invalid state they would start with.

A new `browser` instance is created for each specfile, which makes this an ideal place to hook and setup any other states (server, databases). Retries on this level mean that the whole setup process will simply be repeated, just as if it were for a new specfile.

```js
module.exports = function () {
    /**
     * The number of times to retry the entire specfile when it fails as a whole
     */
    specFileRetries: 1,
    /**
     * Retried specfiles are inserted at the beginning of the queue and retried immediately
     */
    specFileRetriesDeferred: false
}
```
