name: configuration
category: getstarted
tags: guide
index: 2
title: WebdriverIO - Configuration
---

# Configuration

If you create a WebdriverIO instance you need to define couple of options in order to set the proper
capabilities and settings. When calling the `remote` method like:

```js
var webdriverio = require('webdriverio');
var client = webdriverio.remote(options);
```

you need to pass in an object that should contain the following properties:

### desiredCapabilities
Defines the capabilities you want to run in your Selenium session. See the [Selenium documentation](https://code.google.com/p/selenium/wiki/DesiredCapabilities)
for a list of the available `capabilities`. Also useful is Sauce Labs [Automated Test Configurator](https://docs.saucelabs.com/reference/platforms-configurator/#/)
that helps you to create this object by clicking together your desired capabilities.

Refer to the [cloud service docs](/guide/testrunner/cloudservices.html) for further
service specific options.

Type: `Object`<br>
Default: `{ browserName: 'firefox' }`<br>

**Example:**

```js
browserName: 'chrome',  // options: firefox, chrome, opera, safari
version: '27.0',        // browser version
platform: 'XP',         // OS platform
tags: ['tag1','tag2'],  // specify some tags (e.g. if you use Sauce Labs)
name: 'my test'         // set name for test (e.g. if you use Sauce Labs)
```

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
