---
id: gettingstarted
title: Getting Started
---

Welcome to the WebdriverIO documentation. It will help you to get started fast. If you run into problems, you can find help and answers on our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) or you can hit me on [Twitter](https://twitter.com/webdriverio).

> __Note:__ These are the docs for the latest version (>=6.x) of WebdriverIO. If you are still using an older version, please visit the [old documentation websites](versions.html)!

The following short step-by-step introduction will help you get your first WebdriverIO script up and running:

<iframe width="660" height="440" src="https://www.youtube.com/embed/gaTPBkg4WEI" frameborder="0" allowfullscreen></iframe>

## Taking the first step

You’ll need [Node.js](http://nodejs.org) installed.

- Install at least v12.16.1 or higher as this is the oldest active LTS version
- Only releases that are or will become an LTS release are officially supported

If you don't have Node installed, we recommend installing [NVM](https://github.com/creationix/nvm) to assist managing multiple active Node.js versions.

### Setup your project

Before installing dependencies, you’ll need to initialize a new NPM project. This will allow you to use the CLI to install dependencies in your project.

To do this, run:

```sh
$ mkdir webdriverio-test && cd webdriverio-test
$ npm init -y
```

The `-y` will answer 'yes' to all the prompts, giving you a standard NPM project. Feel free to omit the `-y` if you'd like to specify your own project details.

### Install WebdriverIO CLI

If you want to use WebdriverIO in your project for integration testing, we recommend using the test runner. It comes with lots of useful features that makes your life easier.

Since WebdriverIO version 5, the testrunner is in the [`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli) NPM package.

Now, install the CLI:

```sh
$ npm i --save-dev @wdio/cli
```

### Generate Configuration File

Next, you’ll generate a configuration file to store your WebdriverIO settings.

To do that, just run the configuration utility:

```sh
$ npx wdio config -y
```

That's it! The configurator will install all required packages for you and create a config file called `wdio.conf.js`.

### Create Spec Files

Now it's time to create your test file. You’re going to store all of your test files in a new folder.

Create the test folder like this:

<!--DOCUSAURUS_CODE_TABS-->
<!--Linux/Mac-->
```sh
$ mkdir -p ./test/specs
```

<!--Windows-->
```sh
$ mkdir .\test\specs
```
<!--END_DOCUSAURUS_CODE_TABS-->

Create a new file in that folder (we'll call it `basic.js`):

```sh
$ touch ./test/specs/basic.js
```

On Windows, `touch` will not work so you can simply go to the folder and create a plain text file and name is as 'basic.js'

Open that file, and write the following code in it:

<!--DOCUSAURUS_CODE_TABS-->
<!--Sync Mode-->
```js
describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('https://webdriver.io')
        expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js');
    })
})
```
<!--Async Mode-->
```js
describe('webdriver.io page', () => {
    it('should have the right title', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js');
    })
})
```
<!--END_DOCUSAURUS_CODE_TABS-->

Now save the file and return to your terminal. Learn more about [the differences between Sync and Async Mode](sync-vs-async.html).

### Start the Testrunner

Now, time to run your tests!

To do so, just run:

```sh
$ npx wdio wdio.conf.js
```

Hurray! The test should pass, and you can start writing integration tests with WebdriverIO.

If you ran into any issues, reach out in our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) and post the error you're seeing, and which of the above steps you’re stuck on.

If you are interested in more in depth video on-boarding tutorials, feel free to check out our very own course called [learn.webdriver.io](https://learn.webdriver.io/?coupon=wdio).

Our community has also collected a lot of [boilerplate projects](BoilerplateProjects.md) that may help you to get started.
