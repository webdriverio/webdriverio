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
            It implements all Webdriver protocol commands and provides **useful integrations** with other tools.
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
        <li><a href="https://twitter.com/webdriverio/status/806911722682544128" target="_blank">REPL interface</a></li>
        <li><a href="http://gulpjs.com/">Gulp</a> and <a href="http://gruntjs.com/">Grunt</a> support</li>
        <li>selector chaining</li>
    </ul>
</aside>

<div class="rulethemall">
    <h2 class="text-align">One Tool To Rule Them All:</h2>
    <a href="https://github.com/webdriverio/grunt-webdriver"><img src="/images/plugins/grunt.png" alt="Grunt Integration"></a>
    <a href="https://github.com/webdriverio/gulp-webdriver"><img src="/images/plugins/gulp.png" alt="Gulp Integration"></a>
    <a href="https://atom.io/packages/webdriverio-snippets"><img src="http://webdriver.io/images/plugins/atom.png" alt="Atom snippets for WebdriverIO API"></a>
    <a href="https://packagecontrol.io/packages/WebdriverIO"><img src="/images/plugins/sublime.png" alt="Sublime Text Plugin"></a>
    <a href="https://github.com/webdriverio/webdrivercss#applitools-eyes-support"><img src="/images/plugins/applitools.png" alt="Visual Regression Testing with Applitools Eyes"></a>
    <a href="https://github.com/webdriverio/webdriverrtc"><img src="/images/plugins/webrtc.png" alt="WebRTC Analytics Plugin"></a>
</div>


## What is WebdriverIO?

<div style="overflow: hidden">
    <article class="col2">
        WebdriverIO lets you control a browser or a mobile application with just a few lines of code. Your test code will look simple, concise and easy to read. The integrated test runner let you write asynchronous commands in a synchronous way so that you don't need to care about how to handle a Promise to avoid racing conditions. Additionally it takes away all the cumbersome setup work and manages the Selenium session for you.<br>
        <br>
        Working with elements on a page has never been easier due to its synchronous nature. When fetching or looping over elements you can use just native JavaScript functions. With the `$` and `$$` functions WebdriverIO provides useful shortcuts which can also be chained in order to move deeper in the DOM tree without using complex xPath selectors.<br>
        <br>
        The test runner also comes with a variety of hooks that allow you to interrupt the test process in order to e.g. take screenshots if an error occurs or modify the test procedure according to a previous test result. This is used by WebdriverIOs [services](/guide/services/appium.html) to integrate your tests with 3rd party tools like [Appium](http://appium.io/).
    </article>

    <article class="runyourtests col2 last">
```js
var expect = require('chai').expect;
describe('webdriver.io api page', function() {
    it('should be able to filter for commands', function () {
        browser.url('http://webdriver.io/api.html');

        // filtering property commands
        $('.searchbar input').setValue('getT');

        // get all results that are displayed
        var results = $$('.commands.property a').filter(function (link) {
            return link.isVisible();
        });

        // assert number of results
        expect(results.length).to.be.equal(3);

        // check out second result
        results[1].click();
        expect($('.doc h1').getText()).to.be.equal('GETTEXT');
    });
});
```
    <a href="http://try.learnwebdriverio.com" class="button tryit icon-circle-arrow-right" target="_blank">Try It Out
</a>
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
            WebdriverIO was designed to be as flexible and framework agnostic as possible. It can be applied in any context and serves not only the purpose of testing.<br>
            <br>
            You can use it as scraper tool to dynamically fetch website data in an automated way or integrate it in your own automation library. Popular examples of that are [Spectron](http://electron.atom.io/spectron/), [Chimp](https://chimp.readme.io/) or [CodeceptJS](http://codecept.io/).
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
create your config file in less than a minute. It also gives an overview of all available
3rd party packages like framework adaptions, reporter and services and installs them for you.


<div class="cliwindow">
![WDIO configuration utility](/images/config-utility.gif "WDIO configuration utility")
</div>

<div>
    <article class="col2">
        <h2>How does it work?</h2>
        <p>
            WebdriverIO is an open source testing utility for nodejs. It makes it possible to write super easy selenium tests with Javascript in your favorite BDD or TDD test framework.
        </p>
        <p>
            It basically sends requests to a Selenium server via the <a href="https://www.w3.org/TR/webdriver/">WebDriver Protocol</a> and handles its response. These requests are wrapped in useful commands and can be used to test several aspects of your site in an automated way.
        </p>
    </article>

    <article class="runyourtests col2 last">
        <h2>Run your tests in the cloud</h2>
        <p>
            Services like Sauce Labs or BrowserStack provide selenium testing on remote hosts. They allow you to run tests on a wide collection of platforms, devices and browser combinations without any extra configuration to your environment.
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
