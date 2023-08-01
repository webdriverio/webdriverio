---
id: capabilities
title: Capabilities
---

Eine Capability ist eine Definition für eine entfernte Software. Es hilft WebdriverIO zu verstehen, in welchem Browser oder in welcher mobilen Umgebung Sie Ihre Tests ausführen möchten. Capabilities sind weniger wichtig, wenn Sie Tests lokal entwickeln, da Sie sie die meiste Zeit auf einer Remote-Schnittstelle ausführen, werden aber wichtiger, wenn Sie eine große Anzahl von Integrationstests in CI/CD ausführen.

:::info

Das Format eines Capability-Objekts ist durch die [WebDriver-Spezifikation](https://w3c.github.io/webdriver/#capabilities)genau definiert. Der WebdriverIO-Testrunner schlägt vorzeitig fehl, wenn benutzerdefinierte Funktionen diese Spezifikation nicht einhalten.

:::

## Benutzerdefinierte Capabilities

Während die Menge an fest definierten Fähigkeiten sehr gering ist, kann jeder benutzerdefinierte Fähigkeiten bereitstellen und akzeptieren, die spezifisch für den Automatisierungstreiber oder die Remote-Schnittstelle sind:

### Browserspezifische Capability-Erweiterungen

- `goog:chromeOptions`: [Chromedriver](https://chromedriver.chromium.org/capabilities) Erweiterungen, nur zum Testen in Chrome anwendbar
- `moz:firefoxOptions`: [Geckodriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html) Erweiterungen, nur anwendbar zum Testen in Firefox
- `ms:edgeOptions`: [EdgeOptions](https://learn.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options) zum Angeben der Umgebung bei Verwendung von EdgeDriver zum Testen von Chromium Edge

### Capability Erweiterungen von Cloud-Anbietern

- `sauce:options`: [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#w3c-webdriver-browser-capabilities--optional)
- `bstack:options`: [BrowserStack](https://www.browserstack.com/docs/automate/selenium/organize-tests)
- `tb:options`: [TestingBot](https://testingbot.com/support/other/test-options)
- und viel, viel mehr!

### Erweiterungen der Automation Engine-Capabilities

- `appium:xxx`: [Appium](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/)
- `selenoid:xxx`: [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)
- und viel, viel mehr!

### WebdriverIO Capabilities to manage browser driver options

WebdriverIO manages installing and running browser driver for you. In order to propagate options to the driver you can use the following custom capabilities:

- `wdio:chromedriverOptions`: manage Chromedriver options (see `chromedriver --help` for more information)
- `wdio:safaridriverOptions`: manage Safaridriver [options](https://github.com/webdriverio-community/node-safaridriver#options)
- `wdio:geckodriverOptions`: manage Geckodriver [options](https://github.com/webdriverio-community/node-geckodriver#options)
- `wdio:edgedriverOptions`: manage Edgedriver [options](https://github.com/webdriverio-community/node-edgedriver#options)

Sehen Sie sich WebdriverIOs [Capability TypeScript definition](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc) an, um bestimmte Funktionen für Ihren Test zu finden. Hinweis: Nicht alle sind noch gültig und werden möglicherweise nicht mehr vom Anbieter unterstützt.

## Spezielle Capabilities für spezielle Anwendungsfälle

Dies ist eine Liste von Beispielen, die zeigen, welche Fähigkeiten angewendet werden müssen, um einen bestimmten Anwendungsfall zu erreichen.

### Führen Sie den Browser Headless aus

Das Ausführen eines Headless-Browsers bedeutet, eine Browserinstanz ohne Fenster oder Benutzeroberfläche auszuführen. Dies wird hauptsächlich in CI/CD-Umgebungen verwendet, in denen kein Display verwendet wird. Wenden Sie die folgenden Funktionen an, um einen Browser im Headless-Modus auszuführen:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
 {label: 'Firefox', value: 'firefox'},
 {label: 'Microsoft Edge', value: 'msedge'},
 {label: 'Safari', value: 'safari'},
 ]
}>
<TabItem value="chrome">

```ts
{
    browserName: 'chrome',
    'goog:chromeOptions': {
        args: ['headless', 'disable-gpu']
    }
}
```

</TabItem>
<TabItem value="firefox">

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        args: ['-headless']
    }
```

</TabItem>
<TabItem value="msedge">

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        args: ['--headless']
    }
```

</TabItem>
<TabItem value="safari">

It seems that Safari [doesn't support](https://discussions.apple.com/thread/251837694) running in headless mode.

</TabItem>
</Tabs>

### Automate Different Browser Channels

If you like to test a browser version that is not yet released as stable, e.g. Chrome Canary, you can do so by setting capabilities and pointing to the browser you like to start, e.g.:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
 {label: 'Firefox', value: 'firefox'},
 {label: 'Microsoft Edge', value: 'msedge'},
 {label: 'Safari', value: 'safari'},
 ]
}>
<TabItem value="chrome">

When testing on Chrome, WebdriverIO will automatically download the desired browser version and driver for you based on the defined `browserVersion`, e.g.:

```ts
{
    browserName: 'chrome',
    browserVersion: 'stable' // or 'dev', 'canary', 'beta'
}
```

</TabItem>
<TabItem value="firefox">

When testing on Firefox, make sure you have the desired browser version installed on your machine. You can point WebdriverIO to the browser to execute via:

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        bin: '/Applications/Firefox\ Nightly.app/Contents/MacOS/firefox'
    }
```

</TabItem>
<TabItem value="msedge">

When testing on Micrsoft Edge, make sure you have the desired browser version installed on your machine. You can point WebdriverIO to the browser to execute via:

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        bin: '/Applications/Microsoft\ Edge\ Canary.app/Contents/MacOS/Microsoft\ Edge\ Canary'
    }
```

</TabItem>
<TabItem value="safari">

When testing on Safari, make sure you have the [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/) installed on your machine. You can point WebdriverIO to that version via:

```ts
    browserName: 'safari technology preview'
```

</TabItem>
</Tabs>
