---
id: options
title: Options
---

WebdriverIO is not only a WebDriver protocol binding like Selenium. It is a full test framework that comes with a lot of additional features and utilities. It is based on the [webdriver](https://www.npmjs.com/package/webdriver) package which is a lightweight, non-opinionated implementation of the WebDriver specification including mobile commands supported by Appium. WebdriverIO takes the protocol commands and creates smart user commands that make it easier to use the protocol for test automation.

WebdriverIO enhances the WebDriver package with additional commands. They share the same set of options when run in a standalone script. When running tests using `@wdio/cli` (wdio testrunner) some additional options are available that belong into the `wdio.conf.js`.

## WebDriver Options

The following options are defined:

### protocol
Protocol to use when communicating with the driver server.

Type: `String`<br>
Default: `http`

### hostname
Host of your driver server.

Type: `String`<br>
Default: `0.0.0.0`

### port
Port your driver server is on.

Type: `Number`<br>
Default: `4444`

### path
Path to driver server endpoint.

Type: `String`<br>
Default: `/wd/hub`

### queryParams
Query paramaters that are propagated to the driver server.

Type: `Object`<br>
Default: `null`

### capabilities
Defines the capabilities you want to run in your WebDriver session. Check out the [WebDriver Protocol](https://w3c.github.io/webdriver/#capabilities) for more details. If you run an older driver that doesn't support WebDriver you need to apply the [JSONWireProtocol capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) to successfuly run a session. Also a useful utility is the Sauce Labs [Automated Test Configurator](https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/) that helps you to create this object by clicking together your desired capabilities.

Type: `Object`<br>
Default: `null`

**Example:**

```js
{
    browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
    browserVersion: '27.0', // browser version
    platformName: 'Windows 10' // OS platform
}
```

To run web or native tests on mobile devices capabilities differ from the WebDriver protocol. Have a look into the [Appium Docs](http://appium.io/docs/en/writing-running-appium/caps/) for more details.

### logLevel
Level of logging verbosity.

Type: `String`<br>
Default: `info`<br>
Options: `trace` | `debug` | `info` | `warn` | `error` | `silent`

### logOutput
Pipe WebdriverIO logs into a file. You can either define a directory, and WebdriverIO generates a filename for the log file or you can pass in a writeable stream, and everything gets redirected to that.

Type: `String|writeable stream`<br>
Default: `null`

### connectionRetryTimeout
Timeout for any request to the Selenium server

Type: `Number`<br>
Default: `90000`

### connectionRetryCount
Count of request retries to the Selenium server

Type: `Number`<br>
Default: `3`

---

## WDIO Options

The following options are defined for running WebdriverIO with the `@wdio/cli` testrunner:

### specs
Define specs for test execution.

Type: `String[]`<br>
Default: `[]`

### exclude
Exclude specs from test execution.

Type: `String[]`<br>
Default: `[]`

### suites
An object describing various of suites that can be specified when applying the `--suite` option to the `wdio` cli command.

Type: `Object`<br>
Default: `{}`

### capabilities
Like the capabilities section described above, except with the option to specifiy either a [multiremote](Multiremote.md) object, or multiple WebDriver sessions in an array for parallel execution.

Type: `Object`|`Object[]`<br>
Default: `[{ maxInstances: 5, browserName: 'firefox' }]`

### outputDir
Directory to store all testrunner log files including reporter logs and `wdio` logs. If not set all logs are streamed to stdout. Since most reporters are made to log to stdout it is recommended to only use this option for specific reporters where it makes more sense to push report into a file (e.g. junit reporter).

Type: `String`<br>
Default: `null`

### baseUrl
Shorten `url` command calls by setting a base url. If your `url` parameter starts with `/`, the base url gets prepended, not including the path portion of your baseUrl. If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url gets prepended directly.

Type: `String`<br>
Default: `null`

### bail
If you only want to run your tests until a specific amount of tests have failed use bail (default is 0 - don't bail, run all tests). _Note_: Please be aware that when using a third party test runner such as Mocha, additional configuration might be required.

Type: `Number`<br>
Default: `0` (don't bail, run all tests)

### waitforTimeout
Default timeout for all waitForXXX commands. Note the lowercase `f`. This timeout __only__ affects commands starting with waitForXXX and their default wait time. To increase the timeout of the test please see the framework docs.

Type: `Number`<br>
Default: `3000`

### waitforInterval
Default interval for all waitForXXX commands to check if an expected state (e.g. visibility) has been changed.

Type: `Number`<br>
Default: `500`

### services
Services take over a specific job you don't want to take care of. They enhance your test setup with almost no effort. Unlike plugins, they don't add new commands. Instead, they hook themselves up into the test process.

Type: `String[]|Object[]`<br>
Default: `[]`

### framework
Defines the test framework to be used by the wdio testrunner.

Type: `String`<br>
Default: `mocha`<br>
Options: `mocha` | `jasmine`

### mochaOpts | jasmineNodeOpts

Specific framework related options. See the framework adapter documentation on which options are available.

Type: `Object`<br>
Default: `{ timeout: 10000 }`

### reporters
List of reporters to use. A reporter can be either a string or an array where the first element is a string with the reporter name and the second element an object with reporter options.

Type: `String[]|Object[]`<br>
Default: `[]`

Example:
```js
reporters: [
    'dot',
    'spec'
    ['junit', {
        outputDir: __dirname + '/reports',
        otherOption: 'foobar'
    }]
]
```

### execArgv
Node arguments to specify when launching child processes

Type: `String[]`
Default: `null`

## Hooks

WebdriverIO allows you to set hooks to interfere into the test lifecycle in order to e.g. take screenshot if a test fails. Every hook has as parameter specific information about the lifecycle (e.g. information about the test suite or test). The following hooks are available: `onPrepare`, `beforeSession`, `before`, `beforeSuite`, `beforeHook`, `afterHook`, `beforeTest`, `beforeCommand`, `afterCommand`, `afterTest`, `afterSuite`, `after`, `afterSession`, `onComplete`, `onReload`, `beforeFeature`, `beforeScenario`, `beforeStep`, `afterStep`, `afterScenario`, `afterFeature`.

Type: `Function`<br>
Default: `null`

Example:
```js
// wdio.conf.js
exports.config = {
    // ...
    afterTest: (test) => {
        console.log(`Finished test "${test.parent} - ${test.title}"`);
    }
    // ...
```
