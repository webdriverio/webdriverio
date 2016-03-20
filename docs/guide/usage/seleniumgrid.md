name: seleniumgrid
category: usage
tags: guide
index: 7
title: WebdriverIO - Selenium Grid
---

Selenium Grid
=====================

As well as JSONWire protocol bindings, Webdriverio also offers a few utility commands for working with the Selenium Grid. It's often useful to know the details of the Grid node which is actually running the current session. Use `getGridNodeDetails()` to get a JSON object with details like ID, hostname and port, configured timeouts, plus any command-line params used to start the node.

```js
client.getGridNodeDetails().then(function(details) {
     console.log(details);
     /**
      * returns:
      *
      * { request:
      *    { configuration:
      *       { port: 5557,
      *         nodeConfig: '/path/to/config.json',
      *         servlets: [],
      *         host: '192.168.2.1',
      *         cleanUpCycle: 2000,
      *         browserTimeout: 120000,
      *         hubHost: 'example.com',
      *         registerCycle: 10000,
      *         capabilityMatcher: 'org.openqa.grid.internal.utils.DefaultCapabilityMatcher',
      *         newSessionWaitTimeout: -1,
      *         url: 'http://example.com:5557',
      *         remoteHost: 'http://example.com:5557',
      *         register: true,
      *         id: 'MacMiniA10',
      *         throwOnCapabilityNotPresent: true,
      *         nodePolling: 2000,
      *         proxy: 'org.openqa.grid.selenium.proxy.DefaultRemoteProxy',
      *         maxSession: 4,
      *         role: 'node',
      *         jettyMaxThreads: -1,
      *         nodeTimeout: 120,
      *         hubPort: 80,
      *         timeout: 90000 },
      *      capabilities:
      *       [ { seleniumProtocol: 'WebDriver',
      *           platform: 'MAC',
      *           firefoxVersion: '42',
      *           browserName: 'firefox',
      *           maxInstances: 2,
      *           version: 'latest' },
      *         { seleniumProtocol: 'WebDriver',
      *           platform: 'MAC',
      *           browserName: 'chrome',
      *           maxInstances: 8,
      *           chromeVersion: '46',
      *           version: 'latest' },
      *         { seleniumProtocol: 'WebDriver',
      *           platform: 'MAC',
      *           browserName: 'safari',
      *           maxInstances: 1,
      *           version: 'latest' } ] },
      *   session: '33c2d04d-6bc1-424e-ba6f-63c400114554',
      *   internalKey: 'd710b167-6f29-4097-a15c-7f7bbdb73edb',
      *   inactivityTime: 78,
      *   proxyId: 'MacMiniA10' }
      *
      */
});
```
