name: grunt-webdriver
category: plugins
tags: guide
title: WebdriverIO - grunt-webdriver
---

# grunt-webdriver [![Build Status](https://travis-ci.org/webdriverio/grunt-webdriver.png)](https://travis-ci.org/webdriverio/grunt-webdriver)

> grunt-webdriver is a grunt plugin to run selenium tests with Mocha and [WebdriverIO](http://webdriver.io)

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out
the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains
how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins. Once you're familiar with that process, you may
install this plugin with this command:

```shell
npm install grunt-webdriver --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile
with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-webdriver');
```

## The "webdriver" task

### Overview
In your project's Gruntfile, add a section named `webdriver` to the data
object passed into `grunt.initConfig()`.

_Run this task with the `grunt webdriver` command._

```js
grunt.initConfig({
  webdriver: {
    options: {
        desiredCapabilities: {
            browserName: 'chrome'
        }
    },
    login: {
        tests: ['test/spec/login/*.js'],
        options: {
            // overwrite default settings
            desiredCapabilities: {
                browserName: 'firefox'
            }
        }
    },
    form: {
        tests: ['test/spec/form/*.js']
    }
    // ...
  },
})
```

#### Example using [Sauce Labs](https://saucelabs.com)

To use a cloud service like [Sauce Labs](https://saucelabs.com) make sure you define `host` and `port` properties like in the example below as well as authenticate yourself with your username and key.

```js
grunt.initConfig({
  webdriver: {
    options: {
        host: 'ondemand.saucelabs.com',
        port: 80,
        user: SAUCE_USERNAME,
        key: SAUCE_ACCESS_KEY,
        desiredCapabilities: {
            browserName: 'chrome',
            version: '27',
            platform: 'XP'
        }
    },
    login: {
        tests: ['test/spec/login/*.js']
    },
    form: {
        tests: ['test/spec/form/*.js']
    }
    // ...
  },
})
```

#### Example using [Sauce Connect](https://saucelabs.com/docs/connect)

If you specify a `tunnel-identifier` within your `desiredCapabilities` object, the task
will automatically try to establish a tunnel connection via [Sauce Connect](https://saucelabs.com/docs/connect). With the `tunnel-flags` property you can pass [command line options](https://docs.saucelabs.com/reference/sauce-connect/#command-line-options) to the created Sauce Tunnel.

```js
grunt.initConfig({
  webdriver: {
    options: {
        user: SAUCE_USERNAME,
        key: SAUCE_ACCESS_KEY,
        desiredCapabilities: {
            browserName: 'chrome',
            version: '27',
            platform: 'XP',
            'tunnel-identifier': 'my-test-tunnel',
            'tunnel-flags': [ '-vv', '-l sauce_connect_tech_support.log' ]
        }
    },
    login: {
        tests: ['test/spec/login/*.js']
    },
    form: {
        tests: ['test/spec/form/*.js']
    }
    // ...
  },
})
```

### Options

All options get passed into the WebdriverIO `remote` function. So this is the place where
you can define your driver instance. You'll find more informations about all WebdriverIO
options [here](https://github.com/webdriverio/webdriverio#options). You can overwrite these
options in any target. Also you have to define all Mocha options here. The following
are supported:

#### bail
Type: `Boolean`<br>
Default: *false*<br>

If true you are only interested in the first execption

#### ui
Type: `String`<br>
Default: *bdd*<br>
Options: *bdd* | *tdd* | *qunit* | *exports*

Specify the interface to use.

#### reporter
Type: `String`<br>
Default: *spec*<br>
Options: *Base* | *Dot* | *Doc* | *TAP* | *JSON* | *HTML* | *List* | *Min* | *Spec* | *Nyan* | *XUnit* | *Markdown* | *Progress* | *Landing* | *JSONCov* | *HTMLCov* | *JSONStream*

Allows you to specify the reporter that will be used.

#### slow
Type: `Number`<br>
Default: *75*

Specify the "slow" test threshold, defaulting to 75ms. Mocha uses this to highlight test-cases that are taking too long.

#### timeout
Type: `Number`<br>
Default: *1000000*

Specifies the test-case timeout.

#### grep
Type: `String`

When specified will trigger mocha to only run tests matching the given pattern which is internally compiled to a `RegExp`.

#### updateSauceJob
Type: `Boolean`<br>
Default: *false*

If true it will automatically update the current job and does publish it.

#### output
Type: `String`
Default: *null*

If set grunt-webdriver will pipe reporter output into given file path

#### quiet
Type: `Boolean`
Default: *false*

If true it prevents the original process.stdout.write from executing - no output at all

#### nospawn
Type: `Boolean`<br>
Default: *false*

If true it will not spawn a new selenium server process (useful if you use Sauce Labs without Sauce Tunnel)

#### seleniumOptions
Type: `Object`<br>
Default: `{}`

Options for starting the Selenium server. For more information check out the [selenium-standalone](https://github.com/vvo/selenium-standalone#seleniumstartopts-cb) project.

#### seleniumInstallOptions
Type: `Object`<br>
Default: `{}`

Options for installing Selenium dependencies. For more information check out the [selenium-standalone](https://github.com/vvo/selenium-standalone#seleniuminstallopts-cb) project.

### Usage Examples

#### Required Options
In this example, the minimum required options are used to execute a simple
test script.

```js
grunt.initConfig({
  webdriver: {
    githubTest: {
      tests: './test/github-test.js'
    }
  },
})
```

The corresponding *Hello World* test script is using WebdriverIO API to search the
grunt-webdriver repository on GitHub. The global `browser` variable lets you access
your client instance. See more functions and test examples in the [WebdriverIO](https://github.com/webdriverio/webdriverio) repository.

```js
'use strict';

var assert = require('assert');

describe('grunt-webdriver test', function () {

    it('checks if title contains the search query', function(done) {

        browser
            .url('http://github.com')
            .setValue('#js-command-bar-field','grunt-webdriver')
            .submitForm('.command-bar-form')
            .getTitle(function(err,title) {
                assert(title.indexOf('grunt-webdriver') !== -1);
            })
            .call(done);

    });

});
```

#### Using CoffeeScript

If you like to write your tests in CoffeeScript just add the following on the top of your Gruntfile
and you are set.

```js
require('coffee-script/register');

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        // ...
    });
}
```
