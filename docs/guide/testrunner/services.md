name: Custom Service
category: testrunner
tags: guide
index: 11
title: WebdriverIO - Custom Service
---

Custom Service
===============

You can write your own custom service for the wdio test runner that fits your needs. Services enable addons to be created for reusable logic to simplify tests, manage your test suite and integrate results. Services have access to all the same [before/after hooks](http://webdriver.io/guide/testrunner/configurationfile.html) available in the `wdio.conf.js`.  The basic construction of service should look like this:

```js
class CustomService {

  onPrepare (config, capabilities) {
    // TODO: something before the workers launch
  }

  onComplete (exitCode, config, capabilities) {
    // TODO: something after the workers shutdown
  },
}

export default CustomService;
```

The only thing to do now in order to use this service is to assign it to the services property. Therefor
your `wdio.conf.js` file should look like this:

```js
var CustomService = require('./service/my.custom.service');

exports.config = {
    // ...
    services: [new CustomService()],
    // ...
};
```

### NPM
To make services easier to consume and discover by the webdriver.io community, please follow these recommendations:

* services should use naming convention is `wdio-*-service`
* use NPM keywords `wdio-plugin`, `wdio-service`
* main entry should export an instance of the service.
* example services: [wdio-sauce-service](https://github.com/webdriverio/wdio-sauce-service)

Following the recommended naming pattern allows services to be added by name:
```js
// Add wdio-custom-service
exports.config = {
    // ...
    services: ['custom'],
    // ...
};
```


We really appreciate every new plugin that gets developed and may help other people to run better tests. If you have created such a plugin make sure to create a pull request to our [configuration utility](https://github.com/webdriverio/webdriverio/blob/master/lib/cli.js#L13-L33) so your package will be suggested if someone runs the wdio configurator.
