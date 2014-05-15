Webdriver/selenium 2.0 javascript bindings for nodejs [![Build Status](https://travis-ci.org/camme/webdriverjs.png?branch=master)](https://travis-ci.org/camme/webdriverjs) [![Coverage Status](https://coveralls.io/repos/camme/webdriverjs/badge.png?branch=master&)](https://coveralls.io/r/camme/webdriverjs?branch=master)
=====================================================

[![Selenium Test Status](https://saucelabs.com/browser-matrix/camme-webdriverjs.svg)](https://saucelabs.com/u/camme-webdriverjs)

This library is a webdriver module for nodejs. It makes it possible to write
super easy selenium tests in your favorite BDD or TDD test framework.

Have a look at the many [examples](examples/).

For news or announcements follow [@webdriverjs](https://twitter.com/WebdriverJS) on Twitter.

## How to install it

```shell
npm install webdriverjs
```

## Disclaimer

This is not the official WebdriverJS driver, for differences between this and the official driver,
please take a look on [this issue post](https://github.com/camme/webdriverjs/issues/138#issuecomment-32051980).

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

Default: *null*

### singleton

Type: `Boolean`

Default: *false*

Set to true if you always want to reuse the same remote

## Selector API

The JsonWireProtocol provides several strategies to query an element. WebdriverJS simplifies these
to make it more familiar with the common existing selector libraries like [Sizzle](http://sizzlejs.com/).
The following selector types are supported:

- **CSS query selector**<br>
  e.g. `client.click('h2.subheading a', function(err,res) {...})` etc.
- **link text**<br>
  To get an anchor element with a specific text in it (f.i. `<a href="http://webdriver.io">WebdriverJS</a>`)
  query the text starting with an equal (=) sign. In this example use `=WebdriverJS`
- **partial link text**<br>
  To find a anchor element whose visible text partially matches your search value, query it by using `*=`
  in front of the query string (e.g. `*=driver`)
- **tag name**<br>
  To query an element with a specific tag name use `<tag>` or `<tag />`
- **name attribute**<br>
  For quering elements with a specific name attribute you can eather use a normal CSS3 selector or the
  provided name strategy from the JsonWireProtocol by passing something like `[name="some-name"]` as
  selector parameter
- **xPath**<br>
  It is also possible to query elements via a specific xPath. The selector has to have a format like
  for example `//BODY/DIV[6]/DIV[1]/SPAN[1]`

In near future WebdriverJS will cover more selector features like form selector (e.g. `:password`,`:file` etc)
or positional selectors like `:first` or `:nth`.

## Eventhandling

WebdriverJS inherits several function from the NodeJS [EventEmitter](http://nodejs.org/api/events.html) object.
Additionally it provides an experimental way to register events on browser side (like click,
focus, keypress etc.).

#### Eventhandling in NodeJS environment

The following functions are supported: `on`,`once`,`emit`,`removeListener`,`removeAllListeners`.
They behave exactly as described in the official NodeJS [docs](http://nodejs.org/api/events.html).
There are some predefined events (`error`,`init`,`end`, `command`) which cover important
WebdriverJS events.

**Example:**

```js
client.on('error', function(e) {
    // will be executed everytime an error occured
    // e.g. when element couldn't be found
    console.log(e.body.value.class);   // -> "org.openqa.selenium.NoSuchElementException"
    console.log(e.body.value.message); // -> "no such element ..."
})
```

All commands are chainable, so you can use them while chaining your commands

```js
var cnt;

client
    .init()
    .once('countme', function(e) {
        console.log(e.elements.length, 'elements were found');
    })
    .elements('.myElem', function(err,res) {
        cnt = res.value;
    })
    .emit('countme', cnt)
    .end();
```

#### Eventhandling on browser side

This is an experimental feature that helps you to listen on events within the browser. It
is currently **only** supported in Chrome browser (other browser will eventually follow).
To register an event call the `addEventListener` command. If an event gets invoked it returns
almost the complete event object that got caught within the browser. Only the `Window` will
be removed to avoid circular references. All objects from type `HTMLElement` will be
replaced by their xPath. This will help you to query and identify this element with WebdriverJS.

Before you are able to use browser side eventhandling you need set the `experimental` flag
on client initialization:

```js
var client = WebdriverJS.remote({
    logLevel: 'verbose',
    experimental: true, // <-- enables browser side eventhandling
    desiredCapabilities: {
        browserName: 'chrome'
    }
});
```

After that you can use `addEventListener` to register events on one or multiple elements
and `removeEventListener` to remove them.

**Example**

```js
client
    .url('http://google.com')
    .addEventListener('dblclick','#hplogo', function(e) {
        console.log(e.target); // -> 'id("hplogo")'
        console.log(e.type); // -> 'dblclick'
        console.log(e.clientX, e.clientY); // -> 239 524
    })
    .doubleClick('#hplogo') // triggers event
    .end();
```

**Again:** this is still an experimental feature. Some events like `hover` will not be
recorded by the browser. But `click` and custom events are working flawlessly.

## Adding custom commands

If you want to extend the client with your own set of commands there is a method
called `addCommand` available from the client object:

```js
// create a command the returns the current url and title as one result
// just to show an example
var client = require("webdriverjs").remote();

// last parameter has to be a callback function that needs to be called
// when the command has finished (otherwise the queue stops)
client.addCommand("getUrlAndTitle", function(customVar, cb) {
    this.url(function(err,urlResult) {
        this.getTitle(function(err,titleResult) {
            var specialResult = {url: urlResult.value, title: titleResult};
            cb(err,specialResult);
            console.log(customVar); // "a custom variable"
        })
    });
});

client
    .init()
    .url('http://www.github.com')
    .getUrlAndTitle('a custom variable',function(err,result){
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
npm install -g selenium-standalone http-server phantomjs

# start a local selenium instances
start-selenium

# serves the test directory holding the test files
http-server

# runs tests !
npm test
```

## Selenium cloud providers

Webdriverjs supports

* <img src="https://pbs.twimg.com/profile_images/794342508/Logo_Square_bigger.png" width="48" /> [Sauce Labs](https://saucelabs.com/)
* <img src="https://pbs.twimg.com/profile_images/1440403042/logo-separate-big_bigger.png" width="48" /> [BrowserStack](http://www.browserstack.com/)
* <img src="https://pbs.twimg.com/profile_images/1647337797/testingbot1_bigger.png" width="48" /> [TestingBot](https://testingbot.com/)

See the corresponding [examples](examples/).

## List of current helper methods
These are the current implemented helper methods. All methods take from 0
to a couple of parameters. Also all methods accept a callback so that we
can assert values or have more logic when the callback is called.

- **addValue(`String` selector, `String|String[]` value, `Function` callback)**<br>adds a value to an object found by a selector. You can also use unicode characters like `Left arrow` or `Back space`. You'll find all supported characters [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value). To do that, the value has to correspond to a key from the table.
- **call(callback)**<br>call given function in async order of current command queue
- **chooseFile(`String` selector, `String` localFilePath, `Function` callback)**<br>Given a selector corresponding to an `<input type=file>`, will upload the local file to the browser machine and fill the form accordingly. It does not submit the form for you.
- **clearElement(`String` selector, `Function` callback)**<br>clear an element of text
- **click(`String` selector, `Function` callback)**<br>Clicks on an element based on a selector.
- **close([`String` tab ID to focus on,] `Function` callback)**<br>Close the current window (optional: and switch focus to opended tab)
- **deleteCookie(`String` name, `Function` callback)**<br>Delete a cookie for current page.
- **doubleClick(`String` selector, `Function` callback)**<br>Clicks on an element based on a selector
- **drag(`String` selector, `Number` startX, `Number` startY, `Number` endX, `Number` endY, `Number` touchCount, `Number` duration, `Function` callback)**<br>Perform a drag on the screen or an element (works only on [Appium](https://github.com/appium/appium/blob/master/docs/gestures.md))
- **dragAndDrop(`String` sourceCssSelector, `String` destinationCssSelector, `Function` callback)**<br>Drags an item to a destination
- **dragDown(`String` selector, `Number` touchCount, `Number` duration, `Function` callback)**<br>Perform a drag down on an element (works only on [Appium](https://github.com/appium/appium/blob/master/docs/gestures.md))
- **dragLeft(`String` selector, `Number` touchCount, `Number` duration, `Function` callback)**<br>Perform a drag left on an element (works only on [Appium](https://github.com/appium/appium/blob/master/docs/gestures.md))
- **dragRight(`String` selector, `Number` touchCount, `Number` duration, `Function` callback)**<br>Perform a drag right on an element (works only on [Appium](https://github.com/appium/appium/blob/master/docs/gestures.md))
- **dragUp(`String` selector, `Number` touchCount, `Number` duration, `Function` callback)**<br>Perform a drag up on an element (works only on [Appium](https://github.com/appium/appium/blob/master/docs/gestures.md))
- **emit(`String` eventName, [arg1], [arg2], [...])**<br>Execute each event listeners in order with the supplied arguments.
- **end(`Function` callback)**<br>Ends a sessions (closes the browser)
- **endAll(`Function` callback)**<br>Ends all sessions (closes the browser)
- **execute(`String` or `Function` script, `Array` arguments, `Function` callback)**<br>Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame. If script is a `Function`, arguments is required.
- **flick(`String` selector, `Number` startX, `Number` startY, `Number` endX, `Number` endY, `Number` touchCount, `Function` callback)**<br>Perform a flick on the screen or an element (works only on [Appium](https://github.com/appium/appium/blob/master/docs/gestures.md))
- **getAttribute(`String` selector, `String` attribute name, `Function` callback)**<br>Get an attribute from an dom obj based on the selector and attribute name
- **getCookie(`String` name, `Function` callback)**<br>Get cookie for the current page. If no cookie name is specified the command will return all cookies.
- **getCssProperty(`String` selector, `String` css property name, `Function` callback)**<br>Gets a css property from a dom object selected with a selector
- **getCurrentTabId(`Function` callback)**<br>Retrieve the current window handle.
- **getElementSize(`String` selector, `Function` callback)**<br>Gets the width and height for an object based on the selector
- **getLocation(`String` selector, `Function` callback)**<br>Gets the x and y coordinate for an object based on the selector
- **getLocationInView(`String` selector, `Function` callback)**<br>Gets the x and y coordinate for an object based on the selector in the view
- **getOrientation(`Function` callback)**<br>Get the current browser orientation.
- **getSource(`Function` callback)**<br>Gets source code of the page
- **getTabIds(`Function` callback)**<br>Retrieve the list of all window handles available to the session.
- **getTagName(`String` selector, `Function` callback)**<br>Gets the tag name of a dom obj found by the selector
- **getText(`String` selector, `Function` callback)**<br>Gets the text content from a dom obj found by the selector
- **getTitle(`Function` callback)**<br>Gets the title of the page
- **getValue(`String` selector, `Function` callback)**<br>Gets the value of a dom obj found by selector
- **isSelected(`String` selector, `Function` callback)**<br>Return true or false if an OPTION element, or an INPUT element of type checkbox or radiobutton is currently selected (found by selector).
- **isEnabled(`String` selector, `Function` callback)**<br>Return true for everything but disabled input elements.
- **isVisible(`String` selector, `Function` callback)**<br>Return true or false if the selected dom obj is visible (found by selector)
- **leftClick(`String` selector, `Function` callback)**<br>Apply left click at an element. If selector is not provided, click at the last moved-to location.
- **hold(`String` selector,`Function` callback)**<br>Long press on an element using finger motion events.
- **middleClick(`String` selector, `Function` callback)**<br>Apply middle click at an element. If selector is not provided, click at the last moved-to location.
- **moveToObject(`String` selector, `Function` callback)**<br>Moves the page to the selected dom object
- **newWindow(`String` url, `String` name for the new window, `String` new window features (e.g. size, position, scrollbars, etc.), `Function` callback)**<br>equivalent function to `Window.open()` in a browser
- **on(`String` eventName, `Function` fn)**<br>Register event listener on specific event (the following are already defined: `init`,`command`,`end`,`error`)
- **once(`String` eventName, `Function` fn)**<br>Adds a one time listener for the event (the following are already defined: `init`,`command`,`end`,`error`)
- **pause(`Integer` milliseconds, `Function` callback)**<br>Pauses the commands by the provided milliseconds
- **refresh(`Function` callback)**<br>Refresh the current page
- **release(`String` selector, `Function` callback)**<br>Finger up on an element
- **removeListener(`String` eventName, `Function` fn)**<br>Remove a listener from the listener array for the specified event
- **removeAllListeners([`String` eventName])**<br>Removes all listeners, or those of the specified event
- **rightClick(`String` selector, `Function` callback)**<br>Apply right click at an element. If selector is not provided, click at the last moved-to location.
- **saveScreenshot(`String` path to file, `Function` callback)**<br>Saves a screenshot as a png from the current state of the browser
- **scroll(`String` selector, `Function`callback)**<br>Scroll to a specific element. You can also pass two offset values as parameter to scroll to a specific position (e.g. `scroll(xoffset,yoffset,callback)`).
- **setCookie(`Object` cookie, `Function` callback)**<br>Sets a [cookie](http://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object) for current page.
- **setOrientation(`String` orientation, `Function` callback)**<br>Set the current browser orientation.
- **setValue(`String` selector, `String|String[]` value, `Function` callback)**<br>Sets a value to an object found by a selector (clears value before). You can also use unicode characters like `Left arrow` or `Back space`. You'll find all supported characters [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value). To do that, the value has to correspond to a key from the table.
- **submitForm(`String` selector, `Function` callback)**<br>Submits a form found by the selector
- **switchTab(`String` tab ID)**<br>switch focus to a particular tab/window
- **tap(`String` selector,`Number` x,`Number` y,`Number` tapCount,`Number` touchCount,`Number` duration,`Function` callback)**<br>Perform a tap on the screen or an element (works only on [Appium](https://github.com/appium/appium/blob/master/docs/gestures.md))
- **touch(`String` selector, `Function` callback)**<br>Finger down on an element.
- **waitFor(`String` selector, `Integer` milliseconds, `Function` callback)**<br>Waits for an object in the dom (selected by selector) for the amount of milliseconds provided. the callback is called with false if the object isnt found.
- **waitForVisible(`String` selector, `Integer` milliseconds[, `Integer` interval in ms], `Function` callback)**<br>Waits for an object to be visible for the amount of milliseconds provided.
- **waitForInvisible(`String` selector, `Integer` milliseconds[, `Integer` interval in ms], `Function` callback)**<br>Waits for an object to be invisible for the amount of milliseconds provided.

## List of current implemented wire protocol bindings
Here are the implemented bindings (and links to the official json protocol binding)

- [alertAccept](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/accept_alert)
- [alertDismiss](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/dismiss_alert)
- [alertText](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/alert_text)
- [back](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/back)
- [buttonPress](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/click)
- [buttonDown](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttondown)
- [buttonUp](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttonup)
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
- [elementIdEnabled](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/enabled)
- [elements](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/elements)
- [execute](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/execute)
- [executeAsync](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/execute_async)
- file (undocumented protocol command)
- [forward](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/forward)
- [frame](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/frame)
- [implicitWait](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/timeouts/implicit_wait)
- [init](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/)
- [keys](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/keys)
- [orientation](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/orientation)
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
- [touchClick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/click)
- [touchDoubleClick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/doubleclick)
- [touchDown](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/down)
- [touchFlick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/flick)
- [touchFlickPrecise](https://github.com/appium/appium/blob/master/docs/gestures.md)
- [touchLongClick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/longclick)
- [touchMove](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/move)
- [touchScroll](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/scroll)
- [touchSwipe](https://github.com/appium/appium/blob/master/docs/gestures.md)
- [touchTap](https://github.com/appium/appium/blob/master/docs/gestures.md)
- [touchUp](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/up)
- [url](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/url)
- [window](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window)
- [windowHandle](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handle)
- [windowHandlePosition](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window/:windowHandle/position)
- [windowHandles](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handles)
- [windowHandleSize](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window/:windowHandle/size)

## More on selenium and its protocol
- [Latest standalone server](http://code.google.com/p/selenium/downloads/list)
- [The protocol](http://code.google.com/p/selenium/wiki/JsonWireProtocol)

## NPM Maintainers

The npm module for this library is maintained by:

* [Camilo Tapia](http://github.com/Camme)
* [Dan Jenkins](http://github.com/danjenkins)
* [Christian Bromann](https://github.com/christian-bromann)
* [Vincent Voyer](https://github.com/vvo)
