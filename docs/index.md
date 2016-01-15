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
        <li>100% <a href="https://promisesaplus.com/">Promise A+</a> compatible</li>
        <li>supports ES6 generators (yield)</li>
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

WebdriverIO lets you control a browser or a mobile application with just a few
lines of code. Your test code will look simple, concise and easy to read. Creating
automated tests is as easy as:

```js
var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = webdriverio.remote(options);
&nbsp;
client
    .init()
    .url('https://duckduckgo.com/')
    .setValue('#search_form_input_homepage', 'WebdriverIO')
    .click('#search_button_homepage')
    .getTitle().then(function(title) {
        console.log('Title is: ' + title);
        // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
    })
    .end();
```

## Write your test specs with ES6 support!

If you are using Node.js (>=v0.11) or io.js you can write your test specs using [`yield`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield).
The `wdio` test runner supports ES6 generators and allows you to get rid of nasty callback code.

```js
describe('my feature', function() {
  it('should do something', function *() {
&nbsp;
    yield browser
        .url('https://duckduckgo.com/')
        .setValue('#search_form_input_homepage', 'WebdriverIO')
        .click('#search_button_homepage');
&nbsp;
    var title = yield browser.getTitle();
    console.log(title); // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
&nbsp;
  });
});
```

## Easy Test Setup

The `wdio` command line interface comes with a nice configuration utility that helps you to
create your config file in less than a minute.

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
            It basically sends requests to a Selenium server via the <a href="https://code.google.com/p/selenium/wiki/JsonWireProtocol#Command_Reference">WebDriver Wire Protocol</a>
            and handles its response. These requests are wrapped in useful commands, which
            provide callbacks to test several aspects of your site in an automated way.
        </p>
    </article>

    <article class="runyourtests col2 last">
        <h2>Run your tests in the cloud</h2>
        <p>
            Services like Sauce Labs or BrowserStack provide selenium testing on remote hosts.
            Be able to run tests on a wide collection of plattforms, devices and browser combinations
            without any configuration in your enviroment.
        </p>
        <div>
            <p>WebdriverIO supports services like:</p>
            <p>
                <a href="https://saucelabs.com">Sauce Labs</a>
                <a href="http://www.browserstack.com/">BrowserStack</a>
                <a href="http://www.testingbot.com/">TestingBot</a>
            </p>
        </div>
    </article>
</div>
