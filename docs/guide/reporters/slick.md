name: slick
category: reporters
tags: guide
index: 9
title: WebdriverIO - Slick Reporter
---

WDIO Slick Reporter
=========================

> A slick WebdriverIO reporter intended for local development.


## Installation

```shell
npm install --save-dev wdio-slick-reporter
```

Instructions on how to install WebdriverIO can be found [here](http://webdriver.io/guide/getstarted/install.html).

## Configuration

Add the reporter to your reporter list and set `logLevel` to `silent` in your [wdio.conf.js](http://webdriver.io/guide/testrunner/configurationfile.html) file:

```js
exports.config = {
  // ...
  reporters: ['slick'],
  logLevel: 'silent',
  // ...
}
```

## Links

- Read more at [GitHub](https://github.com/codeclown/wdio-slick-reporter)
