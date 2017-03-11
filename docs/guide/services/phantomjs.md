name: phantomjs
category: services
tags: guide
index: 6
title: WebdriverIO - PhantomJS Service
---

PhantomJS Service
===========================

[This service](https://github.com/cognitom/wdio-phantomjs-service) helps you to run PhantomJS seamlessly when running tests with the [WDIO testrunner](http://webdriver.io/guide/testrunner/gettingstarted.html). It uses [phantomjs-prebuilt](https://www.npmjs.com/package/phantomjs-prebuilt) NPM package.

## Installation

From npm:

```bash
npm install --save-dev wdio-phantomjs-service
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)

## Configuration

In order to use the service you need to add `phantomjs` to your service array:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['phantomjs'],
  // ...
};
```

## Examples

See full examples [here](https://github.com/cognitom/webdriverio-examples/tree/master/wdio-wo-local-selenium).
