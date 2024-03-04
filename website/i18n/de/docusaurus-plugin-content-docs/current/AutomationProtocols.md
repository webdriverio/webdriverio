---
id: automationProtocols
title: Automatisierungsprotokolle
---

Mit WebdriverIO können Sie zwischen mehreren Automatisierungstechnologien wählen, wenn Sie Ihre E2E-Tests lokal oder in der Cloud ausführen. By default, WebdriverIO will attempt to start a local automation session using the [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol.

## WebDriver Bidi Protocol

The [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) is an automation protocol to automate browsers using bi-directional communication. It's the successor of the [WebDriver](https://w3c.github.io/webdriver/) protocol and enables a lot more introspection capabilities for various testing use cases.

This protocol is currently under development and new primitives might be added in the future. All browser vendors have committed to implementing this web standard and a lot of [primitives](https://wpt.fyi/results/webdriver/tests/bidi?label=experimental&label=master&aligned) have already been landed in browsers.

## WebDriver-Protokoll

> [WebDriver](https://w3c.github.io/webdriver/) ist eine Fernsteuerungsschnittstelle, die die Selbstprüfung und Kontrolle von Remote Software ermöglicht. Es bietet ein plattform- und sprachneutrales Protokoll als Möglichkeit für Out-of-Process-Programme, das Verhalten von Webbrowsern aus der Ferne anzuweisen.

Das WebDriver-Protokoll wurde entwickelt, um einen Browser aus der Benutzerperspektive zu automatisieren, was bedeutet, dass Sie alles, was ein Benutzer tun kann, mit dem Browser tun können. Es stellt eine Reihe von Befehlen bereit, die allgemeine Interaktionen mit einer Anwendung abstrahieren (z. B. Navigieren, Klicken oder Lesen des Zustands eines Elements). Since it is a web standard, it is well supported across all major browser vendors and also is being used as an underlying protocol for mobile automation using [Appium](http://appium.io).

Um dieses Automatisierungsprotokoll zu verwenden, benötigen Sie einen Proxy-Server, der alle Befehle übersetzt und in der Zielumgebung (d.h. dem Browser oder der mobilen App) ausführt.

Für die Browserautomatisierung ist der Proxyserver normalerweise der Browsertreiber. Es sind Treiber für alle Browser verfügbar:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

Für jede Art von mobiler Automatisierung müssen Sie [Appium](http://appium.io)installieren und einrichten. Es ermöglicht Ihnen, mobile (iOS/Android) oder sogar Desktop- (macOS/Windows) Anwendungen mit demselben WebdriverIO-Setup zu automatisieren.

Es gibt auch viele Dienste, mit denen Sie Ihren Automatisierungstest in großem Umfang in der Cloud ausführen können. Anstatt all diese Treiber lokal einrichten zu müssen, können Sie einfach mit diesen Diensten (z. B. [Sauce Labs](https://saucelabs.com)) in der Cloud sprechen und die Ergebnisse auf ihrer Plattform überprüfen. Die Kommunikation zwischen Testskript und Automatisierungsumgebung sieht wie folgt aus:

![WebDriver-Setup](/img/webdriver.png)
