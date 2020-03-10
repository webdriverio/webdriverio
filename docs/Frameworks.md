---
id: frameworks
title: Frameworks
---

The WDIO runner currently supports [Mocha](http://mochajs.org/),  [Jasmine](http://jasmine.github.io/), and [Cucumber](https://cucumber.io/).

To integrate each framework with WebdriverIO, there are adapter packages on NPM which must be installed. You cannot install the adapters just anywhere; these packages must be installed in the same location WebdriverIO is installed. So, if you installed WebdriverIO globally, be sure to install the adapter package globally, too.

Within your spec files (or step definitions), you can access the WebDriver instance using the global variable `browser`. (You don't need to initiate or end the Selenium session. This is taken care of by the `wdio` testrunner.)

## Using Mocha

First, install the adapter package from NPM:

```sh
npm install @wdio/mocha-framework --save-dev
```

By default WebdriverIO provides an [assertion library](Assertion.md) that is built-in which you can start right away:

```js
describe('my awesome website', () => {
    it('should do some assertions', () => {
        browser.url('https://webdriver.io')
        expect(browser).toHaveTitle('WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})
```

WebdriverIO supports Mocha's `BDD` (default), `TDD`, and `QUnit` [interfaces](https://mochajs.org/#interfaces).

If you like to write your specs in TDD style, set the `ui` property in your `mochaOpts` config to `tdd`. Now your test files should be written like this:

```js
suite('my awesome website', () => {
    test('should do some assertions', () => {
        browser.url('https://webdriver.io')
        expect(browser).toHaveTitle('WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})
```

If you want to define other Mocha-specific settings, you can do it with the `mochaOpts` key in your configuration file. A list of all options can be found on the [Mocha project website](http://mochajs.org).

__Note:__ Since all commands are running synchronously, there is no need to have async mode in Mocha enabled. Therefore, you can't use the `done` callback:

```js
it('should test something', () => {
    done() // throws "done is not a function"
})
```

If you want to run something asynchronously, you can either use the [`browser.call`](/api/browser/call.md) command or [custom commands](CustomCommands.md).

## Using Jasmine

First, install the adapter package from NPM:

```sh
npm install @wdio/jasmine-framework --save-dev
```

You can then configure your Jasmine environment by setting a `jasmineNodeOpts` property in your config.

### Intercept Assertion

The Jasmine framework allows it to intercept each assertion in order to log the state of the application or website, depending on the result.

For example, it is pretty handy to take a screenshot everytime an assertion fails. In your `jasmineNodeOpts` you can add a property called `expectationResultHandler` that takes a function to execute. The function’s parameters provide information about the result of the assertion.

The following example demonstrates how to take a screenshot if an assertion fails:

```js
jasmineNodeOpts: {
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

## Using Cucumber

First, install the adapter package from NPM:

```sh
npm install @wdio/cucumber-framework --save-dev
```

If you want to use Cucumber, set the `framework` property to `cucumber` by adding `framework: 'cucumber'` to the [config file](ConfigurationFile.md).

Options for Cucumber can be given in the config file with `cucumberOpts`. Check out the whole list of options [here](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-cucumber-framework#cucumberopts-options).

To get up and running quickly with Cucumber, have a look on our [`cucumber-boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) project that comes with all the step definitions you need to get stared, and you'll be writing feature files right away.

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

