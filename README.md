WebdriverIO [![Build Status](https://travis-ci.org/webdriverio/webdriverio.png?branch=master)](https://travis-ci.org/webdriverio/webdriverio) [![Coverage Status](https://coveralls.io/repos/webdriverio/webdriverio/badge.png?branch=master&)](https://coveralls.io/r/webdriverio/webdriverio?branch=master) [![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/webdriverio/webdriverio?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
===========

[![Selenium Test Status](https://saucelabs.com/browser-matrix/webdriverio.svg)](https://saucelabs.com/u/webdriverio)

This library is a webdriver module for Node.js. It makes it possible to write
super easy selenium tests in your favorite BDD or TDD test framework. It was
originated by [Camilo Tapia's](https://github.com/camme) inital selenium project
called WebdriverJS.

Have a look at the many [examples](examples/).

For news or announcements follow [@webdriverio](https://twitter.com/WebdriverIO) on Twitter.

## How to install it

```shell
npm install webdriverio
```

## Usage

Make sure you have a running Selenium standalone/grid/hub. Or use [selenium-standalone](https://github.com/vvo/selenium-standalone)
package to run one easily.

Once you initialized your WebdriverIO instance you can chain all available [protocol and action commands](http://webdriver.io/api.html)
to execute asynchronous requests sequentially. WebdriverIO supports callback and promise based chaining. You can
either pass a callback as last parameter to handle with the command results:

```js
var webdriverio = require('../index');
var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

webdriverio
    .remote(options)
    .init()
    .url('http://www.google.com')
    .getTitle(function(err, title) {
        console.log('Title was: ' + title);
    })
    .end();
```

or you can handle it like a A+ promise:

```js
webdriverio
    .remote(options)
    .init()
    .url('http://www.google.com')
    .getTitle()
        .then(function(title) {
            console.log('Title was: ' + title);
        })
        .reject(function(error) {
            console.log('uups something went wrong', error);
        })
    .end();
```

Using promised based assertion libraries like [chai-as-promised](https://github.com/domenic/chai-as-promised/) it
makes functional testing with WebdriverIO super easy. No nested callbacks anymore! No confusion whether to use
callbacks or promises!

```js
describe('example page', function() {

    before(function() {
        return client.init().url('http://example.com');
    });

    it('should display right title and #someElem', function() {
        return client.getTitle().should.become('Example Title')
                     .isVisible('#someElem').should.eventually.be.true;
    });

    after(function() {
        return client.end();
    });

});
```

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

See the [Selenium documentation](https://code.google.com/p/selenium/wiki/DesiredCapabilities) for a list of the available `capabilities`.

### logLevel
Type: `String`

Default: *silent*

Options: *verbose* | *silent* | *command* | *data* | *result*

### coloredLogs

Type: `Boolean`

Default: *true*

Enables colors for log output

### screenshotPath
Saves a screenshot to a given path if Selenium driver crashes

Type: `String`|`null`

Default: *null*

### singleton

Type: `Boolean`

Default: *false*

Set to true if you always want to reuse the same remote

### waitforTimeout

Type: `Number`

Default: *500*

Default timeout for all waitForXXX commands

## Selector API

The JsonWireProtocol provides several strategies to query an element. WebdriverIO simplifies these
to make it more familiar with the common existing selector libraries like [Sizzle](http://sizzlejs.com/).
The following selector types are supported:

- **CSS query selector**<br>
  e.g. `client.click('h2.subheading a', function(err,res) {...})` etc.
- **link text**<br>
  To get an anchor element with a specific text in it (f.i. `<a href="http://webdriver.io">WebdriverIO</a>`)
  query the text starting with an equal (=) sign. In this example use `=WebdriverIO`
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

In near future WebdriverIO will cover more selector features like form selector (e.g. `:password`,`:file` etc)
or positional selectors like `:first` or `:nth`.

## List of current commands methods

To see the full list of available commands check out the [WebdriverIO API](http://webdriver.io/api.html).

## Eventhandling

WebdriverIO inherits several function from the NodeJS [EventEmitter](http://nodejs.org/api/events.html) object.
Additionally it provides an experimental way to register events on browser side (like click,
focus, keypress etc.).

#### Eventhandling

The following functions are supported: `on`,`once`,`emit`,`removeListener`,`removeAllListeners`.
They behave exactly as described in the official NodeJS [docs](http://nodejs.org/api/events.html).
There are some predefined events (`error`,`init`,`end`, `command`) which cover important
WebdriverIO events.

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

**Note:** make sure you check out the [Browserevent](https://github.com/webdriverio/browserevent) side project
that enables event-handling on client side (Yes, in the browser!! ;-).

## Adding custom commands

If you want to extend the client with your own set of commands there is a
method called `addCommand` available from the client object:

```js
var client = require("webdriverio").remote();

// example: create a command the returns the current url and title as one result
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
    .getUrlAndTitle('a custom variable', function(err,result){
        assert.equal(null, err)
        assert.strictEqual(result.url,'https://github.com/');
        assert.strictEqual(result.title,'GitHub · Build software better, together.');
    })
    .end();
```

## Selenium cloud providers

WebdriverIO supports

* <img src="https://pbs.twimg.com/profile_images/794342508/Logo_Square_bigger.png" width="48" /> [Sauce Labs](https://saucelabs.com/)
* <img src="https://avatars0.githubusercontent.com/u/1119453?v=3&s=200" width="48" /> [BrowserStack](http://www.browserstack.com/)
* <img src="https://pbs.twimg.com/profile_images/1647337797/testingbot1_bigger.png" width="48" /> [TestingBot](https://testingbot.com/)

See the corresponding [examples](examples/).

## How to run tests

1. Download the latest Selenium [standalone server](http://selenium-release.storage.googleapis.com/index.html)
   and run it via

   ```sh
   $ java -jar selenium-server-standalone-2.41.0.jar
   ```

2. Make sure you have all the dependencies installed

   ```sh
   $ npm install
   ```

   also all Bower packages required by our testpage

   ```sh
   $ cd test/site/www && bower install && cd ../../..
   ```

3. Start a local server that delivers our test page to the browser. We recommend to
   use [http-server](https://www.npmjs.org/package/http-server)

   ```sh
   $ cd /root/dir/of/webdriverio
   $ http-server -p 8080
   ```

4. Depending on your feature/fix/patch make sure it gets covered by a test.
   To ensure that you can run one of the following commands:

   ```sh
   # if your patch is browser specific
   # (e.g. upload files)
   npm run-script test-desktop

   # if your patch is mobile specific
   # (e.g. flick or swipe tests)
   npm run-script test-mobile

   # if your patch is functional and hasn't something to do with Selenium
   # (e.g. library specific fixes like changes within EventHandler.js)
   npm run-script test-functional
   ```

   While developing you can run tests on specific specs by passing another
   environment variable `_SPEC`, e.g.

   ```sh
   $ _SPEC=test/spec/YOURSPEC.js npm run-script test-desktop
   ```

## NPM Maintainers

The npm module for this library is maintained by:

* [Camilo Tapia](http://github.com/Camme)
* [Dan Jenkins](http://github.com/danjenkins)
* [Christian Bromann](https://github.com/christian-bromann)
* [Vincent Voyer](https://github.com/vvo)
