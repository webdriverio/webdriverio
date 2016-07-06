name: json
category: reporters
tags: guide
index: 5
title: WebdriverIO - JSON Reporter
---

WDIO JSON Reporter
===================

> A WebdriverIO plugin. Report results in json format.

This project was derived from the 'wdio-junit-reporter' found [here](https://github.com/webdriverio/wdio-junit-reporter)


## Installation

The easiest way is to keep `wdio-json-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-json-reporter": "~0.0.1"
  }
}
```

You can simply do it by:

```bash
npm install wdio-json-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](http://webdriver.io/guide/getstarted/install.html).

## Configuration

Following code shows the default wdio test runner configuration. Just add `'json'` as reporter
to the array. To get some output during the test you can run the [WDIO Dot Reporter](https://github.com/webdriverio/wdio-dot-reporter) and the WDIO JSON Reporter at the same time:

```js
// wdio.conf.js
module.exports = {
  // ...
  reporters: ['dot', 'json'],
  reporterOptions: {
    outputDir: './'
  },
  // ...
};
```

## Sample Output
```
{
  "start": "2016-05-04T13:05:59.006Z",
  "end": "2016-05-04T13:06:15.539Z",
  "capabilities": {
    "platform": "VISTA",
    "browserName": "chrome"
  },
  "host": "127.0.0.1",
  "port": 4444,
  "baseUrl": "http://www.some-application.com",
  "framework": "mocha",
  "mochaOpts": {
    "timeout": 10000,
    "ui": "tdd",
    "grep": "@Smoke"
  },
  "suites": [
    {
      "name": "sample test suite number 1",
      "duration": 12572,
      "start": "2016-05-04T13:06:01.701Z",
      "end": "2016-05-04T13:06:14.273Z",
      "tests": [
        {
          "name": "@Smoke-Sample test number 1",
          "start": "2016-05-04T13:06:01.701Z",
          "end": "2016-05-04T13:06:08.162Z",
          "duration": 6461,
          "state": "pass"
        },
        {
          "name": "@Smoke-Sample test number 2",
          "start": "2016-05-04T13:06:08.471Z",
          "end": "2016-05-04T13:06:13.845Z",
          "duration": 5374,
          "state": "fail",
          "error": "element (#not-a-real-element) still not visible after 5000ms",
          "errorType": "CommandError",
          "standardError": "CommandError: element (#not-a-real-element) still not visible after 5000ms\n    at Object.Future.wait (/node_modules/fibers/future.js:449:15)\n    at Object.waitForVisible (/node_modules/wdio-sync/build/index.js:345:27)\n    at Object.create.searchForStores.value (/PageObjects/some.page.js:15:17)\n    at Context.<anonymous> (/Tests/sample.spec.js:64:25)\n    at /node_modules/wdio-sync/build/index.js:579:24\n    - - - - -\n    at elements(\"#not-a-real-element\") - isVisible.js:49:17\n    at isVisible(\"#not-a-real-element\") - waitForVisible.js:40:22"
        }
      ]
    },
    {
      "name": "sample test suite number 2",
      "duration": 25987,
      "start": "2016-05-04T13:16:01.701Z",
      "end": "2016-05-04T13:16:24.273Z",
      "tests": [
        {
          "name": "@Smoke-Sample test number 3",
          "start": "2016-05-04T13:06:11.701Z",
          "end": "2016-05-04T13:06:18.162Z",
          "duration": 6461,
          "state": "pass"
        },
        {
          "name": "@Smoke-Sample test number 4",
          "start": "2016-05-04T13:06:18.471Z",
          "end": "2016-05-04T13:06:23.845Z",
          "duration": 5374,
          "state": "fail",
          "error": "element (#not-a-real-element) still not visible after 5000ms",
          "errorType": "CommandError",          
          "standardError": "CommandError: element (#not-a-real-element) still not visible after 5000ms\n    at Object.Future.wait (/node_modules/fibers/future.js:449:15)\n    at Object.waitForVisible (/node_modules/wdio-sync/build/index.js:345:27)\n    at Object.create.searchForStores.value (/PageObjects/some.page.js:15:17)\n    at Context.<anonymous> (/Tests/sample.spec.js:64:25)\n    at /node_modules/wdio-sync/build/index.js:579:24\n    - - - - -\n    at elements(\"#not-a-real-element\") - isVisible.js:49:17\n    at isVisible(\"#not-a-real-element\") - waitForVisible.js:40:22"
        }
      ]
    }  
  ]
}
```
