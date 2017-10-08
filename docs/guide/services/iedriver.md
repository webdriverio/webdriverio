name: iedriver
category: services
tags: guide
index: 12
title: WebdriverIO - IEDriver Service
---

WDIO IEDriver Service
================================

(Based entirely on [wdio-selenium-standalone-service](https://github.com/webdriverio/wdio-selenium-standalone-service).)

----

This service helps you to run IEDriver seamlessly when running tests with the [WDIO testrunner](http://webdriver.io/guide/testrunner/gettingstarted.html). It uses the [IEdriver](https://www.npmjs.com/package/iedriver) NPM package that wraps the IEDriver for you.

Note - this service does not require a Selenium server, but uses IEDriver to communicate with the browser directly.
Obviously, it only supports:

```js
capabilities: [{
        browserName: 'internet explorer'
    }]
```

## Installation

The easiest way is to keep `wdio-iedriver-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-iedriver-service": "~0.1"
  }
}
```

You can simple do it by:

```bash
npm install wdio-iedriver-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)

## Configuration

By design, only Internet Explorer is available (when installed on the host system). Make sure to read up on [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver) regarding required configuration. `Protected Mode`-setting can be tweaked by using `ignoreProtectedModeSettings: true` in capabilities.


In order to use the service you need to add `iedriver` to your service array:

```js
// wdio.conf.js
export.config = {
  port: '5555',
  path: '/',
  // ...
  services: ['iedriver'],
  // ...
};
```

## Options

### ieDriverLogs
Path where all logs from the IEDriver server should be stored.

Type: `String`

### killInstances
Whether to force all instances of Internet Explorer to be closed after the test. Please note that this option will kill all instances, not only those spawned by IEDriverServer!

Type: `Boolean`
Default: `false`

----

For more information on WebdriverIO see the [homepage](http://webdriver.io).
