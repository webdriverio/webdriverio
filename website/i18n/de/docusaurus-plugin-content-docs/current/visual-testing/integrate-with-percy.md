---
id: integrate-with-percy
title: Für Webanwendungen
---

## Integrieren Sie Ihre WebdriverIO-Tests mit Percy

Vor der Integration können Sie [Percys Beispiel-Tutorial für WebdriverIO](https://www.browserstack.com/docs/percy/sample-build/webdriverio/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation) erkunden.
Integrieren Sie Ihre automatisierten WebdriverIO-Tests mit BrowserStack Percy. Hier ist ein Überblick über die Integrationsschritte:

### Schritt 1: Erstellen eines Percy-Projekts

[Melden Sie sich bei Percy an](https://percy.io/signup/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation). Erstellen Sie in Percy ein Projekt vom Typ "Web" und benennen Sie es. Nach der Erstellung generiert Percy ein Token. Notieren Sie sich dieses. Sie müssen es im nächsten Schritt als Umgebungsvariable festlegen.

Für Details zur Erstellung eines Projekts, siehe [Erstellen eines Percy-Projekts](https://www.browserstack.com/docs/percy/get-started/create-project/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).

### Schritt 2: Setzen des Projekt-Tokens als Umgebungsvariable

Führen Sie den folgenden Befehl aus, um PERCY_TOKEN als Umgebungsvariable zu setzen:

```sh
export PERCY_TOKEN="<your token here>"   // macOS or Linux
$Env:PERCY_TOKEN="<your token here>"   // Windows PowerShell
set PERCY_TOKEN="<your token here>"    // Windows CMD
```

### Schritt 3: Installation der Percy-Abhängigkeiten

Installieren Sie die erforderlichen Komponenten, um die Integrationsumgebung für Ihre Testsuite einzurichten.

Um die Abhängigkeiten zu installieren, führen Sie den folgenden Befehl aus:

```sh
npm install --save-dev @percy/cli @percy/webdriverio
```

### Schritt 4: Aktualisieren Ihres Testskripts

Importieren Sie die Percy-Bibliothek, um die Methoden und Attribute zu verwenden, die für Screenshots erforderlich sind.
Das folgende Beispiel verwendet die percySnapshot()-Funktion im asynchronen Modus:

```sh
import percySnapshot from '@percy/webdriverio';
describe('webdriver.io page', () => {
  it('should have the right title', async () => {
    await browser.url('https://webdriver.io');
    await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js');
    await percySnapshot('webdriver.io page');
  });
});
```

Wenn Sie WebdriverIO im [Standalone-Modus](https://webdriver.io/docs/setuptypes.html/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation) verwenden, übergeben Sie das Browser-Objekt als erstes Argument an die `percySnapshot`-Funktion:

```sh
import { remote } from 'webdriverio'

import percySnapshot from '@percy/webdriverio';

const browser = await remote({
  logLevel: 'trace',
  capabilities: {
    browserName: 'chrome'
  }
});

await browser.url('https://duckduckgo.com');
const inputElem = await browser.$('#search_form_input_homepage');
await inputElem.setValue('WebdriverIO');
const submitBtn = await browser.$('#search_button_homepage');
await submitBtn.click();
// the browser object is required in standalone mode
percySnapshot(browser, 'WebdriverIO at DuckDuckGo');
await browser.deleteSession();
```

Die Argumente der Snapshot-Methode sind:

```sh
percySnapshot(name[, options])
```

### Standalone-Modus

```sh
percySnapshot(browser, name[, options])
```

- browser (erforderlich) - Das WebdriverIO-Browser-Objekt
- name (erforderlich) - Der Snapshot-Name; muss für jeden Snapshot eindeutig sein
- options - Siehe Konfigurationsoptionen pro Snapshot

Um mehr zu erfahren, siehe [Percy Snapshot](https://www.browserstack.com/docs/percy/take-percy-snapshots/overview/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).

### Schritt 5: Percy ausführen

Führen Sie Ihre Tests mit dem Befehl `percy exec` aus, wie unten gezeigt:

Wenn Sie den Befehl `percy:exec` nicht verwenden können oder es vorziehen, Ihre Tests mit IDE-Ausführungsoptionen zu starten, können Sie die Befehle `percy:exec:start` und `percy:exec:stop` verwenden. Weitere Informationen finden Sie unter [Percy ausführen](https://www.browserstack.com/docs/percy/integrate/webdriverio/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).

```sh
percy exec -- wdio wdio.conf.js
```

```sh
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Running "wdio wdio.conf.js"
...
[...] webdriver.io page
[percy] Snapshot taken "webdriver.io page"
[...]    ✓ should have the right title
...
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!

```

## Besuchen Sie die folgenden Seiten für weitere Details:

- [Integrieren Sie Ihre WebdriverIO-Tests mit Percy](https://www.browserstack.com/docs/percy/integrate/webdriverio/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)
- [Seite zur Umgebungsvariable](https://www.browserstack.com/docs/percy/get-started/set-env-var/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)
- [Integration mit BrowserStack SDK](https://www.browserstack.com/docs/percy/integrate-bstack-sdk/webdriverio/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation), wenn Sie BrowserStack Automate verwenden.

| Ressource                                                                                                                                                            | Beschreibung                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [Offizielle Dokumentation](https://www.browserstack.com/docs/percy/integrate/webdriverio/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation) | Percy's WebdriverIO-Dokumentation              |
| [Beispiel-Build - Tutorial](https://www.browserstack.com/docs/percy/sample-build/webdriverio/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation) | Percy's WebdriverIO-Tutorial                   |
| [Offizielles Video](https://youtu.be/1Sr_h9_3MI0/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)                                          | Visuelles Testen mit Percy                    |
| [Blog](https://www.browserstack.com/blog/introducing-visual-reviews-2-0/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)                   | Einführung in Visual Reviews 2.0 |
