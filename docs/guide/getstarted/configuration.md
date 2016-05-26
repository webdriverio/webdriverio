name: configuration
category: getstarted
tags: guide
index: 1
title: WebdriverIO - Configuration
---

# Configuration

If you create a WebdriverIO instance you need to define couple of options in order to set the proper
capabilities and settings. When calling the `remote` method like:

```js
var webdriverio = require('webdriverio');
var client = webdriverio.remote(options);
```

you need to pass in an options object to define your Webdriver instance. Note that this is only necessary if your run WebdriverIO as standalone package. If you are using the wdio test runner these options belong to your `wdio.conf.js` configuration file. These are the options you can define:

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

`pageLoadStrategy` is implemented in Selenium [2.46.0](https://github.com/SeleniumHQ/selenium/blob/master/java/CHANGELOG#L205) and apparently it is only working on Firefox. The valid values are:

 `normal` - waits for `document.readyState` to be 'complete'. This value is used by default.
 `eager`  - will abort the wait when `document.readyState` is 'interactive' instead of waiting for 'complete'.
 `none`   - will abort the wait immediately, without waiting for any of the page to load.

### logLevel
Level of logging verbosity.

Type: `String`<br>
Default: *silent*<br>
Options: *verbose* | *silent* | *command* | *data* | *result*

### logOutput
Pipe WebdriverIO logs into a file. You can define either a directory and WebdriverIO generates a filename for the log file
or you can pass in writeable stream and everything gets redirected to that (last one doesn't work yet with the wdio runner).

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
Shorten `url` command calls by setting a base url. If your `url` parameter starts with `/` the base url gets prepended.

Type: `String`<br>
Default: *null*

### coloredLogs
Enables colors for log output

Type: `Boolean`<br>
Default: *true*

### screenshotPath
Saves a screenshot to a given path if Selenium driver crashes

Type: `String`|`null`<br>
Default: *null*

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

There are multiple ways to setup Babel using the wdio testrunner. If you are running Cucumber or Jasmine test you just need
to register Babel in the before hook of your config file

```js
    before(function() {
        require('babel/register')({
            blacklist: [
                'regenerator'
            ]
        });
    }),
```

Make sure to allow generator calls to directly go through since Node >v0.10 has sufficient generator support.

If you run Mocha test you can use Mochas internal compiler to register Babel, e.g.:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: ['js:babel-core/register'],
        require: ['./test/helpers/common.js']
    },
```

For generator support, add a file called `.babelrc` to your project root directory with the following content:

```
{
    "blacklist": ["regenerator"]
}
```

## Setup [TypeScript](http://www.typescriptlang.org/)

Similar to Babel setup, you can register TypeScript to compile your .ts files in your before hook of your config file.
You will need [ts-node](https://github.com/TypeStrong/ts-node) as devDependency installed.

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
        require: ['./test/helpers/common.js']
    },
```
