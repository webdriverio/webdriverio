name: Visual Regression
category: services
tags: guide
index: 8
title: WebdriverIO - Visual Regression Service
---

Visual Regression Service
=========================

> Visual regression testing with WebdriverIO.

## Installation

wdio-visual-regression-service uses [wdio-screenshot](https://github.com/zinserjan/wdio-screenshot) for capturing screenhots.

You can install wdio-visual-regression-service via NPM as usual:

```sh
$ npm install wdio-visual-regression-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)

An example repository using the wdio-visual-regression service can be found [here.](https://github.com/zinserjan/webdriverio-example)

## Configuration
Setup wdio-visual-regression-service by adding `visual-regression` to the service section of your WebdriverIO config and define your desired comparison strategy in `visualRegression`.

```js
// wdio.conf.js

var path = require('path');
var VisualRegressionCompare = require('wdio-visual-regression-service/compare');

function getScreenshotName(basePath) {
  return function(context) {
    var type = context.type;
    var testName = context.test.title;
    var browserVersion = parseInt(context.browser.version, 10);
    var browserName = context.browser.name;
    var browserWidth = context.meta.width;

    return path.join(basePath, `${testName}_${type}_${browserName}_v${browserVersion}_${browserWidth}.png`);
  };
}

exports.config = {
  // ...
  services: [
    'visual-regression',
  ],
  visualRegression: {
    compare: new VisualRegressionCompare.LocalCompare({
      referenceName: getScreenshotName(path.join(process.cwd(), 'screenshots/reference')),
      screenshotName: getScreenshotName(path.join(process.cwd(), 'screenshots/screen')),
      diffName: getScreenshotName(path.join(process.cwd(), 'screenshots/diff')),
      misMatchTolerance: 0.01,
    }),
    viewportChangePause: 300,
    widths: [320, 480, 640, 1024],
    orientations: ['landscape', 'portrait'],
  },
  // ...
};
```

### Options
Under the key `visualRegression` in your wdio.config.js you can pass a configuration object with the following structure:

* **compare** `Object` <br>
screenshot compare method, see [Compare Methods](#compare-methods)

* **viewportChangePause**  `Number`  ( default: 100 ) <br>
wait x milliseconds after viewport change. It can take a while for the browser to re-paint. This could lead to rendering issues and produces inconsistent results between runs.

* **widths** `Number[]`  ( default: *[current-width]* ) (**desktop only**)<br>
   all screenshots will be taken in different screen widths (e.g. for responsive design tests)

* **orientations** `String[] {landscape, portrait}`  ( default: *[current-orientation]* ) (**mobile only**)<br>
    all screenshots will be taken in different screen orientations (e.g. for responsive design tests)

### Compare Methods
wdio-visual-regression-service allows the usage of different screenshot comparison methods.

#### VisualRegressionCompare.LocalCompare
As it's name suggests *LocalCompare* captures screenshots locally on your computer and compares them against previous runs.

You can pass the following options to it's constructor as object:

* **referenceName** `Function` <br>
pass in a function that returns the filename for the reference screenshot. Function receives a *context* object as first parameter with all relevant information about the command.

* **screenshotName** `Function` <br>
pass in a function that returns the filename for the current screenshot. Function receives a *context* object as first parameter with all relevant information about the command.

* **diffName** `Function` <br>
pass in a function that returns the filename for the diff screenshot. Function receives a *context* object as first parameter with all relevant information about the command.

* **misMatchTolerance** `Number`  ( default: 0.01 ) <br>
number between 0 and 100 that defines the degree of mismatch to consider two images as identical, increasing this value will decrease test coverage.

For an example of generating screenshot filesnames dependent on the current test name, have a look at the sample code of [Configuration](#configuration).

#### VisualRegressionCompare.SaveScreenshot
This method is a stripped variant of `VisualRegressionCompare.LocalCompare` to capture only screenshots. This is quite useful when you just want to create reference screenshots and overwrite the previous one without diffing.

You can pass the following options to it's constructor as object:

* **screenshotName** `Function` <br>
pass in a function that returns the filename for the current screenshot. Function receives a *context* object as first parameter with all relevant information about the command.

## Usage
wdio-visual-regression-service enhances an WebdriverIO instance with the following commands:
* `browser.checkViewport([{options}]);`
* `browser.checkDocument([{options}]);`
* `browser.checkElement(elementSelector, [{options}]);`


All of these provide options that will help you to capture screenshots in different dimensions or to exclude unrelevant parts (e.g. content). The following options are
available:


* **exclude** `String[]|Object[]` (**not yet implemented**)<br>
  exclude frequently changing parts of your screenshot, you can either pass all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html)
  that queries one or multiple elements or you can define x and y values which stretch a rectangle or polygon

* **hide** `String[]`<br>
  hides all elements queried by all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) (via `visibility: hidden`)

* **remove** `String[]`<br>
  removes all elements queried by all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) (via `display: none`)

* **widths** `Number[]` (**desktop only**)<br>
     Overrides the global *widths* value for this command. All screenshots will be taken in different screen widths (e.g. for responsive design tests)

* **orientations** `String[] {landscape, portrait}` (**mobile only**)<br>
    Overrides the global *orientations* value for this command. All screenshots will be taken in different screen orientations (e.g. for responsive design tests)

* **misMatchTolerance** `Number` <br>
    Overrides the global *misMatchTolerance* value for this command. Pass in a number between 0 and 100 that defines the degree of mismatch to consider two images as identical,

* **viewportChangePause**  `Number` <br>
    Overrides the global *viewportChangePause* value for this command. Wait x milliseconds after viewport change.

### License

MIT
