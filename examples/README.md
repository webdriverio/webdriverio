WebdriverIO Examples
====================

Welcome to the WebdriverIO example repository. Here you can find a lot of stuff that helps you to understand how WebdriverIO works. It is separated into different topics. The best way to start is to clone the WebdriverIO repository, install its dependencies, and build it:

```sh
git clone git@github.com:webdriverio/webdriverio.git
cd ./webdriverio
npm install
npm run setup
```

Then just follow the instructions and test it out. Have fun!

> **Note**

> The examples don't have any `dev-dependencies`. Use one of the [boilerplates](https://webdriver.io/docs/boilerplates) to set up you project including the `dev-dependencies` and integrate the examples in that project.

# Cloudservices

Shows you how to use WebdriverIO using Sauce Labs, Browserstack, Testingbot or Kobiton. To run those tests make sure you have your credentials stored in your environment. Then change directory to the example folder:

```sh
cd ./examples/cloudservices
```

and run the demos by calling:

## saucelabs.js

```sh
export SAUCE_USERNAME="username"
export SAUCE_ACCESS_KEY="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
npm run test:saucelabs
```

## browserstack.js

```sh
export BROWSERSTACK_USERNAME="username"
export BROWSERSTACK_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXX"
npm run test:browserstack
```

## testingbot.js

```sh
export TESTINGBOT_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export TESTINGBOT_SECRET="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
npm run test:testingbot
```

## kobiton.js
```sh
export KOBITON_USERNAME="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export KOBITON_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
npm run test:kobiton
```

## crossbrowsertesting.js

```sh
export CBT_USERNAME="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export CBT_AUTHKEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
npm run test:crossbrowsertesting
```

## Commands

All files inside this directory demonstrate how some commands can get used. To run these examples just execute them with node.

# Multiremote

The multiremote examples demonstrate how you can use more than one browser to test a specific thing. This feature is not meant to run tests in parallel, it helps you test interactive features (e.g. a chat system) where you need more than one browser to test.

## webrtc.js

Run this test by executing the file using node. It opens up a WebRTC page with two Chrome browser. Both browser will connect to each other and will have a two seconds long call.

```sh
npm run test:webrtc
```

## webdriverio.multiremote.chat.js

This example demonstrates how you could test a chat system. Both browsers will connect to a text based chat. One browser will input something whereas the other browser reads the message, interprets it and returns with a proper response message. You can execute the test using Mocha. Make sure you pass a high timeout as argument to make the test work properly.

```sh
npm run test:chat
```


## Page Object Example

This directory demonstrates a simple setup for a wdio test suite with page objects. There is a page object for each page that gets tested + a parent page (`page.js`) object that contains all important selectors and methods each page object should inherit from. As you can see the page objects are created using `Object.create` in order to enable easy inheritance between pages and their selectors.

The goal behind this pattern is to abstract any page information away from the actual tests. Ideally you should store all selectors or specific instructions that are unique for a certain page in a page controller, so that you still can run your test after you've completely redesigned your page and fixed all selectors in the page object.

The examples works without any 3rd party dependencies for assertions. These can be added if desired to make the test even more readable. The code is written using [JavaScript classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes). In order to be able to run the code make sure you run a Node.JS version that supports it or integrate [Babel](https://babeljs.io/) as compiler.

To run the test, change into this directory:

```sh
cd ./examples/pageobject
```

And run the demo:

```sh
npm test
```

# WDIO Testrunner Examples

This directory contains examples for each framework and variation for the wdio test runner. It also shows you how to run multiremote test with the test runner or how to embed a custom reporter. First change directory to the example folder:

```sh
cd ./examples/wdio
```

Then run the test by calling the following commands:

```sh
# mocha tests
$ npm run test:mocha
# jasmine tests
$ npm run test:jasmine
# cucumber tests
$ npm run test:cucumber
# testsuite with multiremote
$ npm run test:multiremote
# test suite with custom reporter
$ npm run test:customReporter
# component tests
$ npm run test:viteVue
```
