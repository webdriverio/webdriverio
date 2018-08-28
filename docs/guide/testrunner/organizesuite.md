name: organizing suites
category: testrunner
tags: guide
index: 4
title: WebdriverIO - Organize Test Suite
---

Organizing Test Suites
===================

While your project is growing you will inevitably add more and more integration tests. This will increase your build time and will also slow down your productivity. To prevent this you should start to run your tests in parallel. You might have already recognised that WebdriverIO creates for each spec (or feature file in cucumber) a single Selenium session. In general, you should try to test a single feature in your app in one spec file. Try to not have too many or too few tests in one file. However, there is no golden rule about that.

Once you get more and more spec files you should start running them concurrently. To do so you can adjust the [`maxInstances`](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L52-L60) property in your config file. WebdriverIO allows you to run your tests with maximum concurrency meaning that no matter how many files and tests you have, they could run all in parallel. Though there are certain limits (computer CPU, concurrency restrictions).

> Let's say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have set maxInstances to 1, the wdio test runner will spawn 3 processes. Therefore, if you have 10 spec files and you set maxInstances to 10; all spec files will get tested at the same time and 30 processes will get spawned.

You can define the `maxInstance` property globally to set the attribute for all browser. If you run your own Selenium grid it could be that you have more capacity for one browser than for an other one. In this case you can limit the `maxInstance` in your capability object:

```js
// wdio.conf.js
exports.config = {
    // ...
    // set maxInstance for all browser
    maxInstances: 10,
    // ...
    capabilities: [{
        browserName: "firefox"
    }, {
        // maxInstances can get overwritten per capability. So if you have an in-house Selenium
        // grid with only 5 firefox instance available you can make sure that not more than
        // 5 instance gets started at a time.
        browserName: 'chrome'
    }],
    // ...
}
```

## Inherit From Main Config File

If you run your test suite in multiple environments (e.g. dev and integration) it could be helpful to have multiple configuration files to keep them easy manageable. Similar to the [page object concept](/guide/testrunner/pageobjects.html) you first create a main config file. It contains all configurations you share across environments. Then for each environment you can create a file and supplement the information from the main config file with environment specific ones:

```js
// wdio.dev.config.js
var merge = require('deepmerge');
var wdioConf = require('./wdio.conf.js');

// have main config file as default but overwrite environment specific information
exports.config = merge(wdioConf.config, {
    capabilities: [
        // more caps defined here
        // ...
    ],

    // run tests on sauce instead locally
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    services: ['sauce']
}, { clone: false });

// add an additional reporter
exports.config.reporters.push('allure');
```

## Group Test Specs

You can easily group test specs in suites and run single specific suites instead of all of them. To do so you first need to define your suites in your wdio config:

```js
// wdio.conf.js
exports.config = {
    // define all tests
    specs: ['./test/specs/**/*.spec.js'],
    // ...
    // define specific suites
    suites: {
        login: [
            './test/specs/login.success.spec.js',
            './test/specs/login.failure.spec.js'
        ],
        otherFeature: [
            // ...
        ]
    },
    // ...
}
```

Now, if you want to only run a single suite, you can pass the suite name as cli argument like:

```sh
$ wdio wdio.conf.js --suite login
```

or run multiple suites at once:

```sh
$ wdio wdio.conf.js --suite login,otherFeature
```

## Run Selected Tests

In some cases, you may wish to only execute a single test or a subset of your suites. With the `--spec` parameter you can specify which suite (Mocha, Jasmine) or feature (Cucumber) should be run. For example if you only want to run your login test, do:

```sh
$ wdio wdio.conf.js --spec ./test/specs/e2e/login.js
```

or run multiple specs at once:

```sh
$ wdio wdio.conf.js --spec ./test/specs/signup.js,./test/specs/forgot-password.js
```

If the spec passed in is not a path to a spec file, it is used as a filter for the spec file names defined in your configuration file. To run all specs with the word 'dialog' in the spec file names, you could use:

```sh
$ wdio wdio.conf.js --spec dialog
```

Note that each test file is running in a single test runner process. Since we don't scan files in advance (see the next section for information on piping filenames to `wdio`) you _can't_ use for example `describe.only` at the top of your spec file to say Mocha to only run that suite. This feature will help you though to do that in the same way.

## Run Suites and Test Specs

This will allow you to run an entire suite along with individual spec's.

```sh
$ wdio wdio.conf.js --suite login --spec ./test/specs/signup.js
```

## Run Multiple, Specific Test Specs

It is sometimes necessary&mdash;in the context of continuous integration and otherwise&mdash;to specify multiple sets of specs to be run at runtime. WebdriverIO's `wdio` command line utility will accept piped input in the form of filenames (from `find`, `grep`, or others). These filenames will override the list of glob patterns or filenames specified in the configuration file's `spec` list.

```sh
$ grep -r -l --include "*.js" "myText" | wdio wdio.conf.js
```

_**Note:** This will_ not _override the `--spec` flag for running a single spec._

## Exclude Selected Tests

When needed, if you need to exclude particular spec file(s) from a run, you can use the `--exclude` parameter (Mocha, Jasmine) or feature (Cucumber). For example if you want to exclude your login
test from the test run, do:

```sh
$ wdio wdio.conf.js --exclude ./test/specs/e2e/login.js
```

or exclude multiple spec files:

```sh
$ wdio wdio.conf.js --exclude ./test/specs/signup.js,./test/specs/forgot-password.js
```

or exclude a spec file when filtering using a suite:

```sh
$ wdio wdio.conf.js --suite login --exclude ./test/specs/e2e/login.js
```

## Stop testing after failure

With the `bail` option you can specify when WebdriverIO should stop the test run after test failures. This can be helpful when you have a big test suite and want to avoid long test runs when you already know that your build will break. The option expects a number that specifies after how many spec failures it should stop the whole test run. The default is `0` meaning that it always runs all tests specs it can find.

Please see http://webdriver.io/guide/getstarted/configuration.html#bail for additional information on the bail configuration.
