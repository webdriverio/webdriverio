name: Grunt
category: plugins
tags: guide
index: 1
title: WebdriverIO - WDIO with Grunt
---

# WDIO with Grunt

`grunt-webdriver` is a [grunt plugin](http://gruntjs.com/) to run selenium tests with the [WebdriverIO](http://webdriver.io) testrunner.

## Getting Started

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install --save-dev grunt-webdriver
```

Once the plugin has been installed, it may be enabled inside your gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-webdriver');
```

## The "webdriver" task

### Overview

In your project's Gruntfile, add a section named `webdriver` to the data object passed into `grunt.initConfig()`. Your test should contain a `configFile` property with a path to your wdio config. You can pass in additional options as cli arguments.

_Run this task with the `grunt webdriver` command._

```js
grunt.initConfig({
  webdriver: {
    test: {
        configFile: './test/wdio.conf.js'
    }
  },
  // ...
})
```

The plugin is an easy helper to run WebdriverIO tests using the wdio test runner. You can find more information about the test runner on our [docs page](http://webdriver.io/guide/testrunner/gettingstarted.html).

#### Example using [Sauce Labs](https://saucelabs.com)

To use a cloud service like [Sauce Labs](https://saucelabs.com) make sure you define `user` and `key` properties like in the example below to authenticate yourself with your username and access key.

```js
grunt.initConfig({
  webdriver: {
    options: {
        user: SAUCE_USERNAME,
        key: SAUCE_ACCESS_KEY
    },
    test: {
        configFile: './test/wdio.conf.js'
    }
  },
  // ...
})
```

### Options

All options get passed into to the wdio testrunner. You should define your main configurations within your wdio config file. The plugin allows you to easy overwrite them. You can find all available cli arguments here: [http://webdriver.io/guide/testrunner/gettingstarted.html](http://webdriver.io/guide/testrunner/gettingstarted.html)
