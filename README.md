![WebdriverIO](http://www.christian-bromann.com/wdio.png)
WebdriverIO
===========

[![Build Status](https://travis-ci.org/webdriverio/webdriverio.svg?branch=master)](https://travis-ci.org/webdriverio/webdriverio) [![NPM version](https://badge.fury.io/js/webdriverio.svg)](http://badge.fury.io/js/webdriverio) [![Dependency Status](https://www.versioneye.com/user/projects/58932ea4b166b50039982a32/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/58932ea4b166b50039982a32) [![npm](https://img.shields.io/npm/dm/webdriverio.svg?maxAge=2592000)]() [![Coveralls](https://img.shields.io/coveralls/webdriverio/webdriverio/master.svg?maxAge=2592000)]() [![Gitter](https://badges.gitter.im/webdriverio/webdriverio.svg)](https://gitter.im/webdriverio/webdriverio?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
<br><br>
[![Selenium Test Status](https://saucelabs.com/browser-matrix/webdriverio.svg)](https://saucelabs.com/u/webdriverio)

***

#### [Homepage](http://webdriver.io) | [Developer Guide](http://webdriver.io/guide.html) | [API Reference](http://webdriver.io/api.html) | [Contribute](http://webdriver.io/contribute.html)

This library is a [Webdriver](https://w3c.github.io/webdriver/webdriver-spec.html)
(browser automation) module for Node.JS. It makes it possible to write
super easy [Selenium](https://en.wikipedia.org/wiki/Selenium_(software)) tests in your favorite
BDD/TDD test framework, that will run locally or in the cloud using Sauce Labs, BrowserStack or TestingBot.

WebdriverIO is agnostic with regards to the test framework you want to use. Cucumber, Jasmine and Mocha+Chai
are supported by the configuration wizard.

## Installation

```shell
npm install webdriverio
```

or if you want to use the wdio test runner

```shell
npm install -g webdriverio
```

## Getting started

Simply run `wdio config` and the configuration helper wizard will get you set up:

![wdio wizard](http://webdriver.io/images/config-utility.gif)

With all that done, have a look at the many [examples](examples/).

## Plugins

[![Grunt Integration](http://webdriver.io/images/plugins/grunt.png)](https://github.com/webdriverio/grunt-webdriver)
[![Gulp Integration](http://webdriver.io/images/plugins/gulp.png)](https://github.com/webdriverio/gulp-webdriver)
[![Sublime Text Plugin](http://webdriver.io/images/plugins/sublime.png)](https://packagecontrol.io/packages/WebdriverIO)
[![Atom.io Plugin](http://webdriver.io/images/plugins/atom.png)](https://atom.io/packages/webdriverio-snippets)
[![Visual Regression Testing with Applitools Eyes](http://webdriver.io/images/plugins/applitools.png)](https://github.com/webdriverio/webdrivercss#applitools-eyes-support)
[![WebRTC Analytics Plugin](http://webdriver.io/images/plugins/webrtc.png)](https://github.com/webdriverio/webdriverrtc)

## Syntax example

```js
browser.url('http://google.com');
$('#q').setValue('webdriver');
$('#btnG').click();
```

Notice how this is far simpler than with the original [selenium-webdriverjs](https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs),

```js
driver.get('http://www.google.com');
driver.findElement(webdriver.By.id('q')).sendKeys('webdriver');
driver.findElement(webdriver.By.id('btnG')).click();
```

and significantly simpler than with [WD.js](https://github.com/admc/wd):

```js
browser
  .get("http://www.google.com")
  .elementById('q')
  .sendKeys('webdriver')
  .elementById('btnG')
  .click()
```

For more details on the comparison between WebdriverIO, selenium-webdriverjs and WD.js,
read [this discussion](https://github.com/webdriverio/webdriverio/issues/138). Also see more WebdriverIO examples in the [example folder](https://github.com/webdriverio/webdriverio/tree/master/examples).

## Need help?

If you have questions or any problems using WebdriverIO join the [Gitter Chat](https://gitter.im/webdriverio/webdriverio), hit us contributor on
Twitter or just file an [issue](https://github.com/webdriverio/webdriverio/issues) on Github. We will try to get back to you as soon as possible.

Also if you miss any feature, let us know so we can make WebdriverIO even better. For news or
announcements check [@WebdriverIO](http://twitter.com/webdriverio) on Twitter.


## NPM Maintainers

The [npm module](https://www.npmjs.com/package/webdriverio) for this library is maintained by:

* [Christian Bromann](https://github.com/christian-bromann)
* [George Crawford](https://github.com/georgecrawford)
* [Vincent Voyer](https://github.com/vvo)
* [Camilo Tapia](http://github.com/Camme)

## History

WebdriverIO was originated by [Camilo Tapia's](https://github.com/camme) initial
Selenium project called WebdriverJS, which was the first webdriver project on NPM.
In 2014, the project was renamed WebdriverIO later on.


### License

MIT
