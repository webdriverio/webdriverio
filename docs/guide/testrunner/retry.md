name: Retry Flaky Tests
category: testrunner
tags: guide
index: 9
title: WebdriverIO - Retry Flaky Tests
---

Retry Flaky Tests
=================

You can rerun certain tests with the WebdriverIO testrunner that turn out to be unstable due to e.g. flaky network or race conditions. However it is not recommended to just increase the rerun rate if tests become unstable.

## Rerun Tests in Jasmine or Mocha

To rerun a certain test block just apply the number of reruns as last parameter after the test block function:

```js
describe('my flaky app', function () {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', function () {
        // ...
    }, 3);
});
```

The same works for hooks too:

```js
describe('my flaky app', function () {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(function () {
        // ...
    }, 1)

    // ...
});
```

It is __not__ possible to rerun whole suites, only hooks or test blocks. To use this you have to have the [wdio-mocha-framework](https://github.com/webdriverio/wdio-mocha-framework) adapter installed with `v0.3.0` or greater or the [wdio-jasmine-framework](https://github.com/webdriverio/wdio-jasmine-framework) adapter with `v0.2.0` or greater.

## Rerun Step Definitions in Cucumber

To define a rerun rate for a certain step definitions just apply a retry option to it, like:

```js
module.exports = function () {
    /**
     * step definition that runs max 3 times (1 actual run + 2 reruns)
     */
    this.Given(/^some step definition$/, { retry: 2 }, () => {
        // ...
    })
    // ...
```

Reruns can only be defined in your step definitions file and not in your feature file. To use this you have to have the [wdio-cucumber-framework](https://github.com/webdriverio/wdio-cucumber-framework) adapter installed with `v0.1.0` or greater.
