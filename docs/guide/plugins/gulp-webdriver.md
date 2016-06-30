name: Gulp
category: plugins
tags: guide
index: 0
title: WebdriverIO - gulp-webdriver
---

gulp-webdriver
==============

`gulp-webdriver` is a [gulp plugin](http://gulpjs.com/) to run selenium tests with the [WebdriverIO](http://webdriver.io) testrunner.

## Install

```shell
npm install gulp-webdriver --save-dev
```

## Usage

You can run WebdriverIO locally running this simple task:

```js
gulp.task('test:e2e', function() {
    return gulp.src('wdio.conf.js').pipe(webdriver());
});
```

gulp-webdriver makes the wdio testrunner easy accessible and allows you to run multiple config files
sequentially. If desired you can pass additional arguments to the wdio command to specify your test.
You can find all available options [here](http://webdriver.io/guide/testrunner/gettingstarted.html)
or by executing `$ wdio --help` (if you have WebdriverIO installed globally).

```js
gulp.task('test:e2e', function() {
    return gulp.src('wdio.conf.js').pipe(webdriver({
        logLevel: 'verbose',
        waitforTimeout: 10000
    }));
});
```
