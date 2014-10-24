# CHANGELOG

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