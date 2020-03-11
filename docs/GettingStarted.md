---
id: gettingstarted
title: Getting Started
---

Welcome to the WebdriverIO documentation. It will help you to get started fast. If you run into problems, you can find help and answers on our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) or you can hit me on [Twitter](https://twitter.com/webdriverio).

> __Note:__ These are the docs for the latest version (>=5.x) of WebdriverIO. If you are still using v4 or older, please [use the legacy docs website](http://v4.webdriver.io)!

The following short step-by-step introduction will help you get your first WebdriverIO script up and running.

## Taking the first step

You’ll need [Node.js](http://nodejs.org) installed.

- Install at least v10.13.0 or higher as this is the oldest active LTS version
- Only releases that are or will become an LTS release are officially supported

If you don't have Node installed, we recommend installing [NVM](https://github.com/creationix/nvm) to assist managing multiple active Node.js versions.

### Setup your project

Before installing dependencies, you’ll need to initialize a new NPM project. This will allow you to use the CLI to install dependencies in your project.

To do this, run:

```sh
mkdir webdriverio-test && cd webdriverio-test
npm init -y
```

The `-y` will answer 'yes' to all the prompts, giving you a standard NPM project. Feel free to omit the `-y` if you'd like to specify your own project details.

### Install WebdriverIO CLI

If you want to use WebdriverIO in your project for integration testing, we recommend using the test runner. It comes with lots of useful features that makes your life easier.

Since WebdriverIO version 5, the testrunner is in the [`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli) NPM package.

Now, install the CLI:

```sh
npm i --save-dev @wdio/cli
```

### Generate Configuration File

Next, you’ll generate a configuration file to store your WebdriverIO settings.

To do that, just run the configuration utility:

```sh
./node_modules/.bin/wdio config -y
```
In Windows, you may have to escape the dot in ".bin" by running this instead:

```sh
."/node_modules/.bin/wdio" config -y
```

That's it! The configurator will install all required packages for you and create a config file called `wdio.conf.js`.

### Create Spec Files

Now it's time to create your test file. You’re going to store all of your test files in a new folder.

Create the test folder like this:

```sh
mkdir -p ./test/specs
```

Windows:

```sh
mkdir .\test\specs
```

Create a new file in that folder (we'll call it `basic.js`):

```sh
touch ./test/specs/basic.js
```

On Windows, `touch` will not work so you can simply go to the folder and create a plain text file and name is as 'basic.js'

Open that file, and write the following code in it:

```js
const assert = require('assert')

describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('https://webdriver.io')
        const title = browser.getTitle()
        assert.strictEqual(title, 'WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})
```

**NOTE:** If you decided to use _async_ instead of _sync_ mode, don't forget to add `async`/`await` keywords, like this:

```js
const assert = require('assert')

describe('webdriver.io page', () => {
    it('should have the right title', async () => {
        await browser.url('https://webdriver.io')
        const title = await browser.getTitle()
        assert.strictEqual(title, 'WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})
```


Now save the file and return to your terminal.

### Start the Testrunner

Now, time to run your tests!

To do so, just run:

```sh
./node_modules/.bin/wdio wdio.conf.js
```
Windows:

```sh
."/node_modules/.bin/wdio" wdio.conf.js
```

Hurray! The test should pass, and you can start writing integration tests with WebdriverIO.

If you ran into any issues, reach out in our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) and post the error you're seeing, and which of the above steps you’re stuck on.

If you are interested in more in depth video on-boarding tutorials, feel free to check out our very own course called [learn.webdriver.io](https://learn.webdriver.io/?coupon=wdio).

Our community has also collected a lot of [boilerplate projects](BoilerplateProjects.md) that may help you to get started.
