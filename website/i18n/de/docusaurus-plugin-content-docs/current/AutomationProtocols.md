---
id: automationProtocols
title: Automatisierungsprotokolle
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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

## DevTools-Protokoll

Die DevTools-Schnittstelle ist eine native Browserschnittstelle, die normalerweise zum Debuggen des Browsers von einer Remoteanwendung (z. B. [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)) verwendet wird. Neben seiner Fähigkeit, den Browser in nahezu allen möglichen Formen zu inspizieren, kann es auch zur Steuerung verwendet werden.

Während früher jeder Browser seine eigene interne DevTools-Oberfläche hatte, die dem Benutzer nicht wirklich offengelegt wurde, übernehmen jetzt immer mehr Browser das [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). Es wird verwendet, um entweder eine Webanwendung mit Chrome DevTools zu debuggen oder Chrome mit Tools wie [Puppeteer](https://pptr.dev)zu steuern.

Die Kommunikation erfolgt ohne Proxy direkt zum Browser über WebSockets:

![DevTools-Setup](/img/devtools.png)

WebdriverIO ermöglicht es Ihnen, die DevTools-Funktionen als alternative Automatisierungstechnologie für WebDriver zu verwenden, wenn Sie spezielle Anforderungen zur Automatisierung des Browsers haben. Mit dem [`devtools`](https://www.npmjs.com/package/devtools) NPM-Paket können Sie dieselben Befehle verwenden, die WebDriver bereitstellt, die dann von WebdriverIO und dem WDIO-Testrunner verwendet werden können, um seine nützlichen Befehle zusätzlich zu diesem Protokoll auszuführen. Es verwendet Puppeteer bis unter die Haube und ermöglicht es Ihnen, bei Bedarf eine Folge von Befehlen mit Puppeteer auszuführen.

Um DevTools als Ihr Automatisierungsprotokoll zu verwenden, schalten Sie das Flag `automationProtocol` in Ihren Konfigurationen auf `devtools` um oder führen Sie einfach WebdriverIO aus, ohne dass ein Browsertreiber im Hintergrund ausgeführt wird.

<Tabs
  defaultValue="testrunner"
  values={[
    {label: 'Testrunner', value: 'testrunner'},
 {label: 'Standalone', value: 'standalone'},
 ]
}>
<TabItem value="testrunner">

```js title="wdio.conf.js"
export const config = {
    // ...
    automationProtocol: 'devtools'
    // ...
}
```
```js title="devtools.e2e.js"
describe('my test', () => {
    it('can use Puppeteer as automation fallback', async () => {
        // WebDriver command
        await browser.url('https://webdriver.io')

        // get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
        const puppeteer = await browser.getPuppeteer()

        // use Puppeteer interfaces
        const page = (await puppeteer.pages())[0]
        await page.setRequestInterception(true)
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('webdriverio.png')) {
                return interceptedRequest.continue({
                    url: 'https://webdriver.io/img/puppeteer.png'
                })
            }

            interceptedRequest.continue()
        })

        // continue with WebDriver commands
        await browser.url('https://webdriver.io')

        /**
         * WebdriverIO logo is no replaced with the Puppeteer logo
         */
    })
})
```

__Note:__ there is no need to have either `selenium-standalone` or `chromedriver` services installed.

Wir empfehlen, Ihre Puppeteer-Aufrufe in den Befehl „call“ einzuschließen, sodass alle Aufrufe ausgeführt werden, bevor WebdriverIO mit dem nächsten WebDriver-Befehl fortfährt.

</TabItem>
<TabItem value="standalone">

```js
import { remote } from 'webdriverio'

const browser = await remote({
    automationProtocol: 'devtools',
    capabilities: {
        browserName: 'chrome'
    }
})

// WebDriver command
await browser.url('https://webdriver.io')

// get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
const puppeteer = await browser.getPuppeteer()

// switch to Puppeteer to intercept requests
const page = (await puppeteer.pages())[0]
await page.setRequestInterception(true)
page.on('request', interceptedRequest => {
    if (interceptedRequest.url().endsWith('webdriverio.png')) {
        return interceptedRequest.continue({
            url: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png'
        })
    }

    interceptedRequest.continue()
})

// continue with WebDriver commands
await browser.refresh()
await browser.pause(2000)

await browser.deleteSession()
```

</TabItem>
</Tabs>

Durch den Zugriff auf die Puppeteer-Oberfläche haben Sie Zugriff auf eine Vielzahl neuer Funktionen, um den Browser und Ihre Anwendung zu automatisieren oder zu inspizieren, z. B.: das Abfangen von Netzwerkanfragen (siehe oben), das Verfolgen des Browsers, das Drosseln von CPU- oder Netzwerkfunktionen und vieles mehr.

### `wdio:devtoolsOptions` Capability

Wenn Sie WebdriverIO-Tests über das DevTools-Paket ausführen, können Sie [benutzerdefinierte Puppeteer-Optionen](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions)anwenden. Diese Optionen werden direkt an die Methoden [`launch`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions) oder [`connect`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerconnectoptions) von Puppeteer übergeben. Andere benutzerdefinierte Devtools-Optionen sind die folgenden:

#### customPort
Starten Sie Chrome auf einem benutzerdefinierten Port.

Type: `number`<br /> Default: `9222` (default of Puppeteer)

Hinweis: Wenn Sie die Optionen `goog:chromeOptions/debuggerAddress`, `wdio:devtoolsOptions/browserWSEndpoint` oder `wdio:devtoolsOptions/browserURL` übergeben, versucht WebdriverIO, eine Verbindung mit den angegebenen Verbindungsdetails herzustellen, anstatt einen Browser zu starten. Sie können sich beispielsweise mit der Testingbots-Cloud verbinden über:

```js
import { format } from 'util'
import { remote } from 'webdriverio'

(async () => {
    const browser = await remote({
        capabilities: {
            'wdio:devtoolsOptions': {
                browserWSEndpoint: format(
                    `wss://cloud.testingbot.com?key=%s&secret=%s&browserName=chrome&browserVersion=latest`,
                    process.env.TESTINGBOT_KEY,
                    process.env.TESTINGBOT_SECRET
                )
            }
        }
    })

    await browser.url('https://webdriver.io')

    const title = await browser.getTitle()
    console.log(title) // returns "should return "WebdriverIO - click""

    await browser.deleteSession()
})()
```

### Vorteile

- Zugriff auf weitere Automatisierungsfunktionen (z. B. Netzwerküberwachung, Tracing usw.)
- Browsertreiber müssen nicht verwaltet werden

### Nachteile

- Unterstützt nur Chromium-basierte Browser (z. B. Chrome, Chromium Edge) und (teilweise) Firefox
- Unterstützt __nicht__ die Ausführung auf Cloud-Anbietern wie Sauce Labs, BrowserStack etc.
