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

To install the Selenium Server and Chromedriver (if necessary) separately:

First you must run a selenium standalone server on your machine. You will get the newest
version [here](http://docs.seleniumhq.org/download/). Just download the jar file somewhere on your system.
After that start your terminal and execute the file via

```sh
$ java -jar /your/download/directory/selenium-server-standalone-2.42.2.jar
```

The standalone server comes with some integrated drivers (for Firefox, Opera and Safari) which enhance your
installed browser to get navigated through the server by the JSONWire protocol.

## Setup Chromedriver

[Chromedriver](https://sites.google.com/a/chromium.org/chromedriver/home) is a standalone server which
implements WebDriver's wire protocol for Chromium. It is being developed by members of the Chromium and
WebDriver teams. For running Chrome browser tests on your local machine you need to download ChromeDriver
from the project website and make it available on your machine by setting the PATH to the ChromeDriver
executable.
