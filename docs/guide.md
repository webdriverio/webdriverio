layout: guide
name: guide
title: WebdriverIO - Developer Guide
---

# Developer Guide

Welcome to the WebdriverIO documentation. It will help you to get started fast. If you run into problems you can find help and answers on our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) or you can hit me on [Twitter](https://twitter.com/webdriverio). The following will give you a short step by step introduction to get your first WebdriverIO script up and running.

## Taking the first step

Let's suppose you have [Node.js](http://nodejs.org/) and Java already installed. First thing we need to do is to start a selenium server that executes all selenium commands within the browser. To do so we create an example folder first:

** 1. Create a simple test folder**
```sh
$ mkdir webdriverio-test && cd webdriverio-test
```

Then let's download the current [selenium standalone server](http://docs.seleniumhq.org/download/) version:

** 2. Download selenium standalone server**
```sh
$ curl -O http://selenium-release.storage.googleapis.com/2.53/selenium-server-standalone-2.53.1.jar
```

Start the server by executing the following:

** 3. Start selenium standalone server**
```sh
$ java -jar selenium-server-standalone-2.53.1.jar
```

Keep this running in the background and open a new terminal window. Next step is to download WebdriverIO via NPM:

** 4. Download WebdriverIO**
```sh
$ npm install webdriverio
```

** 5. Create a test file (test.js) with the following content**
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

** 6. Run your test file**
```sh
$ node test.js
```

this should output the following:

```sh
Title was: Google
```

Yay, Congratulations! You've just run your first Selenium script with WebdriverIO. Let's step it up a notch.

## Let's get serious

This was just a warm up. Let's move forward and run WebdriverIO with the test runner. If you want to use WebdriverIO in your project for integration testing we recommend to use the test runner because it comes with a lot useful features that makes your life easier. The first step is to create a config file. To do that just run the configuration utility:

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

That's it! The configurator now installs all required packages for you and creates a spec file with the name `wdio.conf.js`. Next step is to create your first spec file (test file). For that create a test folder like this:

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

Hurray! The test should pass and your can start writing integration tests with WebdriverIO.
