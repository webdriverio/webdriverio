---
id: automationProtocols
title: Automatisierungsprotokolle
---

Mit WebdriverIO können Sie zwischen mehreren Automatisierungstechnologien wählen, wenn Sie Ihre E2E-Tests lokal oder in der Cloud ausführen. Standardmäßig sucht WebdriverIO immer nach einem Browsertreiber, der mit dem WebDriver-Protokoll auf `localhost:4444` kompatibel ist. Wenn es einen solchen Treiber nicht finden kann, nutzt es das Chrome DevTools mit Puppeteer.

Fast alle modernen Browser, die [WebDriver](https://w3c.github.io/webdriver/) unterstützen, unterstützen auch eine andere native Schnittstelle namens [DevTools](https://chromedevtools.github.io/devtools-protocol/) , die für Automatisierungszwecke verwendet werden kann.

Beide haben je nach Anwendungsfall und Umgebung Vor- und Nachteile.

## WebDriver-Protokoll

> [WebDriver](https://w3c.github.io/webdriver/) ist eine Fernsteuerungsschnittstelle, die die Selbstprüfung und Kontrolle von Remote Software ermöglicht. Es bietet ein plattform- und sprachneutrales Protokoll als Möglichkeit für Out-of-Process-Programme, das Verhalten von Webbrowsern aus der Ferne anzuweisen.

Das WebDriver-Protokoll wurde entwickelt, um einen Browser aus der Benutzerperspektive zu automatisieren, was bedeutet, dass Sie alles, was ein Benutzer tun kann, mit dem Browser tun können. Es stellt eine Reihe von Befehlen bereit, die allgemeine Interaktionen mit einer Anwendung abstrahieren (z. B. Navigieren, Klicken oder Lesen des Zustands eines Elements). Da es sich um einen Webstandard handelt, wird er von allen großen Browseranbietern gut unterstützt und wird auch als zugrunde liegendes Protokoll für die mobile Automatisierung mit [Appium](http://appium.io)verwendet.

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

### Vorteile

- Offizieller W3C-Webstandard, der von allen gängigen Browsern unterstützt wird
- Vereinfachtes Protokoll, das allgemeine Benutzerinteraktionen abdeckt
- Unterstützung für mobile Automatisierung (und sogar native Desktop-Apps)
- Kann sowohl lokal als auch in der Cloud über Dienste wie [Sauce Labs](https://saucelabs.com)verwendet werden

### Nachteile

- Nicht für tiefgreifende Browseranalysen ausgelegt (z. B. Verfolgen oder Abfangen von Netzwerkereignissen)
- Eingeschränkte Automatisierungsfunktionen (z. B. keine Unterstützung zum Drosseln von CPU oder Netzwerk)
- Zusätzlicher Aufwand zur Einrichtung des Browsertreibers mit selenium-standalone/chromedriver/etc
