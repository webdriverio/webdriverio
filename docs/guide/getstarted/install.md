name: install
category: getstarted
tags: guide
index: 0
title: WebdriverIO - Install
---

# Install

You will need to have [Node.js](http://nodejs.org/) and [NPM](https://www.npmjs.org/) installed on your machine. Check out their project websites for more instructions. If you want to have WebdriverIO integrated into your test suite, then install it locally with:

```sh
$ npm install webdriverio --save-dev
```

The test runner is called `wdio` and should be available after the install was successful:

```sh
$ ./node_modules/.bin/wdio --help
```

You can also install the package globally on your machine and use the `wdio` directly from the command line. However it is recommended to install it per project.

## Set up your Selenium environment

There are two ways of setting up your Selenium environment: as a standalone package or by installing the
server and browser driver separately.

### Use of existing standalone package

The simplest way to get started is to use one of the NPM selenium standalone
packages like: [vvo/selenium-standalone](https://github.com/vvo/selenium-standalone). After installing
it (globally) you can run your server by executing:

```sh
$  selenium-standalone start
```

If you are using the wdio testrunner you might be interested in the [Selenium Standalone Service](/guide/services/selenium-standalone.html) that starts the server for you everytime before the test starts.

You can also run the selenium server separately from your test setup. To do so you need to get the newest version of the selenium standalone server [here](http://docs.seleniumhq.org/download/). Just download the jar file somewhere on your system. After that start your terminal and execute the file via

```sh
$ java -jar /your/download/directory/selenium-server-standalone-3.5.3.jar
```

With the latest version of Selenium most of the drivers for the browser come with an external driver that has to be downloaded and setup.

## Setup Chrome

The [Chromedriver](https://sites.google.com/a/chromium.org/chromedriver/home) is a standalone server which implements WebDriver's wire protocol for Chromium. It is being developed by members of the Chromium and WebDriver team. For running Chrome browser tests on your local machine you need to download ChromeDriver from the project website and make it available on your machine by setting the `PATH` to the ChromeDriver executable.

Alternatively, if you have a Mac and have homebrew installed, you could just type `brew cask install chromedriver` into your terminal.

## Setup Firefox

The same applies for Firefox. It is driven by the GeckoDriver that translates calls into the [Marionette](https://developer.mozilla.org/en-US/docs/Mozilla/QA/Marionette) automation protocol. To run tests on Firefox with Selenium standalone server v3 or newer you also need to download the latest driver [here](https://github.com/mozilla/geckodriver/releases) and make it available in the `PATH` of your machine.
