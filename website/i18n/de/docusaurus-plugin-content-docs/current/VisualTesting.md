---
id: visual-testing
title: Visual Testing
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Was kann es leisten?

WebdriverIO bietet Bildvergleiche auf Bildschirmen, Elementen oder einer vollständigen Seite für

- 🖥️ Desktop-Browser (Chrome / Firefox / Safari / Microsoft Edge)
- 📱 Mobile / Tablet-Browser (Chrome auf Android-Emulatoren / Safari auf iOS-Simulatoren / Simulatoren / echte Geräte) via Appium
- 📱 Native Apps (Android-Emulatoren / iOS-Simulatoren / echte Geräte) via Appium (🌟 **NEU** 🌟)
- 📳 Hybrid-Apps via Appium

durch den [`@wdio/visual-service`](https://www.npmjs.com/package/@wdio/visual-service), einen leichtgewichtigen WebdriverIO-Service.

Dies ermöglicht:

- Speichern oder Vergleichen von **Bildschirmen/Elementen/Vollseiten-Screenshots** mit einer Baseline
- automatisches **Erstellen einer Baseline**, wenn keine vorhanden ist
- **Ausblenden benutzerdefinierter Bereiche** und sogar **automatisches Ausschließen** von Status- und Symbolleisten (nur mobile) während eines Vergleichs
- Vergrößerung der Element-Dimensions-Screenshots
- **Text ausblenden** während des Website-Vergleichs, um:
  - die **Stabilität zu verbessern** und Unbeständigkeit bei der Schriftartendarstellung zu verhindern
  - sich nur auf das **Layout** einer Website zu konzentrieren
- Verwendung **verschiedener Vergleichsmethoden** und eine Reihe **zusätzlicher Matcher** für besser lesbare Tests
- Überprüfung, wie Ihre Website **die Tabulatortaste unterstützt**, siehe auch [Durch eine Website tabulieren](#durch-eine-website-tabulieren)
- und vieles mehr, siehe die [Service-](./visual-testing/service-options) und [Methoden-](./visual-testing/method-options)optionen

Der Service ist ein leichtgewichtiges Modul, um die benötigten Daten und Screenshots für alle Browser/Geräte abzurufen. Die Vergleichsfunktionalität stammt von [ResembleJS](https://github.com/Huddle/Resemble.js). Wenn Sie Bilder online vergleichen möchten, können Sie das [Online-Tool](http://rsmbl.github.io/Resemble.js/) verwenden.

:::info HINWEIS für Native/Hybrid-Apps

Bitte verwenden Sie die Eigenschaft `isHybridApp:true` in Ihren Service-Einstellungen, wenn Sie ihn für Hybrid-Apps nutzen möchten.
:::

## Installation

Am einfachsten ist es, `@wdio/visual-service` als Dev-Abhängigkeit in Ihrer `package.json` zu behalten, via:

```sh
npm install --save-dev @wdio/visual-service
```

## Verwendung

`@wdio/visual-service` kann als normaler Service verwendet werden. Sie können ihn in Ihrer Konfigurationsdatei folgendermaßen einrichten:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/visual-testing/service-options.js
```

Weitere Service-Optionen finden Sie [hier](/docs/visual-testing/service-options).

Sobald es in Ihrer WebdriverIO-Konfiguration eingerichtet ist, können Sie visuelle Prüfungen zu [Ihren Tests](/docs/visual-testing/writing-tests) hinzufügen.

### Capabilities

Um das Visual Testing-Modul zu verwenden, **müssen Sie keine zusätzlichen Optionen zu Ihren Capabilities hinzufügen**. In einigen Fällen möchten Sie jedoch möglicherweise zusätzliche Metadaten zu Ihren visuellen Tests hinzufügen, wie zum Beispiel einen `logName`.

Der `logName` ermöglicht es Ihnen, jeder Capability einen benutzerdefinierten Namen zuzuweisen, der dann in die Dateinamen der Bilder aufgenommen werden kann. Dies ist besonders nützlich, um Screenshots zu unterscheiden, die auf verschiedenen Browsern, Geräten oder Konfigurationen aufgenommen wurden.

Um dies zu aktivieren, können Sie `logName` im Abschnitt `capabilities` definieren und sicherstellen, dass die Option `formatImageName` im Visual Testing-Service darauf verweist. So können Sie es einrichten:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/visual-testing/capabilities.js
```

#### Wie es funktioniert

1. Einrichten des `logName`:

   - Im Abschnitt `capabilities` weisen Sie jedem Browser oder Gerät einen eindeutigen `logName` zu. Zum Beispiel identifiziert `chrome-mac-15` Tests, die auf Chrome unter macOS Version 15 laufen.

2. Benutzerdefinierte Bildbenennung:

   - Die Option `formatImageName` integriert den `logName` in die Screenshot-Dateinamen. Wenn zum Beispiel der `tag` "homepage" und die Auflösung `1920x1080` ist, könnte der resultierende Dateiname so aussehen:

     `homepage-chrome-mac-15-1920x1080.png`

3. Vorteile der benutzerdefinierten Benennung:

   - Die Unterscheidung zwischen Screenshots von verschiedenen Browsern oder Geräten wird deutlich einfacher, besonders bei der Verwaltung von Baselines und dem Debuggen von Diskrepanzen.

4. Hinweis zu Standardwerten:

   - Wenn `logName` nicht in den Capabilities gesetzt ist, wird die Option `formatImageName` ihn als leeren String in den Dateinamen anzeigen (`homepage--15-1920x1080.png`)

### WebdriverIO MultiRemote

Wir unterstützen auch [MultiRemote](https://webdriver.io/docs/multiremote/). Damit dies richtig funktioniert, stellen Sie sicher, dass Sie `wdio-ics:options` zu Ihren
Capabilities hinzufügen, wie Sie unten sehen können. Dies stellt sicher, dass jeder Screenshot seinen eigenen eindeutigen Namen erhält.

[Das Schreiben Ihrer Tests](/docs/visual-testing/writing-tests) wird sich nicht von der Verwendung des [Testrunners](https://webdriver.io/docs/testrunner) unterscheiden

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/visual-testing/logs.js
```

### Programmatische Ausführung

Hier ist ein minimales Beispiel dafür, wie man `@wdio/visual-service` über `remote`-Optionen verwendet:

```js
import { remote } from "webdriverio";
import VisualService from "@wdio/visual-service";

let visualService = new VisualService({
    autoSaveBaseline: true,
});

const browser = await remote({
    logLevel: "silent",
    capabilities: {
        browserName: "chrome",
    },
});

// "Starten" Sie den Service, um die benutzerdefinierten Befehle zum `browser` hinzuzufügen
visualService.remoteSetup(browser);

await browser.url("https://webdriver.io/");

// oder verwenden Sie dies, um NUR einen Screenshot zu speichern
await browser.saveFullPageScreen("examplePaged", {});

// oder verwenden Sie dies zur Validierung. Beide Methoden müssen nicht kombiniert werden, siehe FAQ
await browser.checkFullPageScreen("examplePaged", {});

await browser.deleteSession();
```

### Durch eine Website tabulieren

Sie können überprüfen, ob eine Website mit der Tastatur <kbd>TAB</kbd>-Taste zugänglich ist. Das Testen dieses Teils der Barrierefreiheit war immer eine zeitaufwändige (manuelle) Aufgabe und durch Automatisierung recht schwer zu bewerkstelligen.
Mit den Methoden `saveTabbablePage` und `checkTabbablePage` können Sie nun Linien und Punkte auf Ihrer Website zeichnen, um die Tabulatorreihenfolge zu überprüfen.

Beachten Sie, dass dies nur für Desktop-Browser und **NICHT** für mobile Geräte nützlich ist. Alle Desktop-Browser unterstützen diese Funktion.

:::note

Die Arbeit ist inspiriert von [Viv Richards](https://github.com/vivrichards600) Blog-Beitrag über ["AUTOMATING PAGE TABABILITY (IS THAT A WORD?) WITH VISUAL TESTING"](https://vivrichards.co.uk/accessibility/automating-page-tab-flows-using-visual-testing-and-javascript).

Die Art und Weise, wie tabulierbare Elemente ausgewählt werden, basiert auf dem Modul [tabbable](https://github.com/davidtheclark/tabbable). Wenn es Probleme beim Tabulieren gibt, überprüfen Sie bitte die [README.md](https://github.com/davidtheclark/tabbable/blob/master/README.md) und besonders den Abschnitt [More Details](https://github.com/davidtheclark/tabbable/blob/master/README.md#more-details).

:::

#### Wie funktioniert es

Beide Methoden erstellen ein `canvas`-Element auf Ihrer Website und zeichnen Linien und Punkte, um Ihnen zu zeigen, wohin Ihr TAB gehen würde, wenn ein Endbenutzer es verwenden würde. Danach wird ein Vollseiten-Screenshot erstellt, um Ihnen einen guten Überblick über den Ablauf zu geben.

:::important

**Verwenden Sie `saveTabbablePage` nur, wenn Sie einen Screenshot erstellen möchten und ihn NICHT mit einem Baseline-Bild vergleichen möchten.**

:::

Wenn Sie den Tabulator-Ablauf mit einer Baseline vergleichen möchten, können Sie die Methode `checkTabbablePage` verwenden. Sie müssen **NICHT** beide Methoden zusammen verwenden. Wenn bereits ein Baseline-Bild erstellt wurde, was automatisch erfolgen kann, indem Sie `autoSaveBaseline: true` bei der Instanziierung des Services angeben,
wird `checkTabbablePage` zuerst das _aktuelle_ Bild erstellen und es dann mit der Baseline vergleichen.

##### Optionen

Beide Methoden verwenden die gleichen Optionen wie [`saveFullPageScreen`](https://github.com/wswebcreation/webdriver-image-comparison/blob/master/docs/OPTIONS.md#savefullpagescreen-or-savetabbablepage) oder
[`compareFullPageScreen`](https://github.com/wswebcreation/webdriver-image-comparison/blob/master/docs/OPTIONS.md#comparefullpagescreen-or-comparetabbablepage).

#### Beispiel

Dies ist ein Beispiel dafür, wie das Tabulieren auf unserer [Guinea-Pig-Website](https://guinea-pig.webdriver.io/image-compare.html) funktioniert:

![WDIO tabbing example](/img/visual/tabbable-chrome-latest-1366x768.png)

### Fehlgeschlagene visuelle Snapshots automatisch aktualisieren

Aktualisieren Sie die Baseline-Bilder über die Kommandozeile, indem Sie das Argument `--update-visual-baseline` hinzufügen. Dies wird

- automatisch den tatsächlich aufgenommenen Screenshot kopieren und in den Baseline-Ordner legen
- falls es Unterschiede gibt, den Test bestehen lassen, da die Baseline aktualisiert wurde

**Verwendung:**

```sh
npm run test.local.desktop  --update-visual-baseline
```

Bei der Ausführung im Info-/Debug-Modus werden die folgenden Protokolle hinzugefügt

```logs
[0-0] ..............
[0-0] #####################################################################################
[0-0]  INFO:
[0-0]  Updated the actual image to
[0-0]  /Users/wswebcreation/Git/wdio/visual-testing/localBaseline/chromel/demo-chrome-1366x768.png
[0-0] #####################################################################################
[0-0] ..........
```

## TypeScript-Unterstützung

Dieses Modul enthält TypeScript-Unterstützung, sodass Sie von Auto-Vervollständigung, Typsicherheit und verbesserter Entwicklererfahrung profitieren können, wenn Sie den Visual Testing-Service verwenden.

### Schritt 1: Typdefinitionen hinzufügen

Um sicherzustellen, dass TypeScript die Modultypen erkennt, fügen Sie den folgenden Eintrag zum types-Feld in Ihrer tsconfig.json hinzu:

```json
{
    "compilerOptions": {
        "types": ["@wdio/visual-service"]
    }
}
```

### Schritt 2: Typsicherheit für Service-Optionen aktivieren

Um die Typüberprüfung für die Service-Optionen zu erzwingen, aktualisieren Sie Ihre WebdriverIO-Konfiguration:

```ts
// wdio.conf.ts
import { join } from 'node:path';
// Importieren Sie die Typdefinition
import type { VisualServiceOptions } from '@wdio/visual-service';

export const config = {
    // ...
    // =====
    // Setup
    // =====
    services: [
        [
            "visual",
            {
                // Service-Optionen
                baselineFolder: join(process.cwd(), './__snapshots__/'),
                formatImageName: '{tag}-{logName}-{width}x{height}',
                screenshotPath: join(process.cwd(), '.tmp/'),
            } satisfies VisualServiceOptions, // Stellt Typsicherheit sicher
        ],
    ],
    // ...
};
```

## Systemanforderungen

### Version 5 und höher

Für Version 5 und höher ist dieses Modul ein rein JavaScript-basiertes Modul ohne zusätzliche Systemabhängigkeiten über die allgemeinen [Projektanforderungen](/docs/gettingstarted#system-requirements) hinaus. Es verwendet [Jimp](https://github.com/jimp-dev/jimp), eine Bildverarbeitungsbibliothek für Node, die vollständig in JavaScript geschrieben ist, ohne native Abhängigkeiten.

### Version 4 und niedriger

Für Version 4 und niedriger verlässt sich dieses Modul auf [Canvas](https://github.com/Automattic/node-canvas), eine Canvas-Implementierung für Node.js. Canvas ist abhängig von [Cairo](https://cairographics.org/).

#### Installationsdetails

Standardmäßig werden Binärdateien für macOS, Linux und Windows während der `npm install` Ihres Projekts heruntergeladen. Wenn Sie kein unterstütztes Betriebssystem oder keine unterstützte Prozessorarchitektur haben, wird das Modul auf Ihrem System kompiliert. Dies erfordert mehrere Abhängigkeiten, einschließlich Cairo und Pango.

Detaillierte Installationsinformationen finden Sie im [node-canvas Wiki](https://github.com/Automattic/node-canvas/wiki/_pages). Nachfolgend finden Sie Installationsanweisungen in einer Zeile für gängige Betriebssysteme. Beachten Sie, dass `libgif/giflib`, `librsvg` und `libjpeg` optional sind und nur für GIF-, SVG- bzw. JPEG-Unterstützung benötigt werden. Cairo v1.10.0 oder höher ist erforderlich.

<Tabs
defaultValue="osx"
values={[
{label: 'OS', value: 'osx'},
{label: 'Ubuntu', value: 'ubuntu'},
{label: 'Fedora', value: 'fedora'},
{label: 'Solaris', value: 'solaris'},
{label: 'OpenBSD', value: 'openbsd'},
{label: 'Window', value: 'windows'},
{label: 'Others', value: 'others'},
]}

> <TabItem value="osx">

````
 Mit [Homebrew](https://brew.sh/):

 ```sh
 brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
 ```

**Mac OS X v10.11+:** Wenn Sie kürzlich auf Mac OS X v10.11+ aktualisiert haben und Probleme beim Kompilieren haben, führen Sie den folgenden Befehl aus: `xcode-select --install`. Lesen Sie mehr über das Problem [auf Stack Overflow](http://stackoverflow.com/a/32929012/148072).
Wenn Sie Xcode 10.0 oder höher installiert haben, benötigen Sie für den Build aus den Quellen NPM 6.4.1 oder höher.
````

</TabItem>
<TabItem value="ubuntu">

````
```sh
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```
````

</TabItem>
<TabItem value="fedora">

````
```sh
sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
```
````

</TabItem>
<TabItem value="solaris">

````
```sh
pkgin install cairo pango pkg-config xproto renderproto kbproto xextproto
```
````

</TabItem>
<TabItem value="openbsd">

````
```sh
doas pkg_add cairo pango png jpeg giflib
```
````

</TabItem>
<TabItem value="windows">

```
Siehe das [Wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)
```

</TabItem>
<TabItem value="others">

```
Siehe das [Wiki](https://github.com/Automattic/node-canvas/wiki)
```

</TabItem>
</Tabs>
