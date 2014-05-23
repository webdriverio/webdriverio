# CHANGELOG

## v1.7.1 (2014-05-23)
* fixes exception when getValue() returns an error

## v1.7.0 (2014-05-15)
* merged PR #206 and #210
* new action commands: `isEnabled`, `waitForInvisible`, `waitForVisible`
* new protocol command: `elementIdEnabled`

## v1.6.1 (2014-04-14)
* fixed tap position

## v1.6.0 (2014-04-04)
* allow parenthesized xpath expressions (thanks to @zauberpony)
* enhanced README.md
* implemented browser side eventhandling as "experimental" feature

## v1.5.1 (2014-03-18)
* re-add code removed by a refactor

## v1.5.0 (2014-03-18)
* downgrade chainit version because of performance leaks of queue v2.0

## v1.4.0 (2014-03-17)
* implemented event handling in WebdriverJS - register events on 'init','command','end','error' or register own costum events
* new commands: 'on','once','emit','removeListener','removeAllListeners'
* refactored lib modules - use events to log test process

## v1.3.4 (2014-03-14)
* use real `Error` objects, prefix error messages

## v1.3.3 (2014-03-13)
* remove lodash.merge dependency hell
* added code coverage
* waitFor should not overwrite implicitWait globally
* fix find element strategy for name/css selector
* chain each instance separately

## v1.3.2 (2014-03-02)
* added client.use() so command can be added from modules

## v1.3.1 (2014-01-25)
* use mikeal/request

## v1.3.0 (2014-01-19)
* fix .elements() to accept the new element syntax

## v1.2.1 (2014-01-15)
* add .chooseFile(selector, localFile, cb), .file() protocol, .uploadFile command

## v1.2.0 (2014-01-08)
* added touch protocol commands
* created simple phonegap app for mobile testing
* added orientation protocol commands, covered with tests
* added scroll command to cover scrolling for browser and native mobile applications
* implemented tap and flick actions with protocol commands
* added hold,release,touch commands (not implemented in appium yet)
* improved tests and coverage

## v1.1.1 (2014-01-06)
* fix element old syntax API

## v1.1.0 (2014-01-05)
* enhance click with middleClick, rightClick, leftClick
* add jshint. first step towards good code formatting
* remove unused packages
* add editorconfig, fix whitespace

## v1.0.6 (2013-12-29)
* upgrade chainit

## v1.0.5 (2013-12-27)
* allow local `npm test`
* updated examples
* implement protocol binding for DELETE /session/:sessionId/cookie

## v1.0.4 (2013-12-19)
* updated badges and packages
* added travis browser matrix
* outdated use of GET element/:id/value
* implemented small selector API for better element querying

## v1.0.3 (2013-12-11)
* fix .remote() empty options bug

## v1.0.2 (2013-12-10)
* fix .addCommand (was previously bugged if you tried to add multiple commands)

## v1.0.1 (2013-12-05)
* logLevel defaults to silent

## v1.0.0 (2013-12-05)
* use chainit as chain API
* removed implemented chain logic
* code refactoring
* try to use common modules instead of custom on obvious things like extend

## v0.7.14 (2013-10-07)
* added implicitWait protocol command and improved waitFor command
* added newWindow command
* added 'keys' protocol command
* add pure function execution in .execute
* add .timeouts, Add .executeAsync
* now displays the actual original message, as well as the message in webdriverjs
* added close.js to commands - it allows to close the browser window.

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
