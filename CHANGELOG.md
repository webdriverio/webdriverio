# CHANGELOG

## v4.12.0 (2018-03-07)
* global changes:
    * docs improvements
    * allow to set `proxy` and `agent` request options
* wdio changes:
    * support for files with `.es6` ending

## v4.11.0 (2018-02-27)
* global changes:
    * docs improvements
    * Add new selector strategies from WebdriverAgent (#2613)
* bugfixes:
    * isVisibleWithinViewport check fix if element is not existing (#2593)
    * propagate `process.execArgv` correctly
* wdio changes:
    * increase framework timeout if `--inspect` parameter is found in execArgv

## v4.10.2 (2018-02-02)
* global changes:
    * docs improvements
* bugfixes:
    * better unknown command detection (#2580)

## v4.10.1 (2018-01-12)
* bugfixes:
    * fallback to old JSONWireProtocol commands when running Chromedriver

## v4.10.0 (2018-01-10)
* bugfixes:
    * Fix for error handling on before/after hooks (#2497)
    * fix debug functionality when using launcher programmatically (#2492)
    * Fix issue when terminal doesn't support colors (#2496)
* global changes:
    * docs improvements
    * fallbacks for depcrecated JsonWireProtocol commands (#2493)
* wdio changes:
    * Add ability to specify a spec and suite (#2505)
    * Add support for filtering specs #2520

## v4.9.11 (2017-11-29)
* bugfixes:
    * better handling of failures in before hooks placed before any describe block (#2259)
    * fix waitForVisible handling (#2486)
* docs:
    * add Mochawesome reporter

## v4.9.10 (2017-11-27)
* bugfixes:
    * fix launcher run by node script as child process (#2477)
    * check status code for WebDriver responses
    * allow usage of element as 1st citizen for getHTML and isVisibleWithinViewport
* global changes:
    * docs improvements (#2472)

## v4.9.9 (2017-11-20)
* bugfixes:
    * fix touchId command (#2455)
    * enable support for both --inspect and --debug (#2418)
* global changes:
    * docs improvements (#2452, #2449, #2440)

## v4.9.8 (2017-11-13)
* bugfixes:
    * add missing babel-runtime dependency

## v4.9.7 (2017-11-13)
* bugfixes:
    * polyfill Array.includes to support Node v4
* global changes:
    * add "try it out" button to example code on main page

## v4.9.6 (2017-11-10)
* bugfixes:
    * don't clone objects in config (#2428)

## v4.9.5 (2017-11-09)
* bugfixes:
    * Use https Agent when protocol is https (#2424)
    * revert change on Android selector (#2422)

## v4.9.4 (2017-11-09)
* global changes:
    * better fallback handling of unknown commands

## v4.9.3 (2017-11-09)
* global changes:
    * added fallback to keys command to use W3C WebDriver action API if command not known

## v4.9.0 (2017-11-08)
* global changes:
    * W3C WebDriver compatibility improvements (#2039, #2364)
    * docs improvements (#2055, #2062, #2070, #2078, #2095, #2096, #2100, #2101, #2116, #2121, #2135, #2151, #2132, #2148, #2163, #2193, #2196, #2142, #2217, #2237, #2222, #2263, #2268, #2269, #2270, #2271, #2276, #2277, #2278, #2282, #2284, #2285, #2288, #2290, #2292, #2296, #2309, #2304, #2306. #2323, #2324, #2336, #2340, #2341, #2342, #2347, #2353, #2354, #2355, #2356, #2374, #2376, #2378, #2395, #2396, #2405)
    * examples improvements (#2086, #2089, #2162, #2183, #2184, #2402)
    * depcrecation warnings more meaningful and defeatable (#2061)
    * enhanced details on errors (#2229, #2247, #2283)
    * allow setting custom headers for WebDriver requests (#2258)
    * keep connections alive (#2327)
* wdio changes:
    * Performance improvements (#2043)
    * Allow to pipe files into the wdio command (#2098)
* bugfixes:
    * fix handling of cucumber tags when given through CLI (#2049)
    * better handling of text in options when selecting (#2057)
    * better support for Android selectors (#2161)
    * allow comments in functions passed to execute/executeAsync (#2207)
    * fix merge capabilities when using launcher (#2109)
* mobile:
    * add `appWaitPackage` and `appWaitActivity` parameters to `startActivity` command (#2214)

## v4.8.0 (2017-04-30)
* global changes:
    * docs improvements (#2006, #2001, #2010, #2011, #2013, #2016, #2017, #2032)
    * make API compliant to [Webdriver candidate recommendation](https://www.w3.org/TR/2017/CR-webdriver-20170330/)
    * bug fixes (#2024)
    * make url act like url.resolve (#1946)
    * more generic error when failing to connect to Selenium server
    * add deprecation warnings to all commands that aren't part of the Webdriver spec and will be removed with the next major version update

## v4.7.1 (2017-04-21)
* global changes:
    * fix bug where isExisting fails when calling it on a lazy loaded element (#2003)

## v4.7.0 (2017-04-20)
* global changes:
    * added [Code of Conduct](https://github.com/webdriverio/webdriverio/blob/master/CONDUCT.md)
    * bugfixes (#1855, #1869, #1931)
    * docs improvements (#1979, #1977, #1905, #1975, #1971, #1972, #1952, #1952, #1948, #1943, #1905, #1940, #1936, #1934, #1930, #1920, #1926, #1919, #1916, #1915, #1904, #1899, #1897, #1887, #1889, #1876, #1850, #1845)
    * better error messages when element was not found (#1862)
    * added timestamp to getCommandHistory results (#1873)
    * added toggleTouchIdEnrollment command (#1951)
    * don't trim string results anymore (#1885)
    * (internal) replaced grunt task runner with npm scripts
    * (internal) updated all dependencies
* wdio changes:
    * added the ability to send your own events for runner's reporters (#1893)
    * resolved memory leak in reporter - thanks @jankcat 👏 (#1993)
    * make session hooks to respect promises (#1958)
    * exit launcher when no spec was found (#1998)

## v4.6.2 (2017-01-24)
* global changes:
    * docs improvements
    * update dependencies

## v4.6.1 (2017-01-05)
* wdio changes:
    * fixed wording for log in watch mode
    * added more supported services to cli

## v4.6.0 (2017-01-05)
* global changes:
    * docs improvements
    * bug fixes
* wdio changes:
    * add watch mode (accessible via `--watch` argument) to wdio testrunner

## v4.5.2 (2016-12-22)
* global changes:
    * docs improvements
    * minor improvements to REPL interface
* wdio changes:
    * bugfixes (#1460)

## v4.5.1 (2016-12-19)
* global changes:
    * bug fixes
    * docs improvements

## v4.5.0 (2016-12-12)
* global changes:
    * bugfixes (standalone & wdio testrunner)
    * docs improvements
    * fix `removeApp` command
    * introduce [REPL interface](https://twitter.com/webdriverio/status/806911722682544128)
* wdio changes:
    * enable `--reporters` cli parameter
    * improved Mocha timeout error messages
    * introduce beforeSession / afterSession hooks
    * identify tests by uid and not just by title (fixes couple of bug reports) - thx @wvankuipers

## v4.4.0 (2016-11-08)
* global changes / WDIO changes:
    * introduced `$` and `$$` API commands as shortcuts to fetch elements

## v4.3.0 (2016-11-02)
* global changes:
    * docs improvements (removed all async examples, wdio ftw!)
* global changes:
    * fixed stale element reference error in standalone (#1614) - thx @Templum
    * improved stale element catch - now works after reusing elements after reloading the page
    * removed compatibility checks for mobile commands (#1633)
    * run Sauce Labs test over secured SSL connection only
    * bug fixes (#1628, #1649, #1344, #1670)
    * add `touchAction` command for easier touch actions with Appium
* WDIO changes:
    * improved mechanism of killing child processes when ctrl+c was triggered

## v4.2.16 (2016-09-16)
* global changes:
    * docs improvements
* WDIO changes:
    * display proper selector in waitForXXX error messages (#1596)

## v4.2.15 (2016-09-13)
* fixed broken chaining behavior

## v4.2.14 (2016-09-13)
* WDIO changes:
    * enhanced payload of start and end event

## v4.2.13 (2016-09-13)
* global changes:
    * bugfix (#1589)

## v4.2.12 (2016-09-09)
* global changes:
    * docs improvements
    * selector improvements
* WDIO changes:
    * allow multiple files in spec cli argument (#1579)

## v4.2.11 (2016-08-31)
* fixed broken v4.2.10

## v4.2.10 (2016-08-31)
* global changes:
    * keep command files in package to be able to generate docs

## v4.2.9 (2016-08-31)
* global changes:
    * docs improvements
    * bug fixes
* WDIO changes:
    * Split hooks into their own collection instead of grouping with tests (#1561)

## v4.2.8 (2016-08-23)
* global changes:
    * allow to specify selector strategies directly when using the format:
      "<selector strategy>:<selector>"

## v4.2.7 (2016-08-17)
* fixes broken v4.2.6

## v4.2.6 (2016-08-17)
* global changes:
    * restrict files uploaded to NPM
    * added screenshot event to internal events

## v4.2.5 (2016-08-11)
* WDIO changes
    * allow spec as wdio argument

## v4.2.4 (2016-08-11)
* global changes:
    * docs improvements
    * updated request package dependency
    * fixed moveTo bug always sitting at (0, 0)
    * improved screenshot capturing after command errors
    * id selector regex fix
* multiremote:
    * ensure onComplete to run after test

## v4.2.2 (2016-07-12)
* global changes:
    * updated dependencies
    * make sure waitUntil conditions get executed at least once
    * implemented first polyfills for safaridriver interaction API
    * fixed refresh/reload renaming bugs (#1445, #1446)
* WDIO changes:
    * allow to run single specs using `--spec` cli argument
    * throw an error if suite was not found

## v4.2.1 (2016-07-09)
* global changes:
    * docs improvements
* WDIO changes:
    * fixed bug in reporting

## v4.2.0 (2016-07-08)
* global changes
    * docs improvements
    * better autocompletion with WebStorm IDE (#1399)
    * added snyk dependency check
* WDIO changes:
    * fixed config wizard (#1428)
    * improve reporting of failed tests (#1361)
    * allow launcher services to overwrite host/config (#1421)
* API changes:
    * added new command `reload` to clear browser session
* multiremote:
    * fixed bug that spawned additional instance (#1434)

## v4.1.1 (2016-06-24)
* WDIO changes:
    * expose the process number to the child processes
    * improved waitForXXX usage when used with element as first citizen

## v4.1.0 (2016-06-22)
* global changes:
    * several bug fixes and documentation improvements
    * new command: hasFocus (#1369)
    * waitUntil improvements
    * don't fail if element command can't find element

* WDIO changes:
    * allow to specify multiple suites at once

## v4.0.9 (2016-05-26)
* WDIO changes:
    * enabled debugging by passing argv to child process (thanks @kurtharriger #1345)

## v4.0.8 (2016-05-25)
* global changes:
    * introduced new error type for waitForXXX timeouts (#1281)
    * doc improvements (wording/content)
    * don't set firefox as default browser if mobile capabilities are detected
    * add offset coords to left/middle/rightclick (#1335)
* WDIO changes:
    * export Launcher API to Webdriver object (#1311)

## v4.0.6 (2016-05-04)
* global changes:
    * docs improvements
    * removed shrinkwrap file

* WDIO changes:
    * fixed bug where onPrepare was called twice and onComplete none (#1197)
    * allow to set services without having them on NPM (#1198)
    * enable custom command chaining (#1218)
    * fixed waitForXXX commands not able to interpret reverse argument (#1209)
    * better support for element as first citizen
    * allow modification of capabilities through services
    * fixed `Unrecognised test [XXX] for suite [YYY]` issue (#1195)
    * better support for log file names in windows (#1226)
    * added testingbot service to cli configurator (#1263)
    * fixed bug where applying user and key as cli argument didn't work (#1264)

## v4.0.5 (2016-03-23)
* global changes:
    * added class name selector for ios and android
    * docs improvements

* multiremote:
    * fixed capability issue (#1220)
    * added helper method `getInstances` to get instance names

## v4.0.4 (2016-02-03)
* global changes:
    * minimum required node version: v0.12.x
    * complete code rewrite into ES2016 conform JavaScript (compiled using Babel)
    * moved 3rd party integrations (reporters, services, framework) into own NPM packages
    * introduced concept of services for the WDIO testrunner (e.g. [wdio-sauce-service](https://github.com/webdriverio/wdio-sauce-service))
    * commands in WDIO are getting executed in a synchronous way using [Fibers](https://www.npmjs.com/package/fibers)
    * added [Grunt](http://gruntjs.com/) as project task manager

* WDIO changes:
    * retry mechanism for failing requests to the Selenium server as well as for [stale element reference](https://w3c.github.io/webdriver/webdriver-spec.html#dfn-error-code) errors
    * commands are running synchronous (can be disabled by setting `sync: false` in wdio.conf.js)
    * better support for [page objects](https://github.com/webdriverio/webdriverio/tree/master/examples/pageobject) with WebdriverIO
    * runs multiple specs per capability at a time (in v3 it was one spec per capability)
    * elements can now be treated as first citizen (no need for selector parameter if element(s) command) was called before
    * limit number of running instances with `maxInstances`
    * no support for callbacks in commands anymore (as last parameter)
    * no support generators anymore (commands are sync anyway through [Fibers](https://www.npmjs.com/package/fibers))
    * added new hooks: beforeSuite, beforeHook, beforeTest, beforeCommand, afterCommand, afterTest, afterHook, afterSuite, onError and beforeFeature, beforeScenario, beforeStep, afterFeature, afterScenario, afterStep (Cucumber framework only)
    * implemented small API for launcher package for better integration in 3rd party packages like grunt/gulp-webdriver
    * new Allure reporter: [wdio-allure-reporter](https://github.com/webdriverio/wdio-allure-reporter), no spec reporter anymore (but in the making: [wdio-spec-reporter](https://github.com/webdriverio/wdio-spec-reporter))
    * TypeScript support (#1060)

* mobile changes:
    * added uiautomator/uiautomation and accessibility id location strategy
    * update [Appium](http://appium.io/) commands for mobile testing

* API changes:
    * added `waitUntil` interval option (#844)
    * added `getUrl` command (#877)
    * better support for unicode characters in setValue/addValue/keys
    * several improvements and bugfixes
    * added `getGridNodeDetails`, `gridProxyDetails` and `gridTestSession` to get information about the Selenium grid and their nodes
    * added `selectByAttribute` to select options by any attribute field

* Multibrowser changes:
    * modified then arguments from having one argument per browser to having one argument as an object with browser names and their results as properties

## v3.4.0 (2015-12-23)
* documentation improvements (#910, #925, #939, #947, #949, #943, #964, #966)
* added selectByName command (#917)
* bugfix: emit test:end in jasmine (#918)

## v3.3.0 (2015-11-24)
* added Unicode support (#850)
* enable passing cli args to runner processes (#851)
* docs improvements (#854, #853, #861, #871)
* elminate Seleniums staleElement errors (#857)
* fixed screenshot file names for Windows user (#868)
* added new command `getUrl` (#877)
* fixed isVisibleWithinViewport helper (#885, #886, #887)
* update Sauce Labs job even when using Sauce Connect (#881)
* fixed switchTab command (#898)

## v3.2.6 (2015-10-31)
* expose sessionId and capabilities to after() hook
* Adds a configuration: option.waitforInterval and a parameter to waitUntil for setting the polling interval for waitUntil.
* support for mocha's 'qunit' interface

## v3.2.5 (2015-10-07)
* make sure edge driver follows standards for querying elements (#762)
* fixed xunit reporter bug (#797, #801)
* fixed indention bug in spec reporter (#800)
* Preserve mocha `this` in testrunner-wrapped generators (#813)
* better Babel support (##816)

## v3.2.4 (2015-09-16)
* bugfixes in xunit reporter
* removed undefined first argument in after hook
* improved error handling in waitFor commands

## v3.2.3 (2015-09-11)
* some minor bugfixes

## v3.2.2 (2015-09-09)
* fixed bug where cli args didn't overwrite config properties
* fixed bug where browser extensions throw E2BIG error
* allow test files with .coffee extension
* better error message if command gets executed w/o session id
* allow usage of custom reporter

## v3.2.1 (2015-09-01)
* command response with null value will be logged again (#738)
* added documentation
* support w3c webdriver draft keys (#744)
* enable multiremote test in wdio test runner (#741)
* kill Selenium session properly when canceling the wdio process (#746)

## v3.2.0 (2015-08-25)
* improved error handling (no error propagation) (#629)
* wdio test runner cli improvements (#704)
* added protocol bindings for contexts (#703)
* make selenium path customizable (#690)
* enable compilers and require in Mocha framework (#660)
* new command `getCommandHistory` (#618)
* allow to ignore undefined steps (#635)
* bugfixes (#631, #637, #669, #684, #699)

## v3.1.0 (2015-07-11)
* better error messages if waitForXXX commands fail
* improved error handling
* set default logging prefs
* allow to intercept jasmine assertions
* check logging types before requesting logs
* minor bugfixes and doc improvements

## v3.0.5 (2015-07-07)
* mocha framework: allow inclusive and exclusive tests

## v3.0.4 (2015-07-07)
* fixed bug where feature files got filtered out in config parser

## v3.0.3 (2015-07-06)
* show also title of pending test (refs #606)

## v3.0.2 (2015-07-06)
* if specFn is undefined we are dealing with a pending function (fixes #606)

## v3.0.1 (2015-07-04)
* lowercase framework string (fixes #601)
* make v3 work with PhantomJS < 2.0 (fixes #594)

## v3.0.0 (2015-06-29)
* rewritten WebdriverIO core to a Monad
* removed ChainIt dependency
* implemented test runner with different reporter and support for Mocha, Jasmine and Cucumber
* added multiremote feature to control multiple instances at the same time
* enable selector chaining
* removed waitFor command (please replace it with waitForExist as it works the same way)
* new commands: [debug](http://webdriver.io/api/utility/debug.html)

## v2.4.5 (2015-01-30)
* return promise result if responseMethod is not a function (see #401)

## v2.4.4 (2015-01-24)
* make PromiseHandler to handle Q promises (see #399)

## v2.4.3 (2015-01-10)
* `saveScreenshot` doesn't require a file path anymore if only the base64 data is required (see #393)
* don't throw an error if error handler is registered (see #385)

## v2.4.2 (2015-01-07)
* fixed bug in PromiseHandler when execute command just got a single function parameter (closes #383)
* make colored logs optional (closes #298)

## v2.4.1 (2014-12-28)
* fixed bug in `selectByValue` and `selectByVisibleText` in which the absolute xPath queried value/text of different select element
* allow more xpath expressions

## v2.4.0 (2014-12-05)
* support for promises A+ (yeah!)
* introduced `waitforTimeout` option so set default timout time for all waitForXXX commands (see #345)
* let selectByValue accept number values (see #369)

## v2.3.0 (2014-10-24)
* added selectByIndex, selectByValue and selectByVisibleText for super easy selecting of options in select elements

## v2.2.3 (2014-09-18)
* support for all selector strategies in getHTML command (closes #302)

## v2.2.2 (2014-09-15)
* consider parent elements in waitForVisible command (closes #293)
* added library User-Agent string to header for statistical reporting (closes #296)
* updated examples

## v2.2.1 (2014-09-05)
* fixed bug in isVisible helper, thanks @fufnf

## v2.2.0 (2014-09-01)
* new commands:
    - [elementIdElement](http://webdriver.io/api/protocol/elementIdElement.html)
    - [elementIdElements](http://webdriver.io/api/protocol/elementIdElements.html)
    - [selectorExecute](http://webdriver.io/api/action/selectorExecute.html)
    - [selectorExecuteAsync](http://webdriver.io/api/action/selectorExecuteAsync.html)
    - [setViewportSize](http://webdriver.io/api/window/setViewportSize.html)
    - [getViewportSize](http://webdriver.io/api/window/getViewportSize.html)
* improved waitfor commands - now with support if all selector strategries (thanks to selectorExecuteAsync and @nickyout)

## v2.1.2 (2014-08-22)
* Fix: log command expecting an object and not a string
* skip close test (still to flaky)

## v2.1.1 (2014-08-20)
* took saveScreenshot functionality back to basic
* removed gm dependency since it causes too many errors when installing

## v2.1.0 (2014-08-11)
* new commands:
    - [isEnabled](http://webdriver.io/api/state/isEnabled.html)
    - [elementIdEnabled](http://webdriver.io/api/protocol/elementIdEnabled.html)
* make ErrorHandler easy accessible

## v2.0.1 (2014-08-10)
* renamed project lib constructor
* fixed isMobile detection in `chooseFile` command

## v2.0.0 (2014-08-10)
* initial release (for older releases check out the [WebdriverJS changelog](https://github.com/webdriverio/webdriverio/blob/webdriverjs/CHANGELOG.md))
