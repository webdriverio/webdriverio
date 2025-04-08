---
id: file-download
title: Datei-Download
---

Bei der Automatisierung von Datei-Downloads im Web-Testing ist es wichtig, diese über verschiedene Browser hinweg konsistent zu handhaben, um eine zuverlässige Testausführung zu gewährleisten.

Hier bieten wir Best Practices für Datei-Downloads und zeigen, wie Download-Verzeichnisse für **Google Chrome**, **Mozilla Firefox** und **Microsoft Edge** konfiguriert werden können.

## Download-Pfade

Das **Hardcoding** von Download-Pfaden in Testskripten kann zu Wartungsproblemen und Portabilitätsproblemen führen. Verwenden Sie **relative Pfade** für Download-Verzeichnisse, um die Portabilität und Kompatibilität in verschiedenen Umgebungen zu gewährleisten.

```javascript
// 👎
// Fest codierter Download-Pfad
const downloadPath = '/path/to/downloads';

// 👍
// Relativer Download-Pfad
const downloadPath = path.join(__dirname, 'downloads');
```

## Warte-Strategien

Ohne angemessene Warte-Strategien kann es zu Race Conditions oder unzuverlässigen Tests kommen, insbesondere beim Warten auf den Abschluss eines Downloads. Implementieren Sie **explizite** Warte-Strategien, um auf den Abschluss von Datei-Downloads zu warten und die Synchronisation zwischen Testschritten zu gewährleisten.

```javascript
// 👎
// Keine explizite Wartezeit für den Abschluss des Downloads
await browser.pause(5000);

// 👍
// Warten auf den Abschluss des Datei-Downloads
await waitUntil(async ()=> await fs.existsSync(downloadPath), 5000);
```

## Konfigurieren von Download-Verzeichnissen

Um das Datei-Download-Verhalten für **Google Chrome**, **Mozilla Firefox** und **Microsoft Edge** zu überschreiben, geben Sie das Download-Verzeichnis in den WebDriverIO-Capabilities an:

<Tabs
defaultValue="chrome"
values={[
{label: 'Chrome', value: 'chrome'},
{label: 'Firefox', value: 'firefox'},
{label: 'Microsoft Edge', value: 'edge'},
]
}>

<TabItem value='chrome'>

```javascript reference title="wdio.conf.js"

https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L8-L16

```

</TabItem>

<TabItem value='firefox'>

```javascript reference title="wdio.conf.js"

https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L20-L32

```

</TabItem>

<TabItem value='edge'>

```javascript reference title="wdio.conf.js"

https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L36-L44

```

</TabItem>

</Tabs>

Für eine Beispielimplementierung siehe das [WebdriverIO Test Download Behavior Recipe](https://github.com/webdriverio/example-recipes/tree/main/testDownloadBehavior).

## Konfigurieren von Chromium-Browser-Downloads

Um den Download-Pfad für __Chromium-basierte__ Browser (wie Chrome, Edge, Brave usw.) zu ändern, verwenden Sie die `getPuppeteer`-Methode von WebDriverIO für den Zugriff auf Chrome DevTools.

```javascript
const page = await browser.getPuppeteer();
// Initiieren einer CDP-Sitzung:
const cdpSession = await page.target().createCDPSession();
// Setzen des Download-Pfads:
await cdpSession.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });
```

## Umgang mit mehreren Datei-Downloads

Bei Szenarien mit mehreren Datei-Downloads ist es wichtig, Strategien zu implementieren, um jeden Download effektiv zu verwalten und zu validieren. Betrachten Sie die folgenden Ansätze:

__Sequentielle Download-Behandlung:__ Laden Sie Dateien nacheinander herunter und überprüfen Sie jeden Download, bevor Sie den nächsten starten, um eine geordnete Ausführung und genaue Validierung zu gewährleisten.

__Parallele Download-Behandlung:__ Nutzen Sie asynchrone Programmiertechniken, um mehrere Datei-Downloads gleichzeitig zu starten und die Testausführungszeit zu optimieren. Implementieren Sie robuste Validierungsmechanismen, um alle Downloads nach Abschluss zu überprüfen.

## Überlegungen zur browserübergreifenden Kompatibilität

Obwohl WebDriverIO eine einheitliche Schnittstelle für die Browser-Automatisierung bietet, ist es wichtig, Unterschiede im Browser-Verhalten und in den Funktionen zu berücksichtigen. Testen Sie Ihre Datei-Download-Funktionalität in verschiedenen Browsern, um Kompatibilität und Konsistenz zu gewährleisten.

__Browser-spezifische Konfigurationen:__ Passen Sie die Einstellungen für Download-Pfade und Warte-Strategien an, um Unterschiede im Browser-Verhalten und in den Einstellungen zwischen Chrome, Firefox, Edge und anderen unterstützten Browsern zu berücksichtigen.

__Browser-Versionskompatibilität:__ Aktualisieren Sie regelmäßig Ihre WebDriverIO- und Browser-Versionen, um die neuesten Funktionen und Verbesserungen zu nutzen und gleichzeitig die Kompatibilität mit Ihrer bestehenden Testsuite zu gewährleisten.
