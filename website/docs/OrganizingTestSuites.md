---
id: organizingsuites
title: Organizing Test Suite
---

As projects grow, inevitably more and more integration tests are added. This increases build time and slows productivity.

To prevent this, you should run your tests in parallel. WebdriverIO already tests each spec (or _feature file_ in Cucumber) in parallel within a single session. In general, try to test a only a single feature per spec file. Try to not have too many or too few tests in one file. (However, there is no golden rule here.)

Once your tests have several spec files, you should start running your tests concurrently. To do so, adjust the `maxInstances` property in your config file. WebdriverIO allows you to run your tests with maximum concurrency—meaning that no matter how many files and tests you have, they can all run in parallel.  (This is still subject to certain limits, like your computer’s CPU, concurrency restrictions, etc.)

> Let's say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have set `maxInstances` to `1`. The WDIO test runner will spawn 3 processes. Therefore, if you have 10 spec files and you set `maxInstances` to `10`, _all_ spec files will be tested simultaneously, and 30 processes will be spawned.

You can define the `maxInstances` property globally to set the attribute for all browsers.

If you run your own WebDriver grid, you may (for example) have more capacity for one browser than another. In that case, you can _limit_ the `maxInstances` in your capability object:

```js
// wdio.conf.js
exports.config = {
    // ...
    // set maxInstance for all browser
    maxInstances: 10,
    // ...
    capabilities: [{
        browserName: 'firefox'
    }, {
        // maxInstances can get overwritten per capability. So if you have an in-house WebDriver
        // grid with only 5 firefox instance available you can make sure that not more than
        // 5 instance gets started at a time.
        browserName: 'chrome'
    }],
    // ...
}
```

## Inherit From Main Config File

If you run your test suite in multiple environments (e.g., dev and integration) it may help to use multiple configuration files to keep things manageable.

Similar to the [page object concept](PageObjects.md), the first thing you’ll need is a main config file. It contains all configurations you share across environments.

Then create another config file for each environment, and supplement the the main config with the environment-specific ones:

```js
// wdio.dev.config.js
import merge from 'deepmerge'
import wdioConf from './wdio.conf.js'

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
}, { clone: false })

// add an additional reporter
exports.config.reporters.push('allure')
```

## Grouping Test Specs In Suites

You can easily group test specs in suites and run single specific suites instead of all of them.

First, define your suites in your WDIO config:

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

Now, if you want to only run a single suite, you can pass the suite name as a CLI argument:

```bash
wdio wdio.conf.js --suite login
```

Or, run multiple suites at once:

```bash
wdio wdio.conf.js --suite login --suite otherFeature
```

## Grouping Test Specs To Run Sequentially

As described above, there are benefits in running the tests concurrently.  However, there are cases where it would be beneficial to group tests together to run sequentially in a single instance.  Examples of this are mainly where there is a large setup cost e.g. transpiling code or provisioning cloud instances, but there are also advanced usage models that benefit from this capability.

To group tests to run in a single instance, simply define them as an array within the specs definition.

```json
    "specs": [
        [
            "./test/specs/test_login.js",
            "./test/specs/test_product_order.js",
            "./test/specs/test_checkout.js"
        ],
        "./test/specs/test_b*.js",
    ],
```
In the example above, the tests 'test_login.js', 'test_product_order.js' and 'test_checkout.js' will be run sequentially in a single instance and each of the "test_b*" tests will run concurrently in individual instances.

It is also possible to group specs defined in suites, so you can now also define suites like this:
```json
    "suites": {
        end2end: [
            [
                "./test/specs/test_login.js",
                "./test/specs/test_product_order.js",
                "./test/specs/test_checkout.js"
            ]
        ],
        allb: ["./test/specs/test_b*.js"]
},
```
and in this case all of the tests of the "end2end" suite would be run in a single instance.


## Run Selected Tests

In some cases, you may wish to only execute a single test (or subset of tests) of your suites.

With the `--spec` parameter, you can specify which _suite_ (Mocha, Jasmine) or _feature_ (Cucumber) should be run.

For example, to run only your login test:

```bash
wdio wdio.conf.js --spec ./test/specs/e2e/login.js
```

Or run multiple specs at once:

```bash
wdio wdio.conf.js --spec ./test/specs/signup.js --spec ./test/specs/forgot-password.js
```

If the `--spec` value does not point to a particular spec file, it is instead used to filter the spec filenames defined in your configuration.

To run all specs with the word “dialog” in the spec file names, you could use:

```bash
wdio wdio.conf.js --spec dialog
```

Note that each test file is running in a single test runner process. Since we don't scan files in advance (see the next section for information on piping filenames to `wdio`), you _can't_ use (for example) `describe.only` at the top of your spec file to instruct Mocha to run only that suite.

This feature will help you to accomplish the same goal.

## Exclude Selected Tests

When needed, if you need to exclude particular spec file(s) from a run, you can use the `--exclude` parameter (Mocha, Jasmine) or feature (Cucumber).

For example, to exclude your login test from the test run:

```bash
wdio wdio.conf.js --exclude ./test/specs/e2e/login.js
```

Or, exclude multiple spec files:

 ```bash
wdio wdio.conf.js --exclude ./test/specs/signup.js --exclude ./test/specs/forgot-password.js
```

Or, exclude a spec file when filtering using a suite:

```bash
wdio wdio.conf.js --suite login --exclude ./test/specs/e2e/login.js
```

## Run Suites and Test Specs

Run an entire suite along with individual specs.

```bash
wdio wdio.conf.js --suite login --spec ./test/specs/signup.js
```

## Run Multiple, Specific Test Specs

It is sometimes necessary&mdash;in the context of continuous integration and otherwise&mdash;to specify multiple sets of specs to run. WebdriverIO's `wdio` command line utility accepts piped-in filenames (from `find`, `grep`, or others).

Piped-in filenames override the list of globs or filenames specified in the configuration's `spec` list.

```bash
grep -r -l --include "*.js" "myText" | wdio wdio.conf.js
```

_**Note:** This will_ not _override the `--spec` flag for running a single spec._

## Running Specific Tests with MochaOpts

You can also filter which specific `suite|describe` and/or `it|test` you want to run by passing a mocha specific argument: `--mochaOpts.grep` to the wdio CLI.

```bash
wdio wdio.conf.js --mochaOpts.grep myText
wdio wdio.conf.js --mochaOpts.grep "Text with spaces"
```

_**Note:** Mocha will filter the tests after the WDIO test runner creates the instances, so you might see several instances being spawned but not actually executed._

## Stop testing after failure

With the `bail` option, you can tell WebdriverIO to stop testing after any test fails.

This is helpful with large test suites when you already know that your build will break, but you want to avoid the lengthy wait of a full testing run.

The `bail` option expects a number, which specifies how many test failures can occur before WebDriver stop the entire testing run. The default is `0`, meaning that it always runs all tests specs it can find.

Please see [Options Page](Options.md) for additional information on the bail configuration.
