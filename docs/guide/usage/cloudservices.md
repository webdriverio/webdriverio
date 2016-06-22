name: cloudservices
category: usage
tags: guide
index: 2
title: WebdriverIO - Using Cloud Services
---

# Using Cloud Services

Using ondemand services like Sauce Labs, Browserstack or TestingBot with WebdriverIO is pretty simple.

1. Make sure WebdriverIO uses their host (e.g. `ondemand.saucelabs.com` for Sauce Labs) as the selenium server, either by setting the `host` config or letting WebdriverIO configure that automatically based on the value of `user` and `key`.
2. (optional) Set service specific values for each browser in `desiredCapabilities` (e.g. `build` to specify the build number and cluster multiple tests together).
3. (optional) Tunnel local traffic to provider, so that your tests can access `localhost`.

If you only want to run cloud services in Travis, you can use the `CI` environment variable to check if you are in Travis and modify the config accordingly.

```javascript
// wdio.conf.js

var config = {...}
if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME;
    config.key = process.env.SAUCE_ACCESS_KEY;
}
exports.config = config
```

## [Sauce Labs](https://saucelabs.com/)

It is easy to set up your tests to run remotely in Sauce Labs.

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your Sauce Labs username and access key.

You can also pass in any optional [test configuration option](https://docs.saucelabs.com/reference/test-configuration/#webdriver-api) as a key/value in the capabilities for any browser.

### [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect)

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use Sauce Connect.

It is out of the scope of WebdriverIO to support this, so you must start it by yourself.

If you are using the WDIO testrunner download and configure the [`wdio-sauce-service`](https://github.com/webdriverio/wdio-sauce-service) in your `wdio.conf.js`. It helps getting Sauce Connect running and comes with additional features that better integrate your tests into the Sauce service.

### With Travis CI

Travis CI, however, does [have support](http://docs.travis-ci.com/user/sauce-connect/#Setting-up-Sauce-Connect) for starting Sauce Connect before each test, so follow their directions for that if you are interested.

If you do so, you must set the `tunnel-identifier` test configuration option in each browser's capabilities. Travis sets this to the `TRAVIS_JOB_NUMBER` environmental variable by default.

Also if you want to have Sauce Labs group your tests by build number, you can set the `build` to `TRAVIS_BUILD_NUMBER`.

Lastly if you set the `name`, this changes the name of this test in Sauce Labs for this build. If you are using the WDIO testrunner combined with the [`wdio-sauce-service`](https://github.com/webdriverio/wdio-sauce-service) WebdriverIO automatically sets a proper name for the test.

Example `desiredCapabilities`:

```javascript
browserName: 'chrome',
version: '27.0',
platform: 'XP',
'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
name: 'integration',
build: process.env.TRAVIS_BUILD_NUMBER
```

### Timeouts

Since you are running your tests remotely, it might be necessary to increase some timeouts.

You can change the [idle timeout](https://docs.saucelabs.com/reference/test-configuration/#idle-test-timeout) by passing `idle-timeout` as a test configuration option. This controls how long Sauce will wait between commands before closing the connection.

## [BrowserStack](https://www.browserstack.com/)

Browserstack is also supported easily.

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your Browserstack automate username and access key.

You can also pass in any optional [supported capabilities](https://www.browserstack.com/automate/capabilities) as a key/value in the capabilities for any browser. If you set `browserstack.debug` to `true` it will record a screencast of the session, which might be helpful.

### [Local Testing](https://www.browserstack.com/local-testing#command-line)

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use Local Testing.

It is out of the scope of WebdriverIO to support this, so you must start it by yourself.

If you do use local, you should set `browserstack.local` to `true` in your capabilities.

### With Travis CI

If you want to add Local Testing in Travis you have to start it by yourself.

The following script will download and start it in the background. You should run this in Travis before starting the tests.

```bash
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip
./BrowserStackLocal -v -onlyAutomate -forcelocal $BROWSERSTACK_ACCESS_KEY &
sleep 3
```

Also, you might wanna set the `build` to the Travis build number.

Example `desiredCapabilities`:

```javascript
browserName: 'chrome',
project: 'myApp',
version: '44.0',
build: 'myApp #' + process.env.TRAVIS_BUILD_NUMBER + '.' + process.env.TRAVIS_JOB_NUMBER,
'browserstack.local': 'true',
'browserstack.debug': 'true'
```

## [TestingBot](https://testingbot.com/)

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your TestingBot username and secret key.

You can also pass in any optional [supported capabilities](https://testingbot.com/support/other/test-options) as a key/value in the capabilities for any browser.

### [Local Testing](https://testingbot.com/support/other/tunnel)

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use Local Testing. TestingBot provides a JAVA based tunnel to allow you to test websites not accessible from the internet.

Their tunnel support page contains the information necessary to get this up and running.
