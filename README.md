Webdriver/selenium 2.0 javascript bindings for nodejs
=====================================================

[![Build Status](https://travis-ci.org/camme/webdriverjs.png)](https://travis-ci.org/camme/webdriverjs)
[![Selenium Test Status](https://saucelabs.com/browser-matrix/camme-webdriverjs.svg)](https://saucelabs.com/u/camme-webdriverjs)

This library is a webdriver module for nodejs. It makes it possible to write
super easy selenium tests in your favorite BDD or TDD test framework.

Have a look at the many [examples](examples/).

Breaking 1.x API changes, see [upgrading to 1.x](#upgrading-to-1-x).

## How to install it

```shell
npm install webdriverjs
```

## Usage

`webdriverjs` implements most of selenium's [JsonWireProtocol](https://code.google.com/p/selenium/wiki/JsonWireProtocol).

Make sure you have a running selenium standalone/grid/hub.

Or use [selenium-standalone](https://github.com/vvo/selenium-standalone) package to run one easily.

```js
var webdriverjs = require('../index');
var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

webdriverjs
    .remote(options)
    .init()
    .url('http://www.google.com')
    .title(function(err, res) {
        console.log('Title was: ' + res.value);
    })
    .end();
```

See the [full list of options](#options) you can pass to `.remote(options)`

See [helpers](#list-of-current-helper-methods) and [protocol methods](#list-of-current-implemented-wire-protocol-bindings).

## Options

### desiredCapabilities
Type: `Object`<br>

**Example:**

```js
browserName: 'chrome',  // options: firefox, chrome, opera, safari
version: '27.0',        // browser version
platform: 'XP',         // OS platform
tags: ['tag1','tag2'],  // specify some tags (e.g. if you use Sauce Labs)
name: 'my test'         // set name for test (e.g. if you use Sauce Labs)
```

See the [selenium documentation](https://code.google.com/p/selenium/wiki/DesiredCapabilities) for a list of the available `capabilities`.

### logLevel
Type: `String`

Default: *silent*

Options: *verbose* | *silent* | *command* | *data* | *result*

### screenshotPath
Saves a screenshot to a given path if selenium driver crashes

Type: `String`|`null`

Default: `null`

### singleton

Type: `Boolean`

Default: *false*

Set to true if you always want to reuse the same remote

## Adding custom commands

If you which to extend with your own set of commands there is a method
called `addCommand` available from the client object:

```js
var client = require("webdriverjs").remote();

// create a command the returns the current url and title as one result
// just to show an example
client.addCommand("getUrlAndTitle", function(cb) {
    this.url(function(err,urlResult) {
        this.getTitle(function(err,titleResult) {
            var specialResult = {url: urlResult.value, title: titleResult};
            cb(err,specialResult);
        })
    });
});

client
    .init()
    .url('http://www.github.com')
    .getUrlAndTitle(function(err,result){
        assert.equal(null, err)
        assert.strictEqual(result.url,'https://github.com/');
        assert.strictEqual(result.title,'GitHub · Build software better, together.');
    })
    .end();
```

## Local testing

If you want to help us in developing webdriverjs, you can easily add
[mocha](https://github.com/visionmedia/mocha) [tests](test/) and run them locally:

```sh
npm install -g selenium-standalone http-server

# start a local selenium instances
start-selenium

# serves the test directory holding the test files
http-server test

# runs tests !
npm test
```

## Selenium cloud providers

Webdriverjs supports

<img src="http://a0.twimg.com/profile_images/794342508/Logo_Square.png" width="48" /> [Sauce Labs](https://saucelabs.com/)
<img src="http://a0.twimg.com/profile_images/1440403042/logo-separate-big_normal.png" width="48" /> [BrowserStack](http://www.browserstack.com/)
<img src="https://si0.twimg.com/profile_images/1647337797/testingbot1_bigger.png" width="48" /> [TestingBot](https://testingbot.com/)

See the corresponding [examples](examples/).

## List of current helper methods
These are the current implemented helper methods. All methods take from 0
to a couple of parameters. Also all methods accept a callback so that we
can assert values or have more logic when the callback is called.

- **addValue(`String` css selector, `String|String[]` value, `Function` callback)**<br>adds a value to an object found by a css selector. You can also use unicode characters like `Left arrow` or `Back space`. You'll find all supported characters [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value). To do that, the value has to correspond to a key from the table.
- **buttonClick(`String` css selector, `Function` callback)**<br>click on a button using a css selector
- **call(callback)**<br>call given function in async order of current command queue
- **clearElement(`String` css selector, `Function` callback)**<br>clear an element of text
- **click(`String` css selector, `Function` callback)**<br>Clicks on an element based on a css selector
- **close([`String` tab ID to focus on,] `Function` callback)**<br>Close the current window (optional: and switch focus to opended tab)
- **deleteCookie(`String` name, `Function` callback)**<br>Delete a cookie for current page.
- **doubleClick(`String` css selector, `Function` callback)**<br>Clicks on an element based on a css selector
- **dragAndDrop(`String` sourceCssSelector, `String` destinationCssSelector, `Function` callback)**<br>Drags an item to a destination
- **end(`Function` callback)**<br>Ends a sessions (closes the browser)
- **endAll(`Function` callback)**<br>Ends all sessions (closes the browser)
- **execute(`String` script, `Array` arguments, `Function` callback)**<br>Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
- **getAttribute(`String` css selector, `String` attribute name, `Function` callback)**<br>Get an attribute from an dom obj based on the css selector and attribute name
- **getCookie(`String` name, `Function` callback)**<br>Gets the cookie for current page.
- **getCssProperty(`String` css selector, `String` css property name, `Function` callback)**<br>Gets a css property from a dom object selected with a css selector
- **getCurrentTabId(`Function` callback)**<br>Retrieve the current window handle.
- **getElementCssProperty(`String` find by, `String` finder, `String` css property name, `Function` callback)**<br>Gets a css property from a dom object selected with one of the base selecting mechanisms in the webdriver protocol (class name, css selector, id, name, link text, partial link text, tag name, xpath)
- **getElementSize(`String` css selector, `Function` callback)**<br>Gets the width and height for an object based on the css selector
- **getLocation(`String` css selector, `Function` callback)**<br>Gets the x and y coordinate for an object based on the css selector
- **getLocationInView(`String` css selector, `Function` callback)**<br>Gets the x and y coordinate for an object based on the css selector in the view
- **getSource(`Function` callback)**<br>Gets source code of the page
- **getTabIds(`Function` callback)**<br>Retrieve the list of all window handles available to the session.
- **getTagName(`String` css selector, `Function` callback)**<br>Gets the tag name of a dom obj found by the css selector
- **getText(`String` css selector, `Function` callback)**<br>Gets the text content from a dom obj found by the css selector
- **getTitle(`Function` callback)**<br>Gets the title of the page
- **getValue(`String` css selector, `Function` callback)**<br>Gets the value of a dom obj found by css selector
- **isSelected(`String` css selector, `Function` callback)**<br>Return true or false if an OPTION element, or an INPUT element of type checkbox or radiobutton is currently selected (found by css selector).
- **isVisible(`String` css selector, `Function` callback)**<br>Return true or false if the selected dom obj is visible (found by css selector)
- **moveToObject(`String` css selector, `Function` callback)**<br>Moves the page to the selected dom object
- **newWindow(`String` url, `String` name for the new window, `String` new window features (e.g. size, position, scrollbars, etc.), `Function` callback)**<br>equivalent function to `Window.open()` in a browser
- **pause(`Integer` milliseconds, `Function` callback)**<br>Pauses the commands by the provided milliseconds
- **refresh(`Function` callback)**<br>Refresh the current page
- **saveScreenshot(`String` path to file, `Function` callback)**<br>Saves a screenshot as a png from the current state of the browser
- **setCookie(`Object` cookie, `Function` callback)**<br>Sets a [cookie](http://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object) for current page.
- **setValue(`String` css selector, `String|String[]` value, `Function` callback)**<br>Sets a value to an object found by a css selector (clears value before). You can also use unicode characters like `Left arrow` or `Back space`. You'll find all supported characters [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value). To do that, the value has to correspond to a key from the table.
- **submitForm(`String` css selector, `Function` callback)**<br>Submits a form found by the css selector
- **switchTab(`String` tab ID)**<br>switch focus to a particular tab/window
- **waitFor(`String` css selector, `Integer` milliseconds, `Function` callback)**<br>Waits for an object in the dom (selected by css selector) for the amount of milliseconds provided. the callback is called with false if the object isnt found.

## List of current implemented wire protocol bindings
Here are the implemented bindings (and links to the official json protocol binding)

- [alertAccept](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/accept_alert)
- [alertDismiss](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/dismiss_alert)
- [alertText](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/alert_text)
- [back](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/back)
- [buttondown](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttondown)
- [buttonup](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttonup)
- [cookie](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie)
- [cookieName](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie/:name)
- [doubleclick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/doubleclick)
- [element](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element)
- [elementIdAttribute](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/attribute/:name)
- [elementIdClear](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/clear)
- [elementIdClick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/click)
- [elementIdCssProperty](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/css/:propertyName)
- [elementIdDisplayed](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/displayed)
- [elementIdLocation](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/location)
- [elementIdLocationInView](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/location_in_view)
- [elementIdName](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/name)
- [elementIdSize](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/size)
- [elementIdText](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/text)
- [elementIdValue](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/value)
- [elementIdSelected](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/selected)
- [elements](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/elements)
- [execute](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/execute)
- [executeAsync](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/execute_async)
- [forward](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/forward)
- [frame](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/frame)
- [implicit_wait](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/timeouts/implicit_wait)
- [init](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/)
- [keys](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/keys)
- [moveto](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/moveto)
- [refresh](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/refresh)
- [screenshot](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/screenshot)
- [session](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId)
- [sessions](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/sessions)
- [source](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/source)
- [status](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/status)
- [submit](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/submit)
- [timeouts](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/timeouts)
- [title](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/title)
- [url](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/url)
- [window](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window)
- [windowHandle](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handle)
- [windowHandlePosition](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window/:windowHandle/position)
- [windowHandles](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handles)
- [windowHandleSize](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window/:windowHandle/size)

## More on selenium and its protocol
- [Latest standalone server](http://code.google.com/p/selenium/downloads/list)
- [The protocol](http://code.google.com/p/selenium/wiki/JsonWireProtocol)

## Upgrading to 1.x

The 1.x refactor was done to fix many bugs due to the chain API.

We also removed some features that were not well designed/fully functionning:

* default logger is now silent
* `singleton` option defaults to `false`
* `webdriverjs.endAll` and `webdriverjs.sessions` methods are gone. You must access them on the
`client` instance

## NPM Maintainers

The npm module for this library is maintained by:

* [Camilo Tapia](http://github.com/Camme)
* [Dan Jenkins](http://github.com/danjenkins)
* [Christian Bromann](https://github.com/christian-bromann)
* [Vincent Voyer](https://github.com/vvo)
