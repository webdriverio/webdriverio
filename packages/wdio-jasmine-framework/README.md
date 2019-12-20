WDIO Jasmine Framework Adapter
==============================

> A WebdriverIO plugin. Adapter for Jasmine testing framework.

## Installation

The easiest way is to keep `@wdio/jasmine-framework` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/jasmine-framework": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/jasmine-framework --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

Following code shows the default wdio test runner configuration...

```js
// wdio.conf.js
module.exports = {
  // ...
  framework: 'jasmine'
  jasmineNodeOpts: {
    defaultTimeoutInterval: 10000
  }
  // ...
};
```

## `jasmineNodeOpts` Options

### defaultTimeoutInterval
Timeout until specs will be marked as failed.

Type: `Number`<br>
Default: 10000

### expectationResultHandler
The Jasmine framework allows it to intercept each assertion in order to log the state of the application
or website depending on the result. For example it is pretty handy to take a screenshot every time
an assertion fails.

Type: `Function`<br>
Default: null

### grep
Optional pattern to selectively select it/describe cases to run from spec files.

Type: `RegExp | string`<br>
Default: undefined

### invertGrep
Inverts 'grep' matches.

Type: `Boolean`<br>
Default: false

### cleanStack
Clean up stack trace and remove all traces of node module packages.

Type: `Boolean`<br>
Default: true

### random
Run specs in semi-random order.

Type: `Boolean`<br>
Default: `false`

### stopOnSpecFailure
Stops test suite (`describe`) execution on first spec (`it`) failure (other suites continue running)

Type: `Boolean`<br>
Default: `false`

### stopSpecOnExpectationFailure
Stops a spec (`it`) execution on a first expectation failure (other specs continue running)

Type: `Boolean`<br>
Default: `false`

### requires
Require modules prior to requiring any helper or spec files.

Type: `String[]`<br>
Default: `[]`

### helpers
Require helper files prior to requiring any spec files.

Type: `String[]`<br>
Default: `[]`

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
