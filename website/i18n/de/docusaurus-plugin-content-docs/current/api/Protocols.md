---
id: protocols
title: Protokollbefehle
---

WebdriverIO ist ein Automatisierungs-Framework, das sich auf verschiedene Automatisierungsprotokolle stützt, um eine Remote Software zu steuern, z. B. einen Browser, ein mobiles Gerät oder einen Fernseher. Je nachdem der zu automatisierenden Software kommen unterschiedliche Protokolle ins Spiel. Diese Befehle werden abhängig von den Sitzungsinformationen des entfernten Servers (z. B. Browsertreiber) dem Objekt [Browser](/docs/api/browser) oder [Element](/docs/api/element) zugewiesen.

Intern verwendet WebdriverIO Protokollbefehle für fast alle Interaktionen mit dem Remote-Agenten. Zusätzliche Befehle, die dem Objekt [Browser](/docs/api/browser) oder [Element](/docs/api/element) zugewiesen sind, vereinfachen jedoch die Verwendung von WebdriverIO, z. B. würde das Abrufen des Texts eines Elements mithilfe von Protokollbefehlen wie folgt aussehen:

```js
const searchInput = await browser.findElement('css selector', '#lst-ib')
await client.getElementText(searchInput['element-6066-11e4-a52e-4f735466cecf'])
```

Mit den praktischen Befehlen des Objekts [Browser](/docs/api/browser) oder [Element](/docs/api/element) kann dies reduziert werden auf:

```js
$('#lst-ib').getText()
```

Im folgenden Abschnitt wird jedes einzelne Protokoll erläutert.

## WebDriver-Protokoll

Das [WebDriver](https://w3c.github.io/webdriver/#elements) -Protokoll ist ein Webstandard zur Automatisierung von Browsern. Im Gegensatz zu einigen anderen E2E-Tools garantiert es, dass die Automatisierung auf aktuellen Browsern durchgeführt werden kann, die von Ihren Benutzern verwendet werden, z. B. Firefox, Safari und Chrome und Chromium-basierte Browser wie Edge, und nicht nur auf Browser-Engines, z. B. WebKit, die sich sehr unterschiedlich Verhalten können als richtige Browser.

Der Vorteil der Verwendung des WebDriver-Protokolls im Gegensatz zu Debugging-Protokollen wie [Chrome DevTools](https://w3c.github.io/webdriver/#elements) besteht darin, dass Sie über einen bestimmten Satz von Befehlen verfügen, die es ermöglichen, mit dem Browser in allen Browsern auf die gleiche Weise zu interagieren, wodurch die Wahrscheinlichkeit von Ungenauigkeiten verringert wird. Darüber hinaus bietet dieses Protokoll Fähigkeiten für eine massive Skalierbarkeit durch die Verwendung von Cloud-Anbietern wie [Sauce Labs](https://saucelabs.com/), [BrowserStack](https://www.browserstack.com/) und [anderen](https://github.com/christian-bromann/awesome-selenium#cloud-services).

## WebDriver Bidi-Protokoll

Das [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) -Protokoll ist die zweite Generation des Protokolls und wird derzeit von den Browserherstellern entwickelt. Im Vergleich zu seinem Vorgänger unterstützt das Protokoll eine bidirektionale Kommunikation (daher „Bidi“) zwischen dem Framework und dem entfernten Gerät. Darüber hinaus werden zusätzliche Funktionalität für eine bessere Browser-Introspektion eingeführt, um moderne Webanwendungen im Browser besser zu automatisieren.

Da dieses Protokoll derzeit in Arbeit ist, werden im Laufe der Zeit weitere Funktionen hinzugefügt und vom Browser unterstützt. Wenn Sie die komfortablen Befehle von WebdriverIO verwenden, ändert sich für Sie nichts. WebdriverIO wird diese neuen Protokollfunktionen nutzen, sobald sie verfügbar sind und im Browser unterstützt werden.

## Appium

Das [Appium](https://appium.io/) Projekt bietet Funktionen zur Automatisierung von Mobil-, Desktop- und allen anderen Arten von IoT-Geräten. Während sich WebDriver auf Browser und das Web konzentriert, ist die Vision von Appium, denselben Ansatz zu verwenden, jedoch für beliebige Geräte. Zusätzlich zu den von WebDriver definierten Befehlen verfügt es über spezielle Befehle, die häufig spezifisch für das zu automatisierende Remotegerät sind. Für mobile Testszenarien ist dies ideal, wenn Sie die gleichen Tests sowohl für Android als auch für iOS-Anwendungen schreiben und ausführen möchten.

Laut Appium [Dokumentation](https://appium.io/docs/en/about-appium/intro/?lang=en) wurde es entwickelt, um die Anforderungen der mobilen Automatisierung gemäß einer Philosophie zu erfüllen, die von den folgenden vier Grundsätzen umrissen wird:

- Sie sollten Ihre App nicht neu kompilieren oder in irgendeiner Weise ändern müssen, um sie zu automatisieren.
- Sie sollten nicht an eine bestimmte Sprache oder ein bestimmtes Framework gebunden sein, um Ihre Tests zu schreiben und auszuführen.
- Ein mobiles Automatisierungsframework sollte das Rad nicht neu erfinden, wenn es um Automatisierungs-APIs geht.
- Ein mobiles Automatisierungs-Framework sollte Open Source sein, sowohl im Geiste und in der Praxis als auch im Namen!

## Chromium

Das Chromium-Protokoll bietet zusätzlich zum WebDriver-Protokoll eine Reihe von Befehlen, die nur unterstützt werden, wenn eine automatisierte Sitzung über [Chromedriver](https://chromedriver.chromium.org/chromedriver-canary)ausgeführt wird.

## Firefox

Das Firefox-Protokoll bietet zusätzlich zum WebDriver-Protokoll eine Reihe von Befehlen, die nur unterstützt werden, wenn eine automatisierte Sitzung über [Geckodriver](https://github.com/mozilla/geckodriver)ausgeführt wird.

## Sauce Labs

Das [Sauce Labs](https://saucelabs.com/) -Protokoll bietet zusätzliche Befehle zum WebDriver-Protokoll, das nur unterstützt wird, wenn eine automatisierte Sitzung mit der Sauce Labs Cloud ausgeführt wird.

## Selenium Standalone

Das [Selenium Standalone](https://www.selenium.dev/documentation/grid/advanced_features/endpoints/) -Protokoll bietet zusätzliche Befehle zum WebDriver-Protokoll, das nur unterstützt wird, wenn eine automatisierte Sitzung mit dem Selenium Grid ausgeführt wird.

## JSON Wire Protocol

Das [JSON Wire Protocol](https://www.selenium.dev/documentation/legacy/json_wire_protocol/) ist der Vorläufer des WebDriver-Protokolls __und heute veraltet__. Einige Befehle werden zwar in bestimmten Umgebungen möglicherweise noch unterstützt, es wird jedoch nicht empfohlen, einen ihrer Befehle zu verwenden.

## Mobile JSON Wire Protocol

Das [Mobile JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md) ist eine Obermenge mobiler Befehle auf dem JSON Wire Protocol. Da dieses Protokoll veraltet ist, wird die Nutzung des Mobilen JSON Wire Protocol __nicht empfohlen__. Appium unterstützt möglicherweise noch einige seiner Befehle, aber es wird nicht empfohlen, sie zu verwenden.
