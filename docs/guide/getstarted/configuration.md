name: configuration
category: getstarted
tags: guide
index: 1
title: WebdriverIO - Configuration
---

# Configuration

If you create a WebdriverIO instance, you need to define some options in order to set the proper
capabilities and settings. When calling the `remote` method like:

```js
var webdriverio = require('webdriverio');
var client = webdriverio.remote(options);
```

you need to pass in an options object to define your Webdriver instance. Note that this is only necessary if you run WebdriverIO as a standalone package. If you are using the wdio test runner, these options belong in your `wdio.conf.js` configuration file. These are the options you can define:

### desiredCapabilities
Defines the capabilities you want to run in your Selenium session. See the [Selenium documentation](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities)
for a list of the available `capabilities`. Also useful is Sauce Labs [Automated Test Configurator](https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/)
that helps you to create this object by clicking together your desired capabilities.

Refer to the [cloud service docs](/guide/testrunner/cloudservices.html) for further
service specific options.

Type: `Object`<br>
Default: `{ browserName: 'firefox' }`<br>

**Example:**

```js
browserName: 'chrome',    // options: `firefox`, `chrome`, `opera`, `safari`
version: '27.0',          // browser version
platform: 'XP',           // OS platform
tags: ['tag1','tag2'],    // specify some tags (e.g. if you use Sauce Labs)
name: 'my test'           // set name for test (e.g. if you use Sauce Labs)
pageLoadStrategy: 'eager' // strategy for page load
```

**Details:**

`pageLoadStrategy` is implemented in Selenium [2.46.0](https://github.com/SeleniumHQ/selenium/blob/master/java/CHANGELOG#L205), and apparently, it is only working on Firefox. The valid values are:

 `normal` - waits for `document.readyState` to be 'complete'. This value is used by default.
 `eager`  - will abort the wait when `document.readyState` is 'interactive' instead of waiting for 'complete'.
 `none`   - will abort the wait immediately, without waiting for any of the page to load.

### logLevel
Level of logging verbosity.

Type: `String`<br>
Default: *silent*<br>
Options: *verbose* | *silent* | *command* | *data* | *result*

### logOutput
Pipe WebdriverIO logs into a file. You can either define a directory, and WebdriverIO generates a filename for the log file
or you can pass in a writeable stream, and everything gets redirected to that (last one doesn't work yet with the wdio runner).

Type: `String|writeable stream`<br>
Default: *null*

### host
Host of your WebDriver server.

Type: `String`<br>
Default: *127.0.0.1*

### port
Port your WebDriver server is on.

Type: `Number`<br>
Default: *4444*

### path
Path to WebDriver server.

Type: `String`<br>
Default: */wd/hub*

### baseUrl
Shorten `url` command calls by setting a base url. If your `url` parameter starts with `/`, the base url gets prepended.

Type: `String`<br>
Default: *null*

### coloredLogs
Enables colors for log output

Type: `Boolean`<br>
Default: *true*

### screenshotPath
Saves a screenshot to a given path if the Selenium driver crashes

Type: `String`|`null`<br>
Default: *null*

### screenshotOnReject
Attaches a screenshot of a current page to the error if the Selenium driver crashes

Type: `Boolean`<br>
Default: *false*

**Note**: Attaching screenshot to the error uses extra time to get screenshot and extra memory to store it. So for the sake of performance it is disabled by default.

### waitforTimeout
Default timeout for all waitForXXX commands.

Type: `Number`<br>
Default: *500*

### waitforInterval
Default interval for all waitForXXX commands.

Type: `Number`<br>
Default: *250*

## debug
Enables node debugging

Type: `Boolean`<br>
Default: *false*

## execArgv
Node arguments to specify when launching child processes

Type: `Array of String`<br>
Default: *null*

## Setup [Babel](https://babeljs.io/) to write tests using next generation JavaScript

**Note: these instructions are for Babel 6.  Using Babel 5 is not recommended.**

First, install babel dependencies:
```
npm install --save-dev babel-register babel-preset-es2015
```

There are multiple ways to setup Babel using the wdio testrunner. If you are running Cucumber or Jasmine tests, you just need
to register Babel in the before hook of your config file

```js
    before(function() {
        require('babel-register');
    }),
```

If you run Mocha tests, you can use Mocha's internal compiler to register Babel, e.g.:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: ['js:babel-register'],
        require: ['./test/helpers/common.js']
    },
```

### `.babelrc` settings

Using `babel-polyfill` is not recommended with `webdriverio`; if you need such features, use [`babel-runtime`](https://babeljs.io/docs/plugins/transform-runtime/) instead by running
```
npm install --save-dev babel-plugin-transform-runtime babel-runtime
```
and including the following in your `.babelrc`:
```json
{
  "presets": ["es2015"],
  "plugins": [
    ["transform-runtime", {
      "polyfill": false
    }]
  ]
}
```

Instead of `babel-preset-es2015`, you may use `babel-preset-es2015-nodeX`, where `X` is your Node major version, to avoid unnecessary polyfills like generators:
```
npm install --save-dev babel-preset-es2015-node6
```
```json
{
  "presets": ["es2015-node6"],
  "plugins": [
    ["transform-runtime", {
      "polyfill": false,
      "regenerator": false
    }]
  ]
}
```

## Setup [TypeScript](http://www.typescriptlang.org/)

Similar to Babel setup, you can register TypeScript to compile your .ts files in your before hook of your config file.
You will need [ts-node](https://github.com/TypeStrong/ts-node) as an installed devDependency.

```js
    before(function() {
        require('ts-node/register');
    }),
```

Similarly for mocha:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: ['ts:ts-node/register'],
        requires: ['./test/helpers/common.js']
    },
```
