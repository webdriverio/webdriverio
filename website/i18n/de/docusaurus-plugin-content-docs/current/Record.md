---
id: record
title: Tests Aufzeichnen
---

Chrome DevTools verfügt über ein _Recorder_ Panel, mit dem Benutzer automatisierte Schritte in Chrome aufzeichnen und wiedergeben können. Diese Schritte können mit einer Chrome-Erweiterung [in WebdriverIO-Tests exportiert](https://chrome.google.com/webstore/detail/webdriverio-chrome-record/pllimkccefnbmghgcikpjkmmcadeddfn?hl=en&authuser=1) werden, was das Erstellen von Tests kinderleicht macht.

## Was ist Chrome DevTools Recorder

Der [Chrome DevTools Recorder](https://developer.chrome.com/docs/devtools/recorder/) ist ein Tool, mit dem Sie Testaktionen direkt im Browser aufzeichnen und wiedergeben und auch als JSON exportieren (oder in e2e-Test exportieren) sowie die Test-Geschwindigkeit messen können.

Das Tool ist unkompliziert, und da es als Browser Erweiterung agiert, brauchen wir weniger den Kontext wechseln oder mit einem Drittanbieter-Tool arbeiten.

## So zeichnen Sie einen Test mit Chrome DevTools Recorder auf

Wenn Sie den neuesten Chrome Browser haben, ist der Rekorder bereits installiert und für Sie verfügbar. Öffnen Sie einfach eine beliebige Website, machen Sie einen Rechtsklick und wählen Sie _"Inspizieren"_. Innerhalb von DevTools können Sie den Recorder öffnen, indem Sie `CMD/Control` + `Shift` + `p` drücken und _„Show Recorder“_ eingeben.

![Chrome DevTools Recorder](/img/recorder/recorder.png)

Um die Aufzeichnung einer User Journey zu starten, klicken Sie auf _„Neue Aufzeichnung starten“_, geben Sie Ihrem Test einen Namen und verwenden Sie dann den Browser, um Ihren Test aufzuzeichnen:

![Chrome DevTools Recorder](/img/recorder/demo.gif)

Klicken Sie im nächsten Schritt auf _"Replay"_ , um zu überprüfen, ob die Aufnahme erfolgreich war und das tut, was Sie tun wollten. Wenn alles in Ordnung ist, klicken Sie auf das Symbol [export](https://developer.chrome.com/docs/devtools/recorder/reference/#recorder-extension) und wählen Sie _"Export as a WebdriverIO Test Script"_:

Die Option _„Als WebdriverIO-Testskript exportieren“_ ist nur verfügbar, wenn Sie die Erweiterung [WebdriverIO Chrome Recorder](https://chrome.google.com/webstore/detail/webdriverio-chrome-record/pllimkccefnbmghgcikpjkmmcadeddfn) installieren.


![Chrome DevTools Recorder](/img/recorder/export.gif)

So einfach ist das!

## Aufzeichnung Exportieren

Wenn Sie den Flow als WebdriverIO-Testskript exportiert haben, sollte der Browser ein Skript herunterladen, das Sie kopieren & in Ihre Testsuite einfügen können. Beispielsweise sieht die obige Aufzeichnung wie folgt aus:

```ts
describe("My WebdriverIO Test", function () {
  it("tests My WebdriverIO Test", function () {
    await browser.setWindowSize(1026, 688)
    await browser.url("https://webdriver.io/")
    await browser.$("#__docusaurus > div.main-wrapper > header > div").click()
    await browser.$("#__docusaurus > nav > div.navbar__inner > div:nth-child(1) > a:nth-child(3)").click()rec
    await browser.$("#__docusaurus > div.main-wrapper.docs-wrapper.docs-doc-page > div > aside > div > nav > ul > li:nth-child(4) > div > a").click()
    await browser.$("#__docusaurus > div.main-wrapper.docs-wrapper.docs-doc-page > div > aside > div > nav > ul > li:nth-child(4) > ul > li:nth-child(2) > a").click()
    await browser.$("#__docusaurus > nav > div.navbar__inner > div.navbar__items.navbar__items--right > div.searchBox_qEbK > button > span.DocSearch-Button-Container > span").click()
    await browser.$("#docsearch-input").setValue("click")
    await browser.$("#docsearch-item-0 > a > div > div.DocSearch-Hit-content-wrapper > span").click()
  });
});
```

Stellen Sie sicher, dass Sie einige der Locators überprüfen und sie bei Bedarf durch widerstandsfähigere [Selektortypen](/docs/selectors) ersetzen. Sie können den Flow auch als JSON-Datei exportieren und das Paket [`@wdio/chrome-recorder`](https://github.com/webdriverio/chrome-recorder) verwenden, um ihn in ein tatsächliches Testskript umzuwandeln.

## Nächste Schritte

Sie können diesen Flow verwenden, um auf einfache Weise Tests für Ihre Anwendungen zu erstellen. Der Chrome DevTools Recorder hat verschiedene zusätzliche Funktionen, z.B.:

- [Langsames Netzwerk simulieren](https://developer.chrome.com/docs/devtools/recorder/#simulate-slow-network) oder
- [Messen der Test-Geschwindigkeit](https://developer.chrome.com/docs/devtools/recorder/#measure)

Schauen Sie sich die [Recorder Dokumentation](https://developer.chrome.com/docs/devtools/recorder) an.
