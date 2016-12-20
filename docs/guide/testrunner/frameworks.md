name: frameworks
category: testrunner
tags: guide
index: 2
title: WebdriverIO - Test Runner Frameworks
---

Frameworks
==========

The wdio runner currently supports [Mocha](http://mochajs.org/), [Jasmine](http://jasmine.github.io/) (v2.0) and [Cucumber](https://cucumber.io/). To integrate each framework with WebdriverIO there are adapter packages on NPM that need to be downloaded and installed. Note that these packages need to be installed at the same place WebdriverIO is installed. If you've installed WebdriverIO globally make sure you have the adapter package installed globally as well.

Within your spec files or step definition you can access the webdriver instance using the global variable `browser`. You don't need to initiate or end the Selenium session. This is taken care of by the wdio testrunner.

## Using Mocha

First you need to install the adapter package from NPM:

```sh
npm install wdio-mocha-framework --save-dev
```

If you like to use Mocha you should additionally install an assertion library to have more expressive tests, e.g. [Chai](http://chaijs.com). Initialise that library in the `before` hook in your configuration file:

```js
before: function() {
    var chai = require('chai');
    global.expect = chai.expect;
    chai.Should();
}
```

Once that is done you can write beautiful assertions like:

```js
describe('my awesome website', function() {
    it('should do some chai assertions', function() {
        browser.url('http://webdriver.io');
        browser.getTitle().should.be.equal('WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
    });
});
```

WebdriverIO supports Mochas `BDD` (default), `TDD` and `QUnit` [interface](https://mochajs.org/#interfaces). If you like to write your specs in TDD language set the ui property in your `mochaOpts` config to `tdd`, now your test files should get written like:

```js
suite('my awesome website', function() {
    test('should do some chai assertions', function() {
        browser.url('http://webdriver.io');
        browser.getTitle().should.be.equal('WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
    });
});
```

If you want to define specific Mocha settings you can do that by adding `mochaOpts` to your configuration file. A list of all options can be found on the [project website](http://mochajs.org/).

Note that since all commands are running synchronously there is no need to have async mode in Mocha enabled. Therefor you can't use the `done` callback:

```js
it('should test something', function () {
    done(); // throws "done is not a function"
})
```

If you want to run something asynchronously you can either use the [`call`](/api/utility/call.html) command or [custom commands](/guide/usage/customcommands.html).

## Using Jasmine

First you need to install the adapter package from NPM:

```sh
npm install wdio-jasmine-framework --save-dev
```

Jasmine already provides assertion methods you can use with WebdriverIO. So there is no need to add another one.

### Intercept Assertion

The Jasmine framework allows it to intercept each assertion in order to log the state of the application or website depending on the result. For example it is pretty handy to take a screenshot everytime an assertion fails. In your `jasmineNodeOpts` you can add a property called `expectationResultHandler` that takes a function to execute. The function parameter give you information about the result of the assertion. The following example demonstrate how to take a screenshot if an assertion fails:

```js
jasmineNodeOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function(passed, assertion) {
        /**
         * only take screenshot if assertion failed
         */
        if(passed) {
            return;
        }

        browser.saveScreenshot('assertionError_' + assertion.error.message + '.png');
    }
},
```

Please note that you can't stop the test execution to do something async. It might happen that
the command takes too much time and the website state has changed. Though usually after 2 another
commands the screenshot got taken which gives you still valuable information about the error.

## Using Cucumber

First you need to install the adapter package from NPM:

```sh
npm install wdio-cucumber-framework --save-dev
```

If you want to use Cucumber set the `framework` property to cucumber, either by adding `framework: 'cucumber'` to the [config file](/guide/testrunner/configurationfile.html) or by adding `-f cucumber` to the command line.

Options for Cucumber can be given in the config file with cucumberOpts. Check out the whole list of options [here](https://github.com/webdriverio/wdio-cucumber-framework#cucumberopts-options).

To get up and running quickly with Cucumber have a look on our [cucumber-boilerplate](https://github.com/webdriverio/cucumber-boilerplate) project that comes with all step definition you will probably need and allows you to start writing feature files ride away.
