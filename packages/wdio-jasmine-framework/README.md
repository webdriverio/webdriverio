WDIO Jasmine Framework Adapter
==============================

> A WebdriverIO plugin. Adapter for Jasmine testing framework.

## Installation

The easiest way is to keep `@wdio/jasmine-framework` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/jasmine-framework --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

Following code shows the default wdio test runner configuration...

```js
// wdio.conf.js
module.exports = {
  // ...
  framework: 'jasmine'
  jasmineOpts: {
    defaultTimeoutInterval: 10000
  }
  // ...
};
```

## `jasmineOpts` Options

### defaultTimeoutInterval

<Option type="Number" default="10000">

Timeout until specs will be marked as failed.

</Option>

### expectationResultHandler

<Option type="Function" default="null">

The Jasmine framework allows it to intercept each assertion in order to log the state of the application
or website depending on the result. For example it is pretty handy to take a screenshot every time
an assertion fails.

</Option>

### grep

<Option type="RegExp | string" default="undefined">

Optional pattern to selectively select it/describe cases to run from spec files.

</Option>

### invertGrep

<Option type="Boolean" default="false">

Inverts 'grep' matches.

</Option>

### cleanStack

<Option type="Boolean" default="true">

Clean up stack trace and remove all traces of node module packages.

</Option>

### random

<Option type="Boolean" default="false">

Run specs in semi-random order.

</Option>

### stopOnSpecFailure

<Option type="Boolean" default="false">

Stops test suite (`describe`) execution on first spec (`it`) failure (other suites continue running)

</Option>

### oneFailurePerSpec

<Option type="Boolean" default="false">

Whether to cause specs to only have one expectation failure.

</Option>

### requires

<Option type="String[]" default="[]">

Require modules prior to requiring any helper or spec files.

</Option>

### helpers

<Option type="String[]" default="[]">

Require helper files prior to requiring any spec files.

</Option>
----

For more information on WebdriverIO see the [homepage](https://webdriver.io).


