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

If you like to use Mocha, you'll want to install an assertion library for more expressive tests. [Chai](http://chaijs.com) is a good choice.

Initialise it (or whatever assertion library you like) in the `before` hook of your configuration file:

```js
before: function() {
    const chai = require('chai')
    global.expect = chai.expect
    chai.Should()
}
```

Once that is done, you can write beautiful assertions like:

```js
describe('my awesome website', () => {
    it('should do some chai assertions', () => {
        browser.url('https://webdriver.io')
        browser.getTitle().should.be.equal('WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})
```

WebdriverIO supports Mocha's `BDD` (default), `TDD`, and `QUnit` [interfaces](https://mochajs.org/#interfaces).

If you like to write your specs in TDD style, set the `ui` property in your `mochaOpts` config to `tdd`. Now your test files should be written like this:

```js
suite('my awesome website', () => {
    test('should do some chai assertions', () => {
        browser.url('https://webdriver.io')
        browser.getTitle().should.be.equal('WebdriverIO · Next-gen WebDriver test framework for Node.js')
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

Jasmine already provides assertion methods you can use with WebdriverIO.
No need to add another one.

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
