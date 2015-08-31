WebdriverIO Examples
====================

Welcome to the WebdriverIO example repository. Here you can find a lot of stuff that helps you to understand
how WebdriverIO works. It is seperated in different topics. The best way to start is to clone the WebdriverIO
repository and install its dependencies:

```sh
git clone git@github.com:webdriverio/webdriverio.git
cd ./webdriverio
npm install
```

Then just follow the instructions and test it out. Have fun!

## Cloudservices

Shows you how to use WebdriverIO using Sauce Labs, Browserstack or Testingbot. To run those tests make sure
you have your credentials stored in your enviroment. If so just execute the file using node:

#### webdriverio.saucelabs.js

```sh
export SAUCE_USERNAME="username"
export SAUCE_ACCESS_KEY="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
node ./examples/cloudservices/webdriverio.saucelabs.js
```

#### webdriverio.browserstack.js

```sh
export BROWSERSTACK_USERNAME="username"
export BROWSERSTACK_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXX"
node ./examples/cloudservices/webdriverio.browserstack.js
```

#### webdriverio.testingbot.js

```sh
export TESTINGBOT_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export TESTINGBOT_SECRET="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
node ./examples/cloudservices/webdriverio.testingbot.js
```

## Commands

All files inside this directory demonstrate how some commands can get used. To run these examples just
execute them with node.

## Multiremote

The multiremote examples demonstrate how you can use more than one browser to test a specific thing.
This feature is not meant to run tests in parallel, it helps you test interactive features (e.g. a chat system)
where you need more than one browser to test.

#### webdriverio.multiremote.js

Run this test by executing the file using node. It opens up a WebRTC page with two Chrome browser.
Both browser will connect to each other and will have a two seconds long call.

#### webdriverio.multiremote.chat.js

This example demonstrates how you could test a chat system. Both browser will connet to a text based chat.
One browser will input something whereas the other browser reads the message, interprets it and returns with
a proper response message. You can execute the test using Mocha. Make sure you pass a high timeout as argument
to make the test work properly.

```sh
./node_modules/.bin/mocha ./examples/multiremote/webdriverio.multiremote.chat.js --timeout 9999999
```

## Standalone

These files show how to run WebdriverIO as standalone package in different frameworks. Before running them
make sure you have the desired framework installed.

## WDIO

This directory contains config files for each framework for the wdio test runner. It also shows you how to run
multiremote test with the test runner as well as WebdriverCSS tests. To execute the framework configs you need
the desired framework installed locally. Then just run the wdio executable from the root directory of the
WebdriverIO repository:

```sh
./bin/wdio examples/wdio/wdio.mocha.conf.js
```