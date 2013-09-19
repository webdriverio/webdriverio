# CHANGELOG

## v0.7.13 (2013-09-19)
* simplified remote connection establishment
* added documentation for using webdriverjs with TestingBot
* command `getAttribute` returns unfiltered value from browser-driver

## v0.7.12 (2013-09-06)
* improved `setValue` and `addValue` command
* enables proper use of modifier keys
* added tests using modifier keys
* execute travis tests with Sauce Labs, added badge README.md 

## v0.7.11 (2013-08-31)
* includes PR #82 - Fixed a wrong name on a local variable reference
* added CONTRIBUTING.md
* rewrote some parts in README.md

## v0.7.10 (2013-08-27)
* added support for selenium-server-standalonver > v2.31.0
* improved command executions for click, waitFor and getLocation
* removed duplicate command setSize()
* added more tests
* removed selenium-server-standalonver jar from repository
* implemented install script for downloading this jar into .bin folder
* cleaned up git repository (got rid of big jar files in git history) - requires to re-checkout this repository

## v0.7.9 (2013-08-09)
* Sauce Labs support
* support for unicode character (https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
* refactored tests
* minor formatting in README.md
* several bug and issue fixes

## v0.7 (2013-04-11)
* updated readme file
* setValue clears element value before adding content (added addValue command to just add content)
* follow the nodejs convention by passing an error object in first place
* improved error reporting
* added tests (run by travis)
* removed assert and test commands - webdriverjs should be used with any desired test framework
* cookie support
* Use Buffer.byteLength instead of string length for Content-Length header
* fix back/forward command for safari driver
* major code refactorings and code style changes
* updated selenium standalone jar

## v0.6.7 (2012-05-17)
* Added .doubleClick(cssSelector, [callback]);
* Added .dragAndDrop(sourceCssSelector, destinationCssSelector, [callback]);
* Added client.addCommand(commandName, function) to extend webdriverjs. Also merged with arcaniusx to fix conflict with colors module and waitFor response
* Bindings added: moveTo, elementIdLocationInView, elementIdName. Helper methods added: getTagName, getLocationInView, moveToObject. Also added some tests.
* Found bug that caused the incompatibility with Selenium Grid 2.
* Added suport for desiredCapabilities when calling the remote() method (only available in the init() method before).
