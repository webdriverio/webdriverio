layout: guide
name: guide
title: WebdriverIO - Developer Guide
---

# Developer Guide

Welcome to the WebdriverIO documentation. It will help you to get started fast. If you run into problems you can find help and answers on our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) or you can hit me on [Twitter](https://twitter.com/webdriverio). Also, if you encounter problems in starting up the server or running the tests after following this tutorial, ensure that the server and the geckodriver are listed in your project directory. If not, re-download them per steps 2 and 3 below.

The following will give you a short step by step introduction to get your first WebdriverIO script up and running.

## Taking the first step

Let's suppose you have [Node.js](http://nodejs.org/) and Java already installed. First thing we need to do is to start a selenium server that executes all selenium commands within the browser. To do so we create an example folder first:

** 1. Create a simple test folder**
```sh
$ mkdir webdriverio-test && cd webdriverio-test
```

*While still in this test folder:*

Then let's download the latest [selenium standalone server](http://docs.seleniumhq.org/download/) version:

** 2. Download latest selenium standalone server**
```sh
$ curl -O http://selenium-release.storage.googleapis.com/3.0/selenium-server-standalone-3.0.1.jar
```

** 3. Download the latest version geckdriver for your environment and unpack it in your project directory**

Linux 64 bit

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.11.1/geckodriver-v0.11.1-linux64.tar.gz | tar xz
```

OSX

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.11.1/geckodriver-v0.11.1-macos.tar.gz | tar xz
```

Note: Other geckodriver releases are available [here](https://github.com/mozilla/geckodriver/releases).

Start the server by executing the following:

** 4. Start selenium standalone server**
```sh
$ java -jar -Dwebdriver.gecko.driver=./geckodriver selenium-server-standalone-3.0.1.jar
```

Note that this command sets webdriver path variable so that Selenium uses the geckdriver binary that was added to the project directory and also starts Selenium standalone server.

Keep this running in the background and open a new terminal window. Next step is to download WebdriverIO via NPM:

** 5. Download WebdriverIO**
```sh
$ npm install webdriverio
```

** 6. Create a test file (test.js) with the following content**
```js
var webdriverio = require('webdriverio');
var options = {
    desiredCapabilities: {
        browserName: 'firefox'
    }
};

webdriverio
    .remote(options)
    .init()
    .url('http://www.google.com')
    .getTitle().then(function(title) {
        console.log('Title was: ' + title);
    })
    .end();
```

** 7. Run your test file**
```sh
$ node test.js
```

this should output the following:

```sh
Title was: Google
```

Yay, Congratulations! You've just run your first automation script with WebdriverIO. Let's step it up a notch and create a real test.

## Let's get serious

*(If you haven't already, navigate back to the project root directory)*

This was just a warm up. Let's move forward and run WebdriverIO with the test runner. If you want to use WebdriverIO in your project for integration testing we recommend to use the test runner because it comes with a lot of useful features that makes your life easier. The first step is to create a config file. To do that just run the configuration utility:

```sh
$ ./node_modules/.bin/wdio config
```

A question interface pops up. It will help to create the config easy and fast. If you are not sure what to answer follow this answers:

__Q: Where do you want to execute your tests?__<br>
A: _On my local machine_<br>
<br>
__Q: Which framework do you want to use?__<br>
A: _mocha_<br>
<br>
__Q: Shall I install the framework adapter for you?__<br>
A: _Yes_ (just press enter)<br>
<br>
__Q: Where are your test specs located?__<br>
A: _./test/specs/**/*.js_ (just press enter)<br>
<br>
__Q: Which reporter do you want to use?__<br>
A: _dot_ (just press space and enter)<br>
<br>
__Q: Shall I install the reporter library for you?__<br>
A: _Yes_ (just press enter)<br>
<br>
__Q: Do you want to add a service to your test setup?__<br>
A: none (just press enter, let's skip this for simplicity)<br>
<br>
__Q: Level of logging verbosity:__<br>
A: _silent_ (just press enter)<br>
<br>
__Q: In which directory should screenshots gets saved if a command fails?__<br>
A: _./errorShots/_ (just press enter)<br>
<br>
__Q: What is the base url?__<br>
A: _http://localhost_ (just press enter)<br>

That's it! The configurator now installs all required packages for you and creates a config file with the name `wdio.conf.js`. Next step is to create your first spec file (test file). For that create a test folder like this:

```sh
$ mkdir -p ./test/specs
```

Now let's create a simple spec file in that new folder:

```js
var assert = require('assert');

describe('webdriver.io page', function() {
    it('should have the right title - the fancy generator way', function () {
        browser.url('http://webdriver.io');
        var title = browser.getTitle();
        assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
    });
});
```

The last step is to execute the test runner. To do so just run:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

Hurray! The test should pass and you can start writing integration tests with WebdriverIO. If you are interested in more in depth video on-boarding tutorials, feel free to check out our very own course called [learn.webdriver.io](http://learn.webdriver.io/). Also our community has collected a lot of [boilerplate projects](/guide/getstarted/boilerplate.html) that can help you to get started.
