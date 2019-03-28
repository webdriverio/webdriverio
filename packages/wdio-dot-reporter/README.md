WebdriverIO Dot Reporter
========================

> A WebdriverIO plugin to report in dot style.

![Dot Reporter](/img/dot.png "Dot Reporter")

## Installation

The easiest way is to keep `@wdio/dot-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/dot-reporter": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/dot-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](/docs/gettingstarted.html).

Dot reporter does not currently support test failure output.  You can track progress on this feature [here](https://github.com/webdriverio/webdriverio/pull/3589).  [Spec Reporter](/docs/spec-reporter.html) can be used in the meantime.

## Configuration

Following code shows the default wdio test runner configuration. Just add `'dot'` as reporter
to the array.

```js
// wdio.conf.js
module.exports = {
  // ...
  reporters: ['dot'],
  // ...
};
```

## Development

All commands can be found in the package.json. The most important are:

Watch changes:

```sh
$ npm run watch
```

Run tests:

```sh
$ npm test

# run test with coverage report:
$ npm run test:cover
```

Build package:

```sh
$ npm build
```

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
