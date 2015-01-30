# CHANGELOG

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