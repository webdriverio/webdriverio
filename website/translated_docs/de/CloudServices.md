---
id: cloudservices
title: Cloud-Dienste
---
Die Verwendung von Cloud Diensten, wie Sauce Labs, Browserstack oder Testingbot, ist mit WebdriverIO ziemlich einfach. Alles, was Sie tun müssen, ist `user` und `key` Informationen in den Optionen festlegen, die von dem Cloud-Anbieter bereitgestellt wird. Optional können sie auch Ihren Tests mit Cloud spezifischen Capabilities parametrisieren. Wenn Sie einen Cloud Dienst nur in einer CI Umgebung nutzten wollen, können Sie die `CI` Umgebungsvariable verwenden, um die Konfiguration zu modifizieren.

```js
// wdio.conf.js

var config = {...}
if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME;
    config.key = process.env.SAUCE_ACCESS_KEY;
}
exports.config = config
```

## [Sauce Labs](https://saucelabs.com/)

Es ist kinderleicht Ihr Test-Setup so einzurichten, damit die Tests über Sauce Labs laufen.

Die einzige Voraussetzung ist die `user` und `key` Variablen in der Konfiguration zu setzen. Diese sollten aus den Umgebungsvariablen (z.B. über `process.env.SAUCE_USERNAME`) herangezogen werden und nicht direct in der Konfiguration, für alle einsichtbar, festgelegt werde.

Sie können auch beliebige optionale [Test Konfigurationen](https://docs.saucelabs.com/reference/test-configuration/#webdriver-api) in den Capabilities festlegen.

### [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)

Wenn Sie Ihre Test-Applikation auf einem Server hosten, welcher lokal läuft (z.B. `localhost`) oder hinter einer Firewall, so ist die Nutzung von Sauce Connect erforderlich.

Es gehört nicht zur Aufgabe von WebdriverIO dieses Tool für Sie zu managen.

Allerdings gibt es ein Plugin namens [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service), welches die Integration mit Sauce Connect erleichtert. Es hilft neben dem auch noch in anderen Bereichen für eine bessere Integration mit Sauce Labs.

### Travis CI

Travis CI bietet ebenfalls eine Sauce Connect Integration an, die Ihnen helfen kann Tests über die gesicherte Verbindung zu Sauce Labs laufen zu lassen.

Um dies zu nutzen, setzen Sie die `tunnel-identifier` Option in jeder Ihrer Browser Capabilities. Travis CI setzt den Tunnel Identifier standardgemäß nach der der `TRAVIS_JOB_NUMBER` Umgebungsvariable.

Also if you want to have Sauce Labs group your tests by build number, you can set the `build` to `TRAVIS_BUILD_NUMBER`.

Lastly if you set the `name`, this changes the name of this test in Sauce Labs for this build. If you are using the WDIO testrunner combined with the [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service) WebdriverIO automatically sets a proper name for the test.

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

If you are using the WDIO testrunner download and configure the [`wdio-browserstack-service`](https://github.com/itszero/wdio-browserstack-service) in your `wdio.conf.js`. It helps getting BrowserStack running and comes with additional features that better integrate your tests into the BrowserStack service.

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

If you are using the WDIO testrunner download and configure the [`@wdio/testingbot-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-testingbot-service) in your `wdio.conf.js`. It helps getting TestingBot running and comes with additional features that better integrate your tests into the TestingBot service.