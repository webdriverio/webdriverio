---
id: retry
title: Retry Flaky Tests
---

You can rerun certain tests with the WebdriverIO testrunner that turn out to be unstable due to things like a flaky network or race conditions. (However, it is not recommended to simply increase the rerun rate if tests become unstable!)

## Rerun suites in Mocha

Since version 3 of Mocha, you can rerun whole test suites (everything inside an `describe` block). If you use Mocha you should favor this retry mechanism instead of the WebdriverIO implementation that only allows you to rerun certain test blocks (everything within an `it` block). In order to use the `this.retries()` method, the suite block `describe` must use an unbound function `function(){}` instead of a fat arrow function `() => {}`, as described in [Mocha docs](https://mochajs.org/#arrow-functions). Using Mocha you can also set a retry count for all specs using `mochaOpts.retries` in your `wdio.conf.js`.

Here is an example:

```js
describe('retries', function () {
    // Retry all tests in this suite up to 4 times
    this.retries(4)

    beforeEach(async () => {
        await browser.url('http://www.yahoo.com')
    })

    it('should succeed on the 3rd try', async function () {
        // Specify this test to only retry up to 2 times
        this.retries(2)
        console.log('run')
        await expect($('.foo')).toBeDisplayed()
    })
})
```

## Rerun single tests in Jasmine or Mocha

To rerun a certain test block you can just apply the number of reruns as last parameter after the test block function:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
    {label: 'Jasmine', value: 'jasmine'},
  ]
}>
<TabItem value="mocha">

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', async function () {
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
    beforeEach(async () => {
        // ...
    }, 1)

    // ...
})
```

</TabItem>
<TabItem value="jasmine">

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', async function () {
        console.log(this.wdioRetries) // returns number of retries
        // ...
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 3)
})
```

The same works for hooks too:

```js
describe('my flaky app', () => {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(async () => {
        // ...
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 1)

    // ...
})
```

If you are using Jasmine, the second parameter is reserved for timeout. To apply a retry parameter you need to set the timeout to its default value `jasmine.DEFAULT_TIMEOUT_INTERVAL` and then apply your retry count.

</TabItem>
</Tabs>

This retry mechanism only allows to retry single hooks or test blocks. If your test is accompanied with a hook to set up your application, this hook is not being run. [Mocha offers](https://mochajs.org/#retry-tests) native test retries that provide this behavior while Jasmine doesn't. You can access the number of executed retries in the `afterTest` hook.

## Rerunning in Cucumber

### Rerun full suites in Cucumber

For cucumber >=6 you can provide the [`retry`](https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#retry-failing-tests) configuration option along with a `retryTagFilter` optional parameter to have all or some of your failing scenarios get additional retries until succeeded. For this feature to work you need to set the `scenarioLevelReporter` to `true`.

### Rerun Step Definitions in Cucumber

To define a rerun rate for a certain step definitions just apply a retry option to it, like:

```js
export default function () {
    /**
     * step definition that runs max 3 times (1 actual run + 2 reruns)
     */
    this.Given(/^some step definition$/, { wrapperOptions: { retry: 2 } }, async () => {
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

```js title="wdio.conf.js"
export const config = {
    // ...
    /**
     * The number of times to retry the entire specfile when it fails as a whole
     */
    specFileRetries: 1,
    /**
     * Delay in seconds between the spec file retry attempts
     */
    specFileRetriesDelay: 0,
    /**
     * Retried specfiles are inserted at the beginning of the queue and retried immediately
     */
    specFileRetriesDeferred: false
}
```

## Run a specific test multiple times

This is to help prevent flaky tests from being introduced in a codebase. By adding the `--multi-run` cli option it will run the specified test(s) or suite(s) x number of times. When using this cli flag the `--spec` or `--suite` flag must also be specified.

When adding new tests to a codebase, especially through a CI/CD process the tests could pass and get merged but become flaky later on. This flakiness could come from a number of things like network issues, server load, database size, etc. Using the `--multi-run` flag in your CD/CD process can help catch these flaky tests before they get merged to a main codebase.

One strategy to use is run your tests like regular in your CI/CD process but if you're introducing a new test you can then run another set of tests with the new spec specified in `--spec` along with `--multi-run` so it runs the new test x number of times. If the test fails any of those times then the test will not get merged and will need to be looked at why it failed.

```sh
# This will run the example.e2e.js spec 5 times
npx wdio run ./wdio.conf.js --spec example.e2e.js --multi-run 5
```
