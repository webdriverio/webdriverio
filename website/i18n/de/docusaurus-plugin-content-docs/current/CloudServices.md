---
id: cloudservices
title: Verwenden von Cloud-Diensten
---

Die Nutzung von On-Demand-Diensten wie Sauce Labs, Browserstack, TestingBot, CrossBrowserTesting, LambdaTest oder Perfecto mit WebdriverIO ist ziemlich einfach. Alles, was Sie tun müssen, ist `user` und `key` in Ihren Optionen zu setzen.

Optional können Sie Ihren Test auch parametrisieren, indem Sie Cloud-spezifische Funktionen wie `build` Namen festlegen. Wenn Sie Cloud-Dienste nur in einer CI/CD Umgebung ausführen möchten, können Sie die Umgebungsvariable `CI` verwenden, um zu überprüfen, ob Sie sich in so einer Umgbeung befinden, und die Konfiguration entsprechend ändern.

```js
// wdio.conf.js
export let config = {...}
if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME
    config.key = process.env.SAUCE_ACCESS_KEY
}
```

## Sauce Labs

Sie können Ihre Tests so einrichten, dass sie in [Sauce Labs](https://saucelabs.com)remote ausgeführt werden.

Die einzige Anforderung besteht darin, die `user` und `key` Parameter in Ihrer Konfiguration (entweder exportiert von `wdio.conf.js` oder übergeben an `webdriverio.remote(...)`) auf Ihren Sauce Labs Benutzernamen und Zugriffsschlüssel festzulegen .

Sie können auch jede optionale [Testkonfiguration](https://docs.saucelabs.com/dev/test-configuration-options/) als key/value für jeden Browser übergeben.

### Sauce Connect

Wenn Sie Tests auf einem Server ausführen möchten, auf den nicht über das Internet zugegriffen werden kann (z. B. auf `localhost`), müssen Sie [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)verwenden.

Es liegt außerhalb des Umfangs von WebdriverIO, dies zu unterstützen, daher müssen Sie es selbst starten.

Wenn Sie den WDIO-Testrunner verwenden, nutzen Sie den [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) um die Konfiguration zu vereinfachen. Der Service hilft dabei Sauce Connect automatisch zu starten und zu beenden.

### Mit Travis CI

Travis CI hat [Unterstützung](http://docs.travis-ci.com/user/sauce-connect/#Setting-up-Sauce-Connect) zum Starten von Sauce Connect vor jedem Test.

Wenn Sie dies tun, müssen Sie die Testkonfigurationsoption `tunnel-identifier` in den `Capabilities` eines jeden Browsers festlegen. Travis setzt dies standardmäßig auf die Umgebungsvariable `TRAVIS_JOB_NUMBER`.

Wenn Sie möchten, dass Sauce Labs Ihre Tests nach Build-Nummer gruppiert, können Sie `build` auf `TRAVIS_BUILD_NUMBER`setzen.

Wenn Sie schließlich `name` festlegen, ändert dies den Namen dieses Tests in Sauce Labs für diesen Build. Wenn Sie den WDIO-Testrunner verwenden, nutzen Sie den [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) um diese Konfiguration zu vereinfachen.

Beispiel `capabilities`:

```javascript
browserName: 'chrome',
version: '27.0',
platform: 'XP',
'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
name: 'integration',
build: process.env.TRAVIS_BUILD_NUMBER
```

### Timeouts

Da Sie Ihre Tests remote ausführen, kann es erforderlich sein, einige Timeouts zu erhöhen.

Sie können das [Idle-Timeout](https://docs.saucelabs.com/dev/test-configuration-options/#idletimeout) ändern, indem Sie `idle-timeout` als Testkonfigurationsoption übergeben. Dies steuert, wie lange Sauce zwischen Befehlen wartet, bevor es die Verbindung schließt.

## BrowserStack

WebdriverIO hat auch eine [Browserstack](https://www.browserstack.com) Integration.

Die einzige Anforderung besteht darin, die `Benutzer` und `Schlüssel` in Ihrer Konfiguration (entweder exportiert durch `wdio.conf.js` oder übergeben an `webdriverio.remote(...)`) auf Ihren automatisierten Browserstack-Benutzernamen und Zugriffsschlüssel festzulegen .

Sie können auch jede optionale [Testkonfiguration](https://www.browserstack.com/automate/capabilities) als key/value für jeden Browser übergeben. Wenn Sie `browserstack.debug` auf `true` setzen, wird ein Screencast der Sitzung aufgezeichnet, was hilfreich sein könnte.

### Lokale Tests

Wenn Sie Tests auf einem Server ausführen möchten, auf den nicht über das Internet zugegriffen werden kann (z. B. auf `localhost`), müssen Sie [Local Testing](https://help.crossbrowsertesting.com/local-connection/general/local-tunnel-overview/)verwenden.

Es liegt außerhalb des Umfangs von WebdriverIO, dies nativ zu unterstützen, daher müssen Sie dies selbst konfigurieren.

Wenn Sie Tests auf Ihrem Rechner ausführen, sollten Sie in die Capability  `browserstack.local` auf `true` setzen.

Wenn Sie den WDIO-Testrunner verwenden, laden Sie den [`@wdio/browserstack-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-browserstack-service) in Ihrer `wdio.conf.js`herunter und konfigurieren Sie diesen. Es hilft dabei, BrowserStack zum Laufen zu bringen, und verfügt über zusätzliche Funktionen, die Ihre Tests besser in den BrowserStack-Dienst integrieren.

### Mit Travis CI

Wenn Sie BrowserStacks Tunnel in Travis nutzen möchten, müssen Sie diesen selbst starten.

Das folgende Skript hilft Ihnen, den Server heruntergeladen und ihn im Hintergrund zu starten. Sie sollten dies in Travis ausführen, bevor Sie mit den Tests beginnen.

```sh
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip
./BrowserStackLocal -v -onlyAutomate -forcelocal $BROWSERSTACK_ACCESS_KEY &
sleep 3
```

Außerdem möchten Sie vielleicht `Build` auf die Travis-Build-Nummer setzen.

Beispiel `capabilities`:

```javascript
browserName: 'chrome',
project: 'myApp',
version: '44.0',
build: `myApp #${process.env.TRAVIS_BUILD_NUMBER}.${process.env.TRAVIS_JOB_NUMBER}`,
'browserstack.local': 'true',
'browserstack.debug': 'true'
```

## TestingBot

Die einzige Anforderung besteht darin, die `Benutzer` und `Schlüssel` in Ihrer Konfiguration (entweder exportiert durch `wdio.conf.js` oder übergeben an `webdriverio.remote(...)`) auf Ihren [TestingBot](https://testingbot.com) Benutzernamen und Ihr Geheimnis festzulegen Taste.

Sie können auch beliebige optionale [unterstützte Fähigkeiten](https://testingbot.com/support/other/test-options) als Schlüssel/Wert in den Fähigkeiten für jeden Browser übergeben.

### Lokale Tests

Wenn Sie Tests auf einem Server ausführen möchten, auf den nicht über das Internet zugegriffen werden kann (z. B. auf `localhost`), müssen Sie [Local Testing](https://help.crossbrowsertesting.com/local-connection/general/local-tunnel-overview/)verwenden.

Testingbots Tunnel-Support-Seite enthält die Informationen, die erforderlich sind, um dies zum Laufen zu bringen.

Wenn Sie den WDIO-Testrunner verwenden, laden Sie den [`@wdio/crossbrowsertesting-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-crossbrowsertesting-service) in Ihrer `wdio.conf.js`herunter und konfigurieren Sie diesen. Es hilft dabei, CrossBrowserTesting zum Laufen zu bringen, und verfügt über zusätzliche Funktionen, die Ihre Tests besser in den CrossBrowserTesting-Dienst integrieren.

## CrossBrowserTesting

Die einzige Anforderung besteht darin, die `Benutzer`und `Schlüssel` in Ihrer Konfiguration (entweder exportiert von `wdio.conf.js` oder übergeben an `webdriverio.remote(...)`) auf Ihren [CrossBrowserTesting](https://crossbrowsertesting.com/) Benutzernamen und Authkey zu setzen .

Sie können auch beliebige optionale [Capabilities](https://help.crossbrowsertesting.com/selenium-testing/getting-started/crossbrowsertesting-automation-capabilities/) als Schlüssel/Wert in den Fähigkeiten für jeden Browser übergeben.

### Lokale Tests

Wenn Sie den WDIO-Testrunner verwenden, laden Sie den [`@wdio/crossbrowsertesting-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-crossbrowsertesting-service) in Ihrer `wdio.conf.js`herunter und konfigurieren Sie diesen. Es hilft dabei, CrossBrowserTesting zum Laufen zu bringen, und verfügt über zusätzliche Funktionen, die Ihre Tests besser in den CrossBrowserTesting-Dienst integrieren.

Wenn Sie den WDIO-Testrunner verwenden, laden Sie den [`wdio-lambdatest-service`](https://github.com/LambdaTest/wdio-lambdatest-service) in Ihrer `wdio.conf.js`herunter und konfigurieren Sie diesen. Es hilft dabei, LambdaTest zum Laufen zu bringen, und verfügt über zusätzliche Funktionen, die Ihre Tests besser in den LambdaTest-Dienst integrieren.

## LambdaTest

[LambdaTest](https://www.lambdatest.com) Integration ist ebenfalls integriert.

Die einzige Anforderung besteht darin, die `Benutzer` und `Schlüssel` in Ihrer Konfiguration (entweder exportiert durch `wdio.conf.js` oder übergeben an `webdriverio.remote(...)`) auf den Benutzernamen und Zugriffsschlüssel Ihres LambdaTest-Kontos festzulegen .

Sie können auch beliebige optionale [Capabilities](https://www.lambdatest.com/capabilities-generator/) als Schlüssel/Wert in den Fähigkeiten für jeden Browser übergeben. Wenn Sie `visual` auf `true` setzen, wird ein Screencast der Sitzung aufgezeichnet, was hilfreich sein könnte.

### Tunnel für lokale Tests

Wenn Sie Tests auf einem Server ausführen möchten, auf den nicht über das Internet zugegriffen werden kann (z. B. auf `localhost`), müssen Sie [Local Testing](https://www.lambdatest.com/support/docs/testing-locally-hosted-pages/)verwenden.

Es liegt außerhalb des Umfangs von WebdriverIO, dies nativ zu unterstützen, daher müssen Sie diesen selbst konfigurieren.

Wenn Sie local Anwendungen testen, sollten Sie die Capability `tunnel` auf `true` setzen.

Wenn Sie den WDIO-Testrunner verwenden, laden Sie den [`wdio-lambdatest-service`](https://github.com/LambdaTest/wdio-lambdatest-service) in Ihrer `wdio.conf.js`herunter und konfigurieren Sie diesen. Es hilft dabei, LambdaTest zum Laufen zu bringen, und verfügt über zusätzliche Funktionen, die Ihre Tests besser in den LambdaTest-Dienst integrieren.
### Mit Travis CI

Wenn Sie Tests auf einem lokalen Server ausführen möchten, müssen Sie einen Tunnel selber starten.

Das folgende Skript hilft Ihnen, den Server herunterzuladen und ihn im Hintergrund zu starten. Sie sollten dies in Travis ausführen, bevor Sie mit den Tests beginnen.

```sh
wget http://downloads.lambdatest.com/tunnel/linux/64bit/LT_Linux.zip
unzip LT_Linux.zip
./LT -user $LT_USERNAME -key $LT_ACCESS_KEY -cui &
sleep 3
```

Außerdem möchten Sie vielleicht `build` auf die Travis-Build-Nummer setzen.

Beispiel `capabilities`:

```javascript
platform: 'Windows 10',
browserName: 'chrome',
version: '79.0',
build: `myApp #${process.env.TRAVIS_BUILD_NUMBER}.${process.env.TRAVIS_JOB_NUMBER}`,
'tunnel': 'true',
'visual': 'true'
```

## Perfecto

Wenn Sie wdio mit [`Perfecto`](https://www.perfecto.io)verwenden, müssen Sie für jeden Benutzer ein Sicherheitstoken erstellen und dieses (zusätzlich zu anderen Capabilities) wie folgt in die Funktionsstruktur einfügen:

```js
export const config = {
  capabilities: [{
    // ...
    securityToken: "your security token"
  }],
```

Darüber hinaus müssen Sie die Cloud-Konfiguration wie folgt hinzufügen:

```js
  hostname: "your_cloud_name.perfectomobile.com",
  path: "/nexperience/perfectomobile/wd/hub",
  port: 443,
  protocol: "https",
```
