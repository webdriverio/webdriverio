---
id: cloudservices
title: Using Cloud Services
---

Using on-demand services like Sauce Labs, Browserstack, TestingBot, CrossBrowserTestin, LambdaTest or Perfecto with WebdriverIO is pretty simple. All you need to do is to set your service's `user` and `key` in your options.

Optionally, you can also parametrize your test by setting cloud-specific capabilities like `build`. If you only want to run cloud services in Travis, you can use the `CI` environment variable to check if you are in Travis and modify the config accordingly.

```js
// wdio.conf.js
export let config = {...}
if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME
    config.key = process.env.SAUCE_ACCESS_KEY
}
```

## Sauce Labs

You can set up your tests to run remotely in [Sauce Labs](https://saucelabs.com).

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your Sauce Labs username and access key.

You can also pass in any optional [test configuration option](https://docs.saucelabs.com/dev/test-configuration-options/) as a key/value in the capabilities for any browser.

### Sauce Connect

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy).

It is out of the scope of WebdriverIO to support this, so you'll have to start it by yourself.

If you are using the WDIO testrunner download and configure the [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) in your `wdio.conf.js`. It helps getting Sauce Connect running and comes with additional features that better integrate your tests into the Sauce service.

### With Travis CI

Travis CI, however, does [have support](http://docs.travis-ci.com/user/sauce-connect/#Setting-up-Sauce-Connect) for starting Sauce Connect before each test, so following their directions for that is an option.

If you do so, you must set the `tunnel-identifier` test configuration option in each browser's `capabilities`. Travis sets this to the `TRAVIS_JOB_NUMBER` environmental variable by default.

Also, if you want to have Sauce Labs group your tests by build number, you can set the `build` to `TRAVIS_BUILD_NUMBER`.

Lastly, if you set `name`, this changes the name of this test in Sauce Labs for this build. If you are using the WDIO testrunner combined with the [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service), WebdriverIO automatically sets a proper name for the test.

Example `capabilities`:

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

You can change the [idle timeout](https://docs.saucelabs.com/dev/test-configuration-options/#idletimeout) by passing `idle-timeout` as a test configuration option. This controls how long Sauce will wait between commands before closing the connection.

## BrowserStack

WebdriverIO also has a [Browserstack](https://www.browserstack.com) integration built-in.

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your Browserstack automate username and access key.

You can also pass in any optional [supported capabilities](https://www.browserstack.com/automate/capabilities) as a key/value in the capabilities for any browser. If you set `browserstack.debug` to `true` it will record a screencast of the session, which might be helpful.

### Local Testing

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use [Local Testing](https://www.browserstack.com/local-testing#command-line).

It is out of the scope of WebdriverIO to support this, so you must start it by yourself.

If you do use local, you should set `browserstack.local` to `true` in your capabilities.

If you are using the WDIO testrunner, download and configure the [`@wdio/browserstack-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-browserstack-service) in your `wdio.conf.js`. It helps get BrowserStack running, and comes with additional features that better integrate your tests into the BrowserStack service.

### With Travis CI

If you want to add Local Testing in Travis, you have to start it by yourself.

The following script will download and start it in the background. You should run this in Travis before starting the tests.

```sh
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip
./BrowserStackLocal -v -onlyAutomate -forcelocal $BROWSERSTACK_ACCESS_KEY &
sleep 3
```

Also, you might wish set the `build` to the Travis build number.

Example `capabilities`:

```javascript
browserName: 'chrome',
project: 'myApp',
version: '44.0',
build: `myApp #${process.env.TRAVIS_BUILD_NUMBER}.${process.env.TRAVIS_JOB_NUMBER}`,
'browserstack.local': 'true',
'browserstack.debug': 'true'
```

## TestingBot

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your [TestingBot](https://testingbot.com) username and secret key.

You can also pass in any optional [supported capabilities](https://testingbot.com/support/other/test-options) as a key/value in the capabilities for any browser.

### Local Testing

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use [Local Testing](https://testingbot.com/support/other/tunnel). TestingBot provides a Java-based tunnel to allow you to test websites not accessible from the internet.

Their tunnel support page contains the information necessary to get this up and running.

If you are using the WDIO testrunner, download and configure the [`@wdio/testingbot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-testingbot-service) in your `wdio.conf.js`. It helps get TestingBot running, and comes with additional features that better integrate your tests into the TestingBot service.

## CrossBrowserTesting

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your [CrossBrowserTesting](https://crossbrowsertesting.com/) username and authkey.

You can also pass in any optional [supported capabilities](https://help.crossbrowsertesting.com/selenium-testing/getting-started/crossbrowsertesting-automation-capabilities/) as a key/value in the capabilities for any browser.

### Local Testing

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use [Local Testing](https://help.crossbrowsertesting.com/local-connection/general/local-tunnel-overview/). CrossBrowserTesting provides a tunnel to allow you to test websites not accessible from the internet.

If you are using the WDIO testrunner, download and configure the [`@wdio/crossbrowsertesting-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-crossbrowsertesting-service) in your `wdio.conf.js`. It helps get CrossBrowserTesting running and comes with additional features that better integrate your tests into the CrossBrowserTesting service.

## LambdaTest

[LambdaTest](https://www.lambdatest.com) integration is also built-in.

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your LambdaTest account username and access key.

You can also pass in any optional [supported capabilities](https://www.lambdatest.com/capabilities-generator/) as a key/value in the capabilities for any browser. If you set `visual` to `true` it will record a screencast of the session, which might be helpful.

### Tunnel for local testing

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use [Local Testing](https://www.lambdatest.com/support/docs/testing-locally-hosted-pages/).

It is out of the scope of WebdriverIO to support this, so you must start it by yourself.

If you do use local, you should set `tunnel` to `true` in your capabilities.

If you are using the WDIO testrunner, download and configure the [`wdio-lambdatest-service`](https://github.com/LambdaTest/wdio-lambdatest-service) in your `wdio.conf.js`. It helps get LambdaTest running, and comes with additional features that better integrate your tests into the LambdaTest service.
### With Travis CI

If you want to add Local Testing in Travis, you have to start it by yourself.

The following script will download and start it in the background. You should run this in Travis before starting the tests.

```sh
wget http://downloads.lambdatest.com/tunnel/linux/64bit/LT_Linux.zip
unzip LT_Linux.zip
./LT -user $LT_USERNAME -key $LT_ACCESS_KEY -cui &
sleep 3
```

Also, you might wish set the `build` to the Travis build number.

Example `capabilities`:

```javascript
platform: 'Windows 10',
browserName: 'chrome',
version: '79.0',
build: `myApp #${process.env.TRAVIS_BUILD_NUMBER}.${process.env.TRAVIS_JOB_NUMBER}`,
'tunnel': 'true',
'visual': 'true'
```

## Perfecto

When using wdio with [`Perfecto`](https://www.perfecto.io), you need to create a security token for each user and add this in the capabilities structure (in addition to other capabilities), as follows:

```js
export const config = {
  capabilities: [{
    // ...
    securityToken: "your security token"
  }],
```

In addition, you need to add cloud configuration, as follows:

```js
  hostname: "your_cloud_name.perfectomobile.com",
  path: "/nexperience/perfectomobile/wd/hub",
  port: 443,
  protocol: "https",
```
