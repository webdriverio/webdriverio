name: frameworks
category: testrunner
tags: guide
index: 2
title: WebdriverIO - Test Runner Frameworks
---

Frameworks
==========

The wdio runner currently supports [Mocha](http://mochajs.org/), [Jasmine](http://jasmine.github.io/) (v2.0) and
[Cucumber](https://cucumber.io/). These BDD frameworks are all based on Node.js and need to be installed via
NPM. Note that the modules need to be installed at the same place WebdriverIO is installed. If you installed
WebdriverIO globally make sure you have the test frameworks installed globally as well.

Within your spec files or step definition you can access the webdriver instance using the global variable `browser`.
You don't need to initiate or end the Selenium session. This is taken care of by the wdio testrunner.

## Using Mocha

If you like to use Mocha you should additionally install an assertion library that supports promises,
e.g. [Chai As Promise](http://chaijs.com/plugins/chai-as-promised). Initialise that library in the
`before` hook in your configuration file:

```js
before: function() {
    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
&nbsp;
    chai.use(chaiAsPromised);
    expect = chai.expect;
    chai.Should();
}
```

Once that is done you can write beautiful assertions like:

```js
describe('my awesome website', function() {
    it('should do some chai assertions', function() {
        return browser
            .url('http://webdriver.io')
            .getTitle().should.eventually.be.equal('WebdriverIO');
    });
});
```

WebdriverIO supports Mochas `BDD` (default) and `TDD` [interface](https://mochajs.org/#interfaces). If you like
to write your specs in TDD language set the ui property in your `mochaOpts` config to `tdd`, now your test files should
get written like:

```js
suite('my awesome website', function() {
    test('should do some chai assertions', function() {
        return browser
            .url('http://webdriver.io')
            .getTitle().should.eventually.be.equal('WebdriverIO');
    });
});
```

Make sure to checkout the [transfer promises](/guide/usage/transferpromises.html) section to enable multiple
consecutive assertions. If you want to define specific Mocha settings you can do that by adding `mochaOpts`
to your configuration file.

If you get messages like
`timeout of 10000ms exceeded. Ensure the done() callback is being called in this test.`
then you can increasing the `timeout` settings in `mochaOpts`.

There are three different approaches how to deal with asynchronicity in your `it` blocks:

###### The Good Old Callback Way

```js
describe('my feature', function() {
    it('will do something', function(done) {
        browser
             .url('http://google.com')
             .getTitle().then(function(title) {
                 console.log(title);
              })
              .call(done);
    });
});
```

###### Using Promises

```js
describe('my feature', function() {
    it('will do something', function() {
        return browser
             .url('http://google.com')
             .getTitle().then(function(title) {
                 console.log(title);
              });
    });
});
```

###### The New Fancy Generator way

Note that you shouldn't forget the asterisks after `function`.

```js
describe('my feature', function() {
    it('will do something', function* () {
        yield browser.url('http://google.com');
        var title = yield browser.getTitle()
        console.log(title);
    });
});
```

## Using Jasmine

Jasmine already provides assertion methods you can use with WebdriverIO. Also the way how you deal with
asynchronicity is the same like using Mocha. The only difference is that you can change Jasmines
`defaultTimeoutInterval` by settings it in the `jasmineNodeOpts` in your configuration file.

### Intercept Assertion

The Jasmine framework allows it to intercept each assertion in order to log the state of the application
or website depending on the result. For example it is pretty handy to take a screenshot everytime
an assertion fails. In your `jasmineNodeOpts` you can add a property called `expectationResultHandler`
that takes a function to execute. The function parameter give you information about the result of
the assertion. The following example demonstrate how to take a screenshot if an assertion fails:

```js
jasmineNodeOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function(passed, assertion) {
&nbsp;
        /**
         * only take screenshot if assertion failed
         */
        if(passed) {
            return;
        }
&nbsp;
        var title = assertion.message.replace(/\s/g, '-');
        browser.saveScreenshot(('assertionError_' + title + '.png'));
&nbsp;
    }
},
```

Please note that you can't stop the test execution to do something async. It might happen that
the command takes too much time and the website state has changed. Though usually after 2 another
commands the screenshot got taken which gives you still valueable information about the error.

## Using Cucumber

If you want to use Cucumber set the `framework` property to cucumber, either by adding `framework: 'cucumber'`
to the [config file](/guide/testrunner/configurationfile.html) or by adding `-f cucumber` to the command line.

Options for Cucumber such as 'format' can be given in the config file with cucumberOpts:

```js
cucumberOpts: {
  format: "summary"
}
```
