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

- `appium:xxx`: [Appium](https://appium.io/docs/en/writing-running-appium/caps/)
- `selenoid:xxx`: [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)
- und viel, viel mehr!

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
 {label: 'Safari Edge', value: 'safari'},
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

Es scheint, dass Safari es [nicht unterstützt] (https://discussions.apple.com/thread/251837694) im Headless-Modus ausgeführt zu werden.

</TabItem>
</Tabs>
