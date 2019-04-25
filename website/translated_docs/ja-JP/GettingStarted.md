---
id: gettingstarted
title: Getting Started
---

Welcome to the WebdriverIO documentation. It will help you to get started fast. If you run into problems you can find help and answers on our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) or you can hit me on [Twitter](https://twitter.com/webdriverio). Also, if you encounter problems in starting up the server or running the tests after following this tutorial, ensure that the server and the geckodriver are listed in your project directory. If not, re-download them per steps 2 and 3 below.

> **Note:** These are the docs for the latest version (v5.0.0) of WebdriverIO. If you are still using v4 or older please us the legacy docs website [v4.webdriver.io](http://v4.webdriver.io)!

The following will give you a short step by step introduction to get your first WebdriverIO script up and running.

## Taking the first step

Let's suppose you have [Node.js](http://nodejs.org/) already installed. First thing we need to do is to download a browser driver that helps us automate the browser. To do so we create an example folder first:

### Create a simple test folder

```sh
$ mkdir webdriverio-test && cd webdriverio-test
```

*While still in this test folder:*

### Download Geckodriver

Download the latest version of geckodriver for your environment and unpack it in your project directory:

Linux 64 bit

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.21.0/geckodriver-v0.21.0-linux64.tar.gz | tar xz
```

OSX

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.21.0/geckodriver-v0.21.0-macos.tar.gz | tar xz
```

Note: Other geckodriver releases are available [here](https://github.com/mozilla/geckodriver/releases). In order to automate other browser you need to run different drivers. You can find a list with all drivers in the [awesome-selenium](https://github.com/christian-bromann/awesome-selenium#driver) readme.

### Start Browser Driver

Start Geckodriver by running:

```sh
$ /path/to/binary/geckodriver --port 4444
```

This will start Geckodriver on `localhost:4444` with the WebDriver endpoint set to `/`. Keep this running in the background and open a new terminal window. Next step is to download WebdriverIO via NPM:

### Download WebdriverIO

By calling:

```sh
$ npm install webdriverio
```

### Create Test File

Create a test file (e.g. `test.js`) with the following content:

```js
const { remote } = require('webdriverio');

(async () => {
    const browser = await remote({
        logLevel: 'error',
        path: '/',
        capabilities: {
            browserName: 'firefox'
        }
    });

    await browser.url('http://webdriver.io');

    const title = await browser.getTitle();
    console.log('Title was: ' + title);

    await browser.deleteSession();
})().catch((e) => console.error(e));
```

### Run your test file

Make sure you have at least Node.js v8.11.2 or higher installed. To update your current running Node.js version install [nvm](https://github.com/creationix/nvm) and follow their instructions. Once that is done run the test script by calling:

```sh
$ node test.js
```

this should output the following:

```sh
Title was: WebdriverIO · Next-gen WebDriver test framework for Node.js
```

Yay, Congratulations! You've just run your first automation script with WebdriverIO. Let's step it up a notch and create a real test.

## Let's get serious

*(If you haven't already, navigate back to the project root directory)*

This was just a warm up. Let's move forward and run WebdriverIO with the test runner. If you want to use WebdriverIO in your project for integration testing we recommend to use the test runner because it comes with a lot of useful features that makes your life easier. With WebdriverIO v5 and up the testrunner has moved into the [`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli) NPM package. To get started, we need to install this first:

```sh
$ npm i --save-dev @wdio/cli
```

### Generate Configuration File

To do that just run the configuration utility:

```sh
$ ./node_modules/.bin/wdio config
```

A question interface pops up. It will help to create the config easy and fast. If you are not sure what to answer follow this answers:

__Q: Where should your tests be launched?__  
A: *local_  
<br /> __Q: Shall I install the runner plugin for you?__  
A: _Yes_  
<br /> __Q: Where do you want to execute your tests?__  
A: _On my local machine_  
<br /> __Q: Which framework do you want to use?__  
A: _mocha_  
<br /> __Q: Shall I install the framework adapter for you?__  
A: _Yes* (just press enter)  
<br /> __Q: Do you want to run WebdriverIO commands synchronous or asynchronous?__  
A: *sync* (just press enter, you can also run commands async and handle promises by yourself but for the sake of simplicity let's run them synchronously)  
<br /> __Q: Where are your test specs located?__  
A: *./test/specs/**/*.js* (just press enter)  
<br /> __Q: Which reporter do you want to use?__  
A: *dot* (just press space and enter)  
<br /> __Q: Shall I install the reporter library for you?__  
A: *Yes* (just press enter)  
<br /> __Q: Do you want to add a service to your test setup?__  
A: none (just press enter, let's skip this for simplicity)  
<br /> __Q: Level of logging verbosity:__  
A: *trace* (just press enter)  
<br /> __Q: In which directory should screenshots gets saved if a command fails?__  
A: *./errorShots/* (just press enter)  
<br /> __Q: What is the base url?__  
A: *http://localhost* (just press enter)  


That's it! The configurator now installs all required packages for you and creates a config file with the name `wdio.conf.js`. Next step is to create your first spec file (test file).

### Create Spec Files

For that create a test folder like this:

```sh
$ mkdir -p ./test/specs
```

Now let's create a simple spec file in that new folder:

```js
const assert = require('assert');

describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('http://webdriver.io');
        const title = browser.getTitle();
        assert.equal(title, 'WebdriverIO - WebDriver bindings for Node.js');
    });
});
```

### Kick Off Testrunner

The last step is to execute the test runner. To do so just run:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

Hurray! The test should pass and you can start writing integration tests with WebdriverIO. If you are interested in more in depth video on-boarding tutorials, feel free to check out our very own course called [learn.webdriver.io](https://learn.webdriver.io/?coupon=wdio). Also our community has collected a lot of [boilerplate projects](BoilerplateProjects.md) that can help you to get started.