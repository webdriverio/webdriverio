name: tap
category: reporters
tags: guide
index: 7
title: WebdriverIO - TAP Reporter
---

WDIO TAP reporter
=================

WebdriverIO TAP reporter which makes it possible to output tests results 
in [TAP 13 format](https://testanything.org/tap-version-13-specification.html)
thus the output is compatible with 
[any TAP reporter](https://github.com/sindresorhus/awesome-tap#reporters). 

## Installation

```bash
npm install wdio-tap-reporter --save-dev
```

Instructions on how to install WebdriverIO can be found [here](http://webdriver.io/guide/getstarted/install.html).

## Configuration

Add the reporter to your reporter list in your [wdio.conf.js](http://webdriver.io/guide/testrunner/configurationfile.html) file:

```js
exports.config = {
  // ...
  reporters: ['tap'],
  // ...
}
```

## Links

- Reference to the TAP Reporter full description [https://github.com/LKay/wdio-tap-reporter](https://github.com/LKay/wdio-tap-reporter)
