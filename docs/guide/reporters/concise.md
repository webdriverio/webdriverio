name: concise
category: reporters
tags: guide
index: 6
title: WebdriverIO - Concise Reporter
---


WDIO Concise Reporter
=====================

A concise reporter for WebdriverIO. This project is derived from [WDIO-Json-Reporter](https://github.com/fijijavis/wdio-json-reporter).

![WDIO Concise Reporter error](https://github.com/FloValence/wdio-concise-reporter/blob/master/example_error.png?raw=true)
![WDIO Concise Reporter success](https://github.com/FloValence/wdio-concise-reporter/blob/master/example_success.png?raw=true)

## Installation

The easiest way is to keep `wdio-concise-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-concise-reporter": "~0.0.1"
  }
}
```

You can simply do it by:

```bash
npm install wdio-concise-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](http://webdriver.io/guide/getstarted/install.html).

## Configuration

Following code shows the default wdio test runner configuration. Just add `'concise'` as reporter
to the array.

```js
// wdio.conf.js
module.exports = {
  // ...
  reporters: ['concise'],
  // ...
};
```
