name: The Browser Object
category: testrunner
tags: guide
index: 3
title: WebdriverIO - The Browser Object
---

The Browser Object
==================

If you use the wdio test runner you can access the webdriver instance through the global `browser` object. The session is initialized by the test runner so you don't need to call [`init`](/api/protocol/init.html) command. The same goes for ending the session. This is also done by the test runner process.

Besides all commands from the [api](/api.html) the browser object provides some more information you might be interested in during your test run:

### Get desired capabilities

```js
console.log(browser.desiredCapabilities);
/**
 * outputs:
 * {
       javascriptEnabled: true,
       locationContextEnabled: true,
       handlesAlerts: true,
       rotatable: true,
       browserName: 'chrome',
       loggingPrefs: { browser: 'ALL', driver: 'ALL' }
   }
 */
```

### Get wdio config options

```js
// wdio.conf.js
exports.config = {
    // ...
    foobar: true,
    // ...
}
```

```js
console.log(browser.options);
/**
 * outputs:
 * {
        port: 4444,
        protocol: 'http',
        waitforTimeout: 10000,
        waitforInterval: 250,
        coloredLogs: true,
        logLevel: 'verbose',
        baseUrl: 'http://localhost',
        connectionRetryTimeout: 90000,
        connectionRetryCount: 3,
        sync: true,
        specs: [ 'err.js' ],
        foobar: true, // <-- custom option
        // ...
 */
```

### Check if capability is a mobile device

```js
var client = require('webdriverio').remote({
    desiredCapabilities: {
    	platformName: 'iOS',
        app: 'net.company.SafariLauncher',
        udid: '123123123123abc',
        deviceName: 'iPhone',
    }
});

console.log(client.isMobile); // outputs: true
console.log(client.isIOS); // outputs: true
console.log(client.isAndroid); // outputs: false
```

### Log results

```js
browser.logger.info('some random logging');
```

For more information about the logger class check out [Logger.js](https://github.com/webdriverio/webdriverio/blob/master/lib/utils/Logger.js) on GitHub.
