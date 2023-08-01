---
id: setuptypes
title: Setup-Typen
---

WebdriverIO kann für verschiedene Zwecke verwendet werden. Es implementiert die WebDriver-Protokoll-API und kann einen Browser automatisiert ausführen. Das Framework ist so konzipiert, dass es in jeder beliebigen Umgebung und für jede Art von Aufgabe gewappnet ist. Es ist unabhängig von Frameworks von Drittanbietern und benötigt nur Node.js, um ausgeführt zu werden.

## Protokollbindungen

Für grundlegende Interaktionen mit dem WebDriver und anderen Automatisierungsprotokollen verwendet WebdriverIO seine eigenen Protokollbindungen basierend auf dem [`webdriver`](https://www.npmjs.com/package/webdriver) NPM-Paket:

<Tabs
  defaultValue="webdriver"
  values={[
    {label: 'WebDriver', value: 'webdriver'},
 {label: 'Chrome DevTools', value: 'devtools'},
 ]
}>
<TabItem value="webdriver">

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/webdriver.js#L5-L20
```

</TabItem>
<TabItem value="devtools">

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/devtools.js#L2-L17
```

</TabItem>
</Tabs>

Alle [Protokollbefehle](api/webdriver) geben die rohe Antwort vom Automatisierungstreiber zurück. Das Paket ist sehr leicht und es gibt __keine__ intelligente Logik wie automatische Wartezeiten um die Interaktion mit der Protokollnutzung zu vereinfachen.

Die auf die Instanz angewendeten Protokollbefehle hängen von dem Sitzungstyp des Treibers ab. Wenn der Treiber beispielsweise eine mobile Sitzung startet, wendet das Paket alle Appium- und Mobile JSON Wire-Protokollbefehle auf den Instanzprototyp an.

Sie können denselben Befehlssatz (mit Ausnahme der mobilen) mithilfe des Chrome DevTools-Protokolls ausführen, wenn Sie das [`devtools`](https://www.npmjs.com/package/devtools) NPM-Paket importieren. Es hat das gleiche Interface wie das Paket `webdriver`, führt seine Automatisierung jedoch basierend auf [Puppeteer](https://pptr.dev/) aus.

Weitere Informationen zu diesen Paketschnittstellen finden Sie unter [Modules API](/docs/api/modules).

## Standalone-Modus

Um die Interaktion mit dem WebDriver-Protokoll zu vereinfachen, implementiert das Paket `webdriverio` eine Vielzahl von Befehlen, die auf Befehle des WebDriver Protokoll aufbauen (z. B. den Befehl [`dragAndDrop`](api/element/dragAndDrop)) und Kernkonzepte wie [intelligente Selektoren](selectors) oder [automatische Wartezeiten](autowait) beinhalten. Das obige Beispiel lässt sich wie folgt vereinfachen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/standalone.js#L2-L19
```

Die Verwendung von WebdriverIO im Standalone-Modus gibt Ihnen weiterhin Zugriff auf alle Protokollbefehle, bietet jedoch einen zusätzlichen Satz an Befehlen, die eine vereinfachte Interaktion mit dem Browser ermöglichen. Damit können Sie WebdriverIO in Ihr eigenes (Test-)Projekt integrieren, um z.B. eine neue Automatisierungsbibliothek zu erstellen. Beliebte Beispiele sind [Spectron](https://www.electronjs.org/spectron) oder [CodeceptJS](http://codecept.io). Sie können auch einfache NodeJS-Skripte schreiben, um das Web nach Inhalten zu durchsuchen (oder alles andere, was einen Browser erfordert).

If no specific options are set WebdriverIO will always attempt to download at setup the browser driver that matches `browserName` property in your capabilities. In case of Chrome it might also install [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) depending on whether it can find a browser on the machine.

Weitere Informationen zu den `webdriverio` Paketschnittstellen finden Sie unter [Modules API](/docs/api/modules).

## Der WDIO-Testrunner

Der Hauptzweck von WebdriverIO ist das Testen von Applikationen von end-to-end (E2E) in großem Umfang zu ermöglichen. Deshalb haben wir einen Testrunner implementiert, der Ihnen hilft, eine zuverlässige Testsuite aufzubauen, die einfach zu lesen und zu warten ist.

Der Test Runner kümmert sich um viele Probleme, die bei der Arbeit mit einfachen Automatisierungsbibliotheken üblich sind. Zum einen organisiert es Ihre Testläufe und teilt Testspezifikationen auf, sodass Ihre Tests mit maximaler Parallelität ausgeführt werden können. Es übernimmt das Starten und Beenden des Browsers und bietet viele Funktionen, die Ihnen helfen, Probleme zu debuggen und Fehler in Ihren Tests zu finden.

Hier ist dasselbe Beispiel von oben, als Testspezifikation geschrieben und von WDIO ausgeführt:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/setup/testrunner.js
```

Der Testrunner ist eine Abstraktion beliebter Testframeworks wie Mocha, Jasmine oder Cucumber. Um Ihre Tests mit dem WDIO-Test-Runner auszuführen, lesen Sie den Abschnitt [Erste Schritte](gettingstarted) für weitere Informationen.

Weitere Informationen zur `@wdio/cli` Testrunner-Paketschnittstelle finden Sie unter [Modules API](/docs/api/modules).
