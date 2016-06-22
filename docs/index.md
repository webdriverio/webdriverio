layout: start
---

<aside class="teaser">
    <div class="teaserbox">
        <h3>Extendable</h3>
        <p>
            Adding helper functions, or more complicated sets and combi-<br>nations of existing
            commands is **simple** and really **useful**
        </p>
    </div>
    <div class="teaserbox">
        <h3>Compatible</h3>
        <p>
            WebdriverIO works in combination with most of the **TDD** and **BDD** test frameworks
            in the JavaScript world
        </p>
    </div>
    <div class="teaserbox">
        <h3>Feature-Rich</h3>
        <p>
            Most of the Selenium WebDriver Wire Protocol is already implemented and wrapped in
            **useful commands**
        </p>
    </div>
</aside>

<aside class="features">
    <ul>
        <li>synchronous command handling</li>
        <li>supports a variety of hooks</li>
        <li>command line interface support</li>
    </ul>
    <ul>
        <li>Visual Regression Test Integration</li>
        <li><a href="http://gulpjs.com/">Gulp</a> and <a href="http://gruntjs.com/">Grunt</a> support</li>
        <li>selector chaining</li>
    </ul>
</aside>

<div class="rulethemall">
    <h2 class="text-align">One Tool To Rule Them All:</h2>
    <a href="https://github.com/webdriverio/grunt-webdriver"><img src="/images/plugins/grunt.png" alt="Grunt Integration"></a>
    <a href="https://github.com/webdriverio/gulp-webdriver"><img src="/images/plugins/gulp.png" alt="Gulp Integration"></a>
    <a href="https://packagecontrol.io/packages/WebdriverIO"><img src="/images/plugins/sublime.png" alt="Sublime Text Plugin"></a>
    <a href="https://github.com/webdriverio/webdrivercss#applitools-eyes-support"><img src="/images/plugins/applitools.png" alt="Visual Regression Testing with Applitools Eyes"></a>
    <a href="https://github.com/webdriverio/webdriverrtc"><img src="/images/plugins/webrtc.png" alt="WebRTC Analytics Plugin"></a>
</div>


## What is WebdriverIO?

<div style="overflow: hidden">
    <article class="col2">
        WebdriverIO lets you control a browser or a mobile application with just a few
        lines of code. Your test code will look simple, concise and easy to read. The
        integrated testrunner allows you to write asynchronous commands in a synchronous
        way so that you don't need to care about how to propagate a Promise to avoid
        racing conditions.<br>
        <br>
        The test runner comes also with a variety of hooks that allow you to interfere
        into the test process in order to take screenshots if an error occurs or modify
        the test procedure according to a previous test result.
    </article>

    <article class="runyourtests col2 last">
```js
var assert = require('assert');

describe('webdriver.io page', function() {
    it('should have the right title', function () {
        browser.url('http://webdriver.io');
        var title = browser.getTitle();
        assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
    });
});
```
    </article>
</div>

<a href="/guide.html" class="button getstarted">Get Started</a>
<div class="testimonials"></div>

<div style="overflow: hidden">
    <article class="col2 standalone">
```js
var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = webdriverio.remote(options);

client
    .init()
    .url('https://duckduckgo.com/')
    .setValue('#search_form_input_homepage', 'WebdriverIO')
    .click('#search_button_homepage')
    .getTitle().then(function(title) {
        console.log('Title is: ' + title);

        // outputs:
        // "Title is: WebdriverIO (Software) at DuckDuckGo"
    })
    .end();
```
    </article>
    <article class="col2 last">
        <h2 class="right-col-heading">WebdriverIO as standalone package</h2>
        <p>
          WebdriverIO was designed to be as flexible and framework agnostic as possible. It
          can be applied in any context and serves not only the purpose of testing.<br>
          <br>
          You can use WebdriverIO as scrapper tool to dynamically fetch website data in an
          automated way. You also can integrate WebdriverIO in your own automation library.
          Popular examples of that are [Spectron](http://electron.atom.io/spectron/),
          [Chimp](https://chimp.readme.io/) or [CodeceptJS](http://codecept.io/).
          <div>
              <p>
                  <a href="http://electron.atom.io/spectron/" style="margin-right: 15px"><img src="http://electron.atom.io/images/spectron-icon.svg" width="75" /></a>
                  <a href="https://chimp.readme.io/" style="margin-right: 15px"><img src="https://www.filepicker.io/api/file/C4MBXB4jQ6Ld9gII5IkF" /></a>
                  <a href="http://codecept.io/"><img src="http://codecept.io/images/cjs-base.png" width="80" /></a>
              </p>
          </div>
        </p>
    </article>
</div>

## Easy Test Setup

The `wdio` command line interface comes with a nice configuration utility that helps you to
create your config file in less than a minute. It also gives and overview of all available
3rd party packages like framework adaptions, reporter and services and installs them for you.


<div class="cliwindow">
![WDIO configuration utility](/images/config-utility.gif "WDIO configuration utility")
</div>

<div>
    <article class="col2">
        <h2>How does it work?</h2>
        <p>
            WebdriverIO is an open source testing utility for nodejs. It makes it possible
            to write super easy selenium tests with Javascript in your favorite BDD or TDD
            test framework. Even Cucumber tests are supported.
        </p>
        <p>
            It basically sends requests to a Selenium server via the <a href="https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#Command_Reference">WebDriver Wire Protocol</a>
            and handles its response. These requests are wrapped in useful commands, which
            provide callbacks to test several aspects of your site in an automated way.
        </p>
    </article>

    <article class="runyourtests col2 last">
        <h2>Run your tests in the cloud</h2>
        <p>
            Services like Sauce Labs or BrowserStack provide selenium testing on remote hosts.
            Be able to run tests on a wide collection of platforms, devices and browser combinations
            without any configuration in your environment.
        </p>
        <div>
            <p>WebdriverIO supports services including:</p>
            <p>
                <a href="https://saucelabs.com">Sauce Labs</a>
                <a href="http://www.browserstack.com/">BrowserStack</a>
                <a href="http://www.testingbot.com/">TestingBot</a>
            </p>
        </div>
    </article>
</div>
