Webdriver/selenium 2.0 javascript bindings for nodejs [![Build Status](https://travis-ci.org/christian-bromann/webdriverjs.png)](https://travis-ci.org/christian-bromann/webdriverjs) [![Selenium Test Status](https://saucelabs.com/buildstatus/webdriverjs)](https://saucelabs.com/u/webdriverjs) [![Dependency Status](https://gemnasium.com/christian-bromann/webdriverjs.png)](https://gemnasium.com/christian-bromann/webdriverjs)
=====================================================

This library is a webdriver module for nodejs. It makes it possible to write
super easy selenium tests in your favorite BDD or TDD test framework. Even
Cucumber tests are supported. Take a look into the [example](https://github.com/camme/webdriverjs/tree/master/examples)
directory for test samples.

## How to install it

Either download it from github or use npm:
    
```shell
npm install webdriverjs
```

To run tests on your local machine, you have to download a selenium standalone
server which executes the selenium commands. You find the latest version
[here](https://code.google.com/p/selenium/downloads/detail?name=selenium-server-standalone-2.35.0.jar).
It is also possible to run the tests in the could (e.g. on BrowserStack, Sauce Labs or TestingBot). For more informations, see below.

## Example of webdriverjs

Run selenium server first:  

```shell
java -jar path/to/your/selenium-server-standalone-2.35.0.jar
```

Webdriverjs has just a few methods. Most of the methods you will use regurarly
are the methods available from the client. To begin using Webdriverjs you just
need to create a client.

**example using [Mocha](http://visionmedia.github.com/mocha/) and [Chai](http://chaijs.com/)**

```js
var webdriverjs = require('webdriverjs'),
    client = {};

describe('my webdriverjs tests', function(){
    this.timeout(99999999);
    before(function(){
            client = webdriverjs.remote(options);
            client.init();
    });

    it('Github test',function(done) {
        client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark', function(err, result) {
                expect(err).to.be.null;
                assert.strictEqual(result.height , 30);
                assert.strictEqual(result.width, 94);
            })
            .getTitle(function(err, title) {
                expect(err).to.be.null;
                assert.strictEqual(title,'GitHub · Build software better, together.');
            })
            .getElementCssProperty('class name','subheading', 'color', function(err, result){
                expect(err).to.be.null;
                assert.strictEqual(result, 'rgba(136, 136, 136, 1)');
            })
            .call(done);
    });

    after(function(done) {
        client.end(done);
    });
});
```

See more examples with other libraries in the [example directory](https://github.com/Camme/webdriverjs/tree/master/examples).

## Options

### desiredCapabilities
Type: `Object`<br>

**Example:**

```js
browserName: 'chrome',  // options: firefox, chrome, opera, safari
version: '27.0',         // browser version
platform: 'XP',          // OS platform
tags: ['tag1','tag2'],   // specify some tags (e.g. if you use Sauce Labs)
name: 'my test'          // set name for test (e.g. if you use Sauce Labs)
```

### logLevel
Type: `String`<br>
Default: *verbose*<br>
Options: *verbose* | *silent* | *command* | *data* | *result*

### singleton
Create client as singleton instance for use in different files<br>
Type: `Boolean`<br>
Default: *true*

## <img src="http://a0.twimg.com/profile_images/794342508/Logo_Square.png" width="48" /> [Sauce Labs](https://saucelabs.com/) support
To run your tests via Sauce Labs, add the following attributes to your option
object. If you are using Webdriverjs in a public repository, never publish your
Sauce Labs key! Export these informations as enviroment variables.

```js
host: 'ondemand.saucelabs.com', // Sauce Labs remote host
user: '<username>',             // your username
key:  '<access-key>',           // your access key
port: 80
```

Find a test example [here](https://github.com/camme/webdriverjs/blob/master/examples/webdriverjs.saucelabs.example.js)!

## <img src="http://a0.twimg.com/profile_images/1440403042/logo-separate-big_normal.png" width="48" /> [BrowserStack](http://www.browserstack.com/) support
You can also run your tests with BrowserStack on a remote machine.

```js
host: 'hub.browserstack.com', // Browserstack remote host
user: '<username>',           // your username
key:  '<access-key>',         // your access key
port: 80
```

Find a test example [here](https://github.com/camme/webdriverjs/blob/master/examples/webdriverjs.browserstack.example.js)!

## <img src="https://si0.twimg.com/profile_images/1647337797/testingbot1_bigger.png" width="48" /> [TestingBot](https://testingbot.com/) support
You can also run your tests with TestingBot on a remote machine.

```js
host: 'hub.testingbot.com', // TestingBot remote host
user: '<client_key>',       // your client key
key:  '<client_secret>',    // your client secret
port: 80
```

Find a test example [here](https://github.com/camme/webdriverjs/blob/master/examples/webdriverjs.testingbot.example.js)!

## webdriverjs.endAll
If you wish to end all sessions, you can call the endAll method:

    require("webdriverjs").endAll(callback);
    
Where callback is an optional parameter. This method can be used if you run
lots of tests, and you want to make sure that all sessions on your selenium
server are closed when you are done. Usually its enough to close each client
with its end() method, but if you, for some reason, want to make sure that
no sessions are open, use endAll(). (note: this method is also available
from the client returned from .remote() as well, but its the same as
webdriverjs.endAll())

## webdriverjs.sessions
To get a list of all open sessions, you can call:

    require("webdriverjs").sessions(callback);

which wil return an array with all sessions from selenium (note: this method
is also available from the client returned from .remote() as well, but its
the same as webdriverjs.sessions()).

## Extending
If you which to extend with your own set of commands there is a method
called addCommand available from the client object:

```js
var client = require("webdriverjs").remote();

// create a command the returns the current url and title as one result
// just to show an example
client.addCommand("getUrlAndTitle", function(callback) {
    this.url(function(err,urlResult) {
        this.getTitle(function(err,titleResult) {
            var specialResult = {url: urlResult.value, title: titleResult};
            if (typeof callback == "function") {
                callback(err,specialResult);
            }
        })
    });
});

client
    .init()
    .url('http://www.github.com')
    .getUrlAndTitle(function(err,result){
        expect(err).to.be.null;
        assert.strictEqual(result.url,'https://github.com/');
        assert.strictEqual(result.title,'GitHub · Build software better, together.');
    })
    .end();
```

# List of current helper methods
These are the current implemented helper methods. All methods take from 0
to a couple of parameters. Also all methods accept a callback so that we
can assert values or have more logic when the callback is called.

- **addValue(`String` css selector, `String|String[]` value, `Function` callback)**<br>adds a value to an object found by a css selector. You can also use unicode characters like `Left arrow` or `Back space`. You'll find all supported characters [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value). To do that, the value has to correspond to a key from the table.
- **buttonClick(`String` css selector, `Function` callback)**<br>click on a button using a css selector
- **call(callback)**<br>call given function in async order of current command queue
- **clearElement(`String` css selector, `Function` callback)**<br>clear an element of text
- **click(`String` css selector, `Function` callback)**<br>Clicks on an element based on a css selector
- **deleteCookie(`String` name, `Function` callback)**<br>Delete a cookie for current page.
- **doubleClick(`String` css selector, `Function` callback)**<br>Clicks on an element based on a css selector
- **dragAndDrop(`String` sourceCssSelector, `String` destinationCssSelector, `Function` callback)**<br>Drags an item to a destination
- **end(`Function` callback)**<br>Ends a sessions (closes the browser)
- **endAll(`Function` callback)**<br>Ends all sessions (closes the browser)
- **execute(`String` script, `Array` arguments, `Function` callback)**<br>Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
- **getAttribute(`String` css selector, `String` attribute name, `Function` callback)**<br>Get an attribute from an dom obj based on the css selector and attribute name
- **getCookie(name, `Function` callback)**<br>Gets the cookie for current page.
- **getCssProperty(`String` css selector, `String` css property name, `Function` callback)**<br>Gets a css property from a dom object selected with a css selector
- **getElementCssProperty(`String` find by, `String` finder, `String` css property name, `Function` callback)**<br>Gets a css property from a dom object selected with one of the base selecting mechanisms in the webdriver protocol (class name, css selector, id, name, link text, partial link text, tag name, xpath)
- **getElementSize(`String` css selector, `Function` callback)**<br>Gets the width and height for an object based on the css selector
- **getLocation(`String` css selector, `Function` callback)**<br>Gets the x and y coordinate for an object based on the css selector
- **getLocationInView(`String` css selector, `Function` callback)**<br>Gets the x and y coordinate for an object based on the css selector in the view
- **getSource(`Function` callback)**<br>Gets source code of the page
- **getTagName(`String` css selector, `Function` callback)**<br>Gets the tag name of a dom obj found by the css selector
- **getText(`String` css selector, `Function` callback)**<br>Gets the text content from a dom obj found by the css selector
- **getTitle(`Function` callback)**<br>Gets the title of the page
- **getValue(`String` css selector, `Function` callback)**<br>Gets the value of a dom obj found by css selector
- **isSelected(`String` css selector, `Function` callback)**<br>Return true or false if an OPTION element, or an INPUT element of type checkbox or radiobutton is currently selected (found by css selector).
- **isVisible(`String` css selector, `Function` callback)**<br>Return true or false if the selected dom obj is visible (found by css selector)
- **moveToObject(`String` css selector, `Function` callback)**<br>Moves the page to the selected dom object
- **pause(`Integer` milliseconds, `Function` callback)**<br>Pauses the commands by the provided milliseconds
- **refresh(`Function` callback)**<br>Refresh the current page
- **saveScreenshot(`String` path to file, `Function` callback)**<br>Saves a screenshot as a png from the current state of the browser
- **setCookie(`Object` cookie, `Function` callback)**<br>Sets a [cookie](http://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object) for current page.
- **setValue(`String` css selector, `String|String[]` value, `Function` callback)**<br>Sets a value to an object found by a css selector (clears value before). You can also use unicode characters like `Left arrow` or `Back space`. You'll find all supported characters [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value). To do that, the value has to correspond to a key from the table.
- **submitForm(`String` css selector, `Function` callback)**<br>Submits a form found by the css selector
- **waitFor(`String` css selector, `Integer` milliseconds, `Function` callback)**<br>Waits for an object in the dom (selected by css selector) for the amount of milliseconds provided. the callback is called with false if the object isnt found.

# List of current implemented wire protocol bindings
Here are the implemented bindings (and links to the official json protocol binding)

- [alertAccept](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/accept_alert)
- [alertDismiss](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/dismiss_alert)
- [alertText](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/alert_text)
- [buttondown](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttondown)
- [buttonup](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttonup)
- [element](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element)
- [elementIdAttribute](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/attribute/:name)
- [elementIdClick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/click)
- [elementDoubleClick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/doubleclick)
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
- [frame](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/frame)
- [init](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/)
- [moveto](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/moveto)
- [screenshot](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/screenshot)
- [session](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId)
- [sessions](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/sessions)
- [status](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/status)
- [submit](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/submit)
- [title](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/title)
- [url](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/url)
- [source](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/source)
- [window](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window)
- [windowHandles](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handles)
- [windowHandlePosition](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window/:windowHandle/position)
- [windowHandleSize](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window/:windowHandle/size)
- [forward](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/forward)
- [back](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/back)
- [refresh](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/refresh)
- [cookie](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie)
- [cookieName](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie/:name)

# More on selenium and its protocol
- [Latest standalone server](http://code.google.com/p/selenium/downloads/list)
- [The protocol](http://code.google.com/p/selenium/wiki/JsonWireProtocol)

## NPM Maintainers

The npm module for this library is maintained by:

* [Camilo Tapia](http://github.com/Camme)
* [Dan Jenkins](http://github.com/danjenkins)
* [Christian Bromann](https://github.com/christian-bromann)
