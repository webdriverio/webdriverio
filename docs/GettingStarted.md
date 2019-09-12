---
id: gettingstarted
title: Getting Started
---

Welcome to the WebdriverIO documentation. It will help you to get started fast. If you run into problems you can find help and answers on our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) or you can hit me on [Twitter](https://twitter.com/webdriverio).

> __Note:__ These are the docs for the latest version (>= v5.0.0) of WebdriverIO. If you are still using v4 or older please use the legacy docs website [v4.webdriver.io](http://v4.webdriver.io)!

The following will give you a short step by step introduction to get your first WebdriverIO script up and running.

## Taking the first step

Let's suppose you have [Node.js](http://nodejs.org/) at least Node.js v8.11.2 or higher installed. If you don't have Node installed, we recommend installing [NVM](https://github.com/creationix/nvm) to assist managing multiple active Node.js versions.

### Setup your project

Before installing dependencies, we need to initialize an empty NPM project (this will allow us to the cli to install needed dependencies to our local project).

To do this, run:

```sh
mkdir webdriverio-test && cd webdriverio-test
npm init -y
```

The `-y` will answer 'yes' to all the prompts, giving us a standard NPM project. Feel free to omit the `-y` if you'd like to specify your own project details.

### Install WebdriverIO CLI

If you want to use WebdriverIO in your project for integration testing we recommend using the test runner because it comes with a lot of useful features that makes your life easier. With WebdriverIO v5 and up, the testrunner has moved into the [`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli) NPM package.

Now we need to install the cli. Do that by running:

```sh
npm i --save-dev @wdio/cli
```

### Generate Configuration File

We'll next want to generate a configuration file that stores all of our WebdriverIO settings. To do that just run the configuration utility:

```sh
./node_modules/@wdio/cli/bin/wdio.js config
```

A question interface pops up. It will help to create the config easy and fast. If you are not sure what to answer follow this answers:

__Q: Where should your tests be launched?__<br>
A: _local_<br>
<br>
__Q: Where is your automation backend located?__<br>
A: _On my local machine_<br>
<br>
__Q: Which framework do you want to use?__<br>
A: _mocha_<br>
<br>
__Q: Do you want to run WebdriverIO commands synchronous or asynchronous?__<br>
A: _sync_ (just press enter, you can also run commands async and handle promises by yourself but for the sake of simplicity let's run them synchronously)<br>
<br>
__Q: Where are your test specs located?__<br>
A: _./test/specs/**/*.js_ (just press enter)<br>
<br>
__Q: Which reporter do you want to use?__<br>
A: _dot_ (just press space and enter)<br>
<br>
__Q: Do you want to add a service to your test setup?__<br>
A: choose either _selenium-standalone_ (if you have JDK installed) or just _chromedriver_<br>
<br>
__Q: What is the base url?__<br>
A: _http://localhost_ (just press enter)<br>

That's it! The configurator now installs all required packages for you and creates a config file with the name `wdio.conf.js`. As we're using Geckodriver, we need to override the default path (which uses the Selenium's default of `/wd/hub`). Then, we'll be ready to create your first spec file (test file).

### Create Spec Files

Now it's time to create our test file. We're going to store all of our files in a new folder. Create the test folder like this:

```sh
mkdir -p ./test/specs
```

Create a new file in that folder (we'll call it `basic.js`):

```sh
touch ./test/specs/basic.js
```

Open that file up and add the following code to it:

```js
const assert = require('assert');

describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('https://webdriver.io');
        const title = browser.getTitle();
        assert.strictEqual(title, 'WebdriverIO · Next-gen WebDriver test framework for Node.js');
    });
});
```

NOTE: if you decided to use _async_ instead of _sync_ mode don't forget to add async/await like this:

```js
const assert = require('assert');

describe('webdriver.io page', () => {
    it('should have the right title', async () => {
        await browser.url('https://webdriver.io');
        const title = await browser.getTitle();
        assert.strictEqual(title, 'WebdriverIO · Next-gen WebDriver test framework for Node.js');
    });
});
```


Once added, save, then return to your terminal.

### Kick Off Testrunner

The last step is to execute the test runner. To do so just run:

```sh
./node_modules/@wdio/cli/bin/wdio.js wdio.conf.js
```

Hurray! The test should pass and you can start writing integration tests with WebdriverIO.

If you ran into any issue, reach out in our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) and post the error you're seeing, plus the step you're currently on.

If you are interested in more in depth video on-boarding tutorials, feel free to check out our very own course called [learn.webdriver.io](https://learn.webdriver.io/?coupon=wdio). Also our community has collected a lot of [boilerplate projects](BoilerplateProjects.md) that can help you to get started.
