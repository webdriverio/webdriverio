WDIO Spec Reporter
==================

> A WebdriverIO plugin to report in spec style.

![Spec Reporter](/img/spec.png "Spec Reporter")

## Installation

The easiest way is to keep `@wdio/spec-reporter` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/spec-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted).

## Configuration

The following code shows the default wdio test runner configuration. Just add `'spec'` as a reporter
to the array.

```js
// wdio.conf.js
module.exports = {
  // ...
  reporters: ['dot', 'spec'],
  // ...
};
```

## Spec Reporter Options
### symbols
Provide custom symbols for `passed`, `failed` and or `skipped` tests

Type: `object`
Default: `{passed: '✓', skipped: '-', failed: '✖'}`

#### Example
```js
[
  "spec",
  {
    symbols: {
      passed: '[PASS]',
      failed: '[FAIL]',
    },
  },
]
```

### sauceLabsSharableLinks
By default the test results in Sauce Labs can only be viewed by a team member from the same team, not by a team member
from a different team. This options will enable [sharable links](https://wiki.saucelabs.com/display/DOCS/Building+Sharable+Links+to+Test+Results)
by default, which means that all tests that are executed in Sauce Labs can be viewed by everybody.
Just add `sauceLabsSharableLinks: false`, as shown below, in the reporter options to disable this feature.

Type: `boolean`
Default: `true`

#### Example
```js
[
  "spec",
  {
    sauceLabsSharableLinks: false,
  },
]
```

### onlyFailures
Print only failed specs results.

Type: `boolean`
Default: `false`

#### Example
```js
[
  "spec",
  {
    onlyFailures: true,
  },
]
```

### addConsoleLogs
Set to true to show console logs from steps in final report

Type: `boolean`
Default: `false`

```js
[
  "spec",
  {
    addConsoleLogs: true,
  },
]
```

### realtimeReporting
Set to true to display test status realtime than just at the end of the run

Type: `boolean`
Default: `false`

```js
[
  "spec",
  {
    realtimeReporting: true,
  },
]
```

### showPreface
Set to false to disable `[ MutliRemoteBrowser ... ]` preface in the reports.

Type: `boolean`
Default: `true`

```js
[
  "spec",
  {
    showPreface: false,
  },
]
```

With it set to `false` you will see output as:
```
Running: loremipsum (v50) on Windows 10
Session ID: foobar

» /foo/bar/loo.e2e.js
Foo test
   green ✓ foo
   green ✓ bar

» /bar/foo/loo.e2e.js
Bar test
   green ✓ some test
   red ✖ a failed test
   red ✖ a failed test with no stack
```

and with `true` (default) each line will be prefixed with the preface:
```
[loremipsum 50 Windows 10 #0-0] Running: loremipsum (v50) on Windows 10
[loremipsum 50 Windows 10 #0-0] Session ID: foobar
[loremipsum 50 Windows 10 #0-0]
[loremipsum 50 Windows 10 #0-0] » /foo/bar/loo.e2e.js
[loremipsum 50 Windows 10 #0-0] Foo test
[loremipsum 50 Windows 10 #0-0]    green ✓ foo
[loremipsum 50 Windows 10 #0-0]    green ✓ bar
[loremipsum 50 Windows 10 #0-0]
[loremipsum 50 Windows 10 #0-0] » /bar/foo/loo.e2e.js
[loremipsum 50 Windows 10 #0-0] Bar test
[loremipsum 50 Windows 10 #0-0]    green ✓ some test
[loremipsum 50 Windows 10 #0-0]    red ✖ a failed test
[loremipsum 50 Windows 10 #0-0]    red ✖ a failed test with no stack
[loremipsum 50 Windows 10 #0-0]
```

