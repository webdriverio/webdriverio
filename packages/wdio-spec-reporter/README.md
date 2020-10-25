WDIO Spec Reporter
==================

> A WebdriverIO plugin to report in spec style.

![Spec Reporter](/img/spec.png "Spec Reporter")

## Installation

The easiest way is to keep `@wdio/spec-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/spec-reporter": "^6.3.6"
  }
}
```

You can simple do it by:

```sh
$ npm install @wdio/spec-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted.html).

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

### Custom report symbols
```js
[
  "spec",
  {
    symbols: { passed: '[PASS]', failed: '[FAIL]' },
    // skipped set to default '-'
  }
]
```