WDIO Spec Reporter
==================

> A WebdriverIO plugin to report in spec style.

![Spec Reporter](/img/spec.png "Spec Reporter")

## Installation

The easiest way is to keep `@wdio/spec-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/spec-reporter": "^5.0.0"
  }
}
```

You can simple do it by:

```sh
$ npm install @wdio/spec-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](http://webdriver.io/guide/getstarted/install.html).

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
