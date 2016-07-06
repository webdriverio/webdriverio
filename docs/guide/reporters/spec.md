name: spec
category: reporters
tags: guide
index: 1
title: WebdriverIO - Spec Reporter
---

Spec Reporter
============

> A WebdriverIO plugin to report in spec style.

![Spec Reporter](http://webdriver.io/images/spec.png "Spec Reporter")

## Installation

The easiest way is to keep `wdio-spec-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-spec-reporter": "~0.0.1"
  }
}
```

You can simple do it by:

```bash
npm install wdio-spec-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](http://webdriver.io/guide/getstarted/install.html).

## Configuration

Following code shows the default wdio test runner configuration. Just add `'spec'` as reporter
to the array.

```js
// wdio.conf.js
module.exports = {
  // ...
  reporters: ['spec'],
  // ...
};
```
