---
id: frameworks
title: Frameworks
---

The WDIO runner currently supports [Mocha](http://mochajs.org/),  [Jasmine](http://jasmine.github.io/), and [Cucumber](https://cucumber.io/).

To integrate each framework with WebdriverIO, there are adapter packages on NPM which must be installed. You cannot install the adapters just anywhere; these packages must be installed in the same location WebdriverIO is installed. So, if you installed WebdriverIO globally, be sure to install the adapter package globally, too.

Within your spec files (or step definitions), you can access the WebDriver instance using the global variable `browser`. (You don't need to initiate or end the Selenium session. This is taken care of by the `wdio` testrunner.)

## Using Mocha

First, install the adapter package from NPM:

```bash npm2yarn
npm install @wdio/mocha-framework --save-dev
```

By default WebdriverIO provides an [assertion library](Assertion.md) that is built-in which you can start right away:

```js
describe('my awesome website', () => {
    it('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

WebdriverIO supports Mocha's `BDD` (default), `TDD`, and `QUnit` [interfaces](https://mochajs.org/#interfaces).

If you like to write your specs in TDD style, set the `ui` property in your `mochaOpts` config to `tdd`. Now your test files should be written like this:

```js
suite('my awesome website', () => {
    test('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

If you want to define other Mocha-specific settings, you can do it with the `mochaOpts` key in your configuration file. A list of all options can be found on the [Mocha project website](https://mochajs.org/api/mocha).

__Note:__ WebdriverIO does not support the deprecated usage of `done` callbacks in Mocha:

```js
it('should test something', (done) => {
    done() // throws "done is not a function"
})
```

If you want to run something asynchronously, you can either use the [`browser.call`](/docs/api/browser/call) command or [custom commands](CustomCommands.md).

### Mocha Options

The following options can be applied in your `wdio.conf.js` to configure your Mocha environment. __Note:__ not all options are supported, e.g. applying the `parallel` option will cause an error as the WDIO testrunner has its own way to run tests in parallel. The following options however are supported:

#### require
The `require` option is useful when you want to add or extend some basic functionality (WebdriverIO framework option).

Type: `string|string[]`<br />
Default: `[]`

#### compilers
Use the given module(s) to compile files. Compilers will be included before requires (WebdriverIO framework option).

Type: `string[]`<br />
Default: `[]`

#### allowUncaught
Propagate uncaught errors.

Type: `boolean`<br />
Default: `false`

#### bail
Bail after first test failure.

Type: `boolean`<br />
Default: `false`

#### checkLeaks
Check for global variable leaks.

Type: `boolean`<br />
Default: `false`

#### delay
Delay root suite execution.

Type: `boolean`<br />
Default: `false`

#### fgrep
Test filter given string.

Type: `string`<br />
Default: `null`

#### forbidOnly
Tests marked `only` fail the suite.

Type: `boolean`<br />
Default: `false`

#### forbidPending
Pending tests fail the suite.

Type: `boolean`<br />
Default: `false`

#### fullTrace
Full stacktrace upon failure.

Type: `boolean`<br />
Default: `false`

#### global
Variables expected in global scope.

Type: `string[]`<br />
Default: `[]`

#### grep
Test filter given regular expression.

Type: `RegExp|string`<br />
Default: `null`

#### invert
Invert test filter matches.

Type: `boolean`<br />
Default: `false`

#### retries
Number of times to retry failed tests.

Type: `number`<br />
Default: `0`

#### timeout
Timeout threshold value (in ms).

Type: `number`<br />
Default: `30000`

## Using Jasmine

First, install the adapter package from NPM:

```bash npm2yarn
npm install @wdio/jasmine-framework --save-dev
```

You can then configure your Jasmine environment by setting a `jasmineOpts` property in your config. A list of all options can be found on the [Jasmine project website](https://jasmine.github.io/api/3.5/Configuration.html).

### Intercept Assertion

The Jasmine framework allows it to intercept each assertion in order to log the state of the application or website, depending on the result.

For example, it is pretty handy to take a screenshot every time an assertion fails. In your `jasmineOpts` you can add a property called `expectationResultHandler` that takes a function to execute. The function’s parameters provide information about the result of the assertion.

The following example demonstrates how to take a screenshot if an assertion fails:

```js
jasmineOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function(passed, assertion) {
        /**
         * only take screenshot if assertion failed
         */
        if(passed) {
            return
        }

        browser.saveScreenshot(`assertionError_${assertion.error.message}.png`)
    }
},
```

**Note:** You cannot stop test execution to do something async. It might happen that
the command takes too much time and the website state has changed. (Though usually, after another 2
commands the screenshot is taken anyway, which still gives _some_ valuable information about the error.)

### Jasmine Options

The following options can be applied in your `wdio.conf.js` to configure your Jasmine environment using the `jasmineOpts` property. For more information on these configuration options, check out the [Jasmine docs](https://jasmine.github.io/api/edge/Configuration).

#### defaultTimeoutInterval
Default Timeout Interval for Jasmine operations.

Type: `number`<br />
Default: `60000`

#### helpers
Array of filepaths (and globs) relative to spec_dir to include before jasmine specs.

Type: `string[]`<br />
Default: `[]`

#### requires
The `requires` option is useful when you want to add or extend some basic functionality.

Type: `string[]`<br />
Default: `[]`

#### random
Whether to randomize spec execution order.

Type: `boolean`<br />
Default: `true`

#### seed
Seed to use as the basis of randomization. Null causes the seed to be determined randomly at the start of execution.

Type: `Function`<br />
Default: `null`

#### failSpecWithNoExpectations
Whether to fail the spec if it ran no expectations. By default a spec that ran no expectations is reported as passed. Setting this to true will report such spec as a failure.

Type: `boolean`<br />
Default: `false`

#### oneFailurePerSpec
Whether to cause specs to only have one expectation failure.

Type: `boolean`<br />
Default: `false`

#### specFilter
Function to use to filter specs.

Type: `Function`<br />
Default: `(spec) => true`

#### grep
Only run tests matching this string or regexp. (Only applicable if no custom `specFilter` function is set)

Type: `string|Regexp`<br />
Default: `null`

#### invertGrep
If true it inverts the matching tests and only runs tests that don't match with the expression used in `grep`. (Only applicable if no custom `specFilter` function is set)

Type: `boolean`<br />
Default: `false`

## Using Cucumber

First, install the adapter package from NPM:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

If you want to use Cucumber, set the `framework` property to `cucumber` by adding `framework: 'cucumber'` to the [config file](ConfigurationFile.md).

Options for Cucumber can be given in the config file with `cucumberOpts`. Check out the whole list of options [here](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options).

To get up and running quickly with Cucumber, have a look on our [`cucumber-boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) project that comes with all the step definitions you need to get stared, and you'll be writing feature files right away.

### Cucumber Options

The following options can be applied in your `wdio.conf.js` to configure your Cucumber environment using the `cucumberOpts` property:

#### backtrace
Show full backtrace for errors.

Type: `Boolean`<br />
Default: `true`

#### requireModule
Require modules prior to requiring any support files.

Type: `string[]`<br />
Default: `[]`<br />
Example:

```js
cucumberOpts: {
    requireModule: ['@babel/register']
    // or
    requireModule: [
        [
            '@babel/register',
            {
                rootMode: 'upward',
                ignore: ['node_modules']
            }
        ]
    ]
 }
 ```

#### failAmbiguousDefinitions
Treat ambiguous definitions as errors. Please note that this is a `@wdio/cucumber-framework` specific option and not recognized by cucumber-js itself.

Type: `boolean`<br />
Default: `false`

#### failFast
Abort the run on first failure.

Type: `boolean`<br />
Default: `false`

#### ignoreUndefinedDefinitions
Treat undefined definitions as warnings. Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself.

Type: `boolean`<br />
Default: `false`

#### names
Only execute the scenarios with name matching the expression (repeatable).

Type: `RegExp[]`<br />
Default: `[]`

#### profile
Specify the profile to use.

Type: `string[]`<br />
Default: `[]`

#### require
Require files containing your step definitions before executing features. You can also specify a glob to your step definitions.

Type: `string[]`<br />
Default: `[]`
Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### snippetSyntax
Specify a custom snippet syntax.

Type: `string`<br />
Default: `null`

#### snippets
Hide step definition snippets for pending steps.

Type: `boolean`<br />
Default: `true`

#### source
Hide source uris.

Type: `boolean`<br />
Default: `true`

#### strict
Fail if there are any undefined or pending steps.

Type: `boolean`<br />
Default: `false`

#### tagExpression
Only execute the features or scenarios with tags matching the expression. Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.

Type: `string`<br />
Default: `null`

#### tagsInTitle
Add cucumber tags to feature or scenario name.

Type: `boolean`<br />
Default: `false`

#### timeout
Timeout in milliseconds for step definitions.

Type: `number`<br />
Default: `30000`

### Skipping tests in cucumber

Note that if you want to skip a test using regular cucumber test filtering capabilities available in `cucumberOpts`, you will do it for all the browsers and devices configured in the capabilities. In order to be able to skip scenarios only for specific capabilities combinations without having a session started if not necessary, webdriverio provides the following specific tag syntax for cucumber:

`@skip([condition])`

were condition is an optional combination of capabilities properties with their values that when **all** matched with cause the tagged scenario or feature to be skipped. Of course you can add several tags to scenarios and features to skip a tests under several different conditions.

Here you have some examples of this syntax:
- `@skip()`: will always skip the tagged item
- `@skip(browserName="chrome")`: the test will not be executed against chrome browsers.
- `@skip(browserName="firefox";platformName="linux")`: will skip the test in firefox over linux executions.
- `@skip(browserName=["chrome","firefox"])`: tagged items will be skipped for both chrome and firefox browsers.
- `@skip(browserName=/i.*explorer/`: capabilities with browsers matching the regexp will be skipped (like `iexplorer`, `internet explorer`, `internet-explorer`, ...).

### Import Step Definition Helper

In order to use step definition helper like `Given`, `When` or `Then` or hooks, you are suppose to import then from `@cucumber/cucumber`, e.g. like this:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Now, if you use Cucumber already for other types of tests unrelated to WebdriverIO for which you use a specific version you need to import these helpers in your e2e tests from the WebdriverIO Cucumber package, e.g.:

```js
import { Given, When, Then } from '@wdio/cucumber-framework'
```

This ensures that you use the right helpers within the WebdriverIO framework and allows you to use an independant Cucumber version for other types of testing.
