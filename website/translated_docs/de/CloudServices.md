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

Um Ihre Tests in einem Build zu gruppieren können Sie ebenfalls die Capability `build` nutzen und diese gemäß der `TRAVIS_BUILD_NUMBER` Umgebungsvariable setzen.

Außerdem, wenn Sie die Capability `name` setzen, so wird der Job gemäß Ihrer Eingabe im Sauce Labs Dashboard benannt. Wenn Sie allerdings den WDIO Testrunner verwenden mit dem [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service) Plugin, so wird dies automatisch vom Testrunner erledigt.

zum Beispiel:

```javascript
browserName: 'chrome',
version: '27.0',
platform: 'XP',
'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
name: 'mein automatisierter Test',
build: process.env.TRAVIS_BUILD_NUMBER
```

### Timeouts

Da Sie Ihre Tests in der Cloud ausführen, kann es von Nöten sein, einige Timeouts zu erhöhen.

Sie können den Leerlaufzeit [ändern](https://docs.saucelabs.com/reference/test-configuration/#idle-test-timeout) indem Sie `idle-timeout` als Testkonfiguration übergeben. Dies kontrolliert, wie lange Sauce zwischen Befehlen warten wird, bevor die Verbindung geschlossen wird.

## [BrowserStack](https://www.browserstack.com/)

Der BrowserStack Support ist ebenfalls einfach zu konfigurieren.

Die einzige Voraussetzung ist die `user` und `key` Variablen in der Konfiguration zu setzen. Diese sollten aus den Umgebungsvariablen (z.B. über process.env.BROWSERSTACK_USERNAME) herangezogen werden und nicht direct in der Konfiguration, für alle einsichtbar, festgelegt werde.

Sie können auch beliebige optionale <a href="[Test Konfigurationen](https://www.browserstack.com/automate/capabilities) in den Capabilities festlegen. Wenn Sie `browserstack.debug` auf `true` setzen, wird ein Screencast der Sitzung aufgezeichnet, was hilfreich sein könnte.

### [Lokales Testen](https://www.browserstack.com/local-testing#command-line)

Wenn Sie Ihre Test-Applikation auf einem Server hosten, welcher lokal läuft (z.B. `localhost`) oder hinter einer Firewall, so ist die Nutzung von BrowserStack [Local Testing](https://www.browserstack.com/local-testing) erforderlich.

Es gehört nicht zur Aufgabe von WebdriverIO dieses Tool für Sie zu managen.

Wenn Sie dieses Feature allerdings nutzen wollen, können Sie es durch das Setzen von `browserstack.local` auf `true` tun.

Wenn Sie allerdings den WDIO-Testrunner nutzen und den Service [`@wdio/browserstack-service`](https://www.npmjs.com/package/@wdio/browserstack-service) in Ihrer `wdio.conf.js` konfigurieren, kann dieser das Starten des Tunnels für Sie übernehmen. Es hilft Ihnen auch mit der Integration von anderen Features in die BrowserStack Platform.

### Travis CI

Wenn Sie das Lokale Testing in Travis hinzufügen möchten, müssen Sie es selbst starten.

Das folgende Skript lädt BrowserStack Local Testing runter und führt es im Hintergrund aus. Sie sollten dies in Travis ausführen, bevor Sie die Tests starten.

```bash
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip
./BrowserStackLocal -v -onlyAutomate -forcelocal $BROWSERSTACK_ACCESS_KEY &
sleep 3
```

Außerdem sollten Sie auch die `build` Capability auf die Travis Build Nummer setzen.

zum Beispiel:

```javascript
browserName: 'chrome',
project: 'myApp',
version: '44.0',
build: 'myApp #' + process.env.TRAVIS_BUILD_NUMBER + '.' + process.env.TRAVIS_JOB_NUMBER,
'browserstack.local': 'true',
'browserstack.debug': 'true'
```

## [TestingBot](https://testingbot.com/)

Die einzige Voraussetzung ist die `user` und `key` Variablen in der Konfiguration zu setzen. Diese sollten aus den Umgebungsvariablen (z.B. über process.env.TESTINGBOT_USERNAME) herangezogen werden und nicht direct in der Konfiguration, für alle einsichtbar, festgelegt werde.

Sie können auch beliebige optionale [Test Konfigurationen](https://testingbot.com/support/other/test-options) in den Capabilities festlegen.

### [Lokales Testen](https://testingbot.com/support/other/tunnel)

Wenn Sie Ihre Test-Applikation auf einem Server hosten, welcher lokal läuft (z.B. `localhost`) oder hinter einer Firewall, so ist die Nutzung von BrowserStack [Local Testing](https://www.browserstack.com/local-testing) erforderlich. TestingBot bietet einen JAVA-basierten Tunnel, um Websites zu testen, die nicht über das Internet erreichbar sind.

Die TestingBot [Dokumentation](https://testingbot.com/support/other/tunnel) bietet alle notwendige Information darüber an.

Wenn Sie allerdings den WDIO-Testrunner nutzen und den Service [`@wdio/testingbot-service`](https://www.npmjs.com/package/@wdio/testingbot-service) in Ihrer `wdio.conf.js` konfigurieren, kann dieser das Starten des Tunnels für Sie übernehmen. Es hilft Ihnen auch mit der Integration von anderen Features in die TestingBot Platform.