---
id: integrate-with-app-percy
title: Für Mobile Anwendungen
---

## Integrieren Sie Ihre WebdriverIO-Tests mit App Percy

Vor der Integration können Sie das [App Percy Beispiel-Build-Tutorial für WebdriverIO](https://www.browserstack.com/docs/app-percy/sample-build/webdriverio-javascript/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation) erkunden.
Integrieren Sie Ihre Testsuite mit BrowserStack App Percy. Hier ist ein Überblick über die Integrationsschritte:

### Schritt 1: Erstellen Sie ein neues App-Projekt im Percy-Dashboard

[Melden Sie sich an](https://percy.io/signup/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation) bei Percy und [erstellen Sie ein neues Projekt vom Typ App](https://www.browserstack.com/docs/app-percy/get-started/create-project/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation). Nach der Erstellung des Projekts wird Ihnen eine Umgebungsvariable `PERCY_TOKEN` angezeigt. Percy verwendet den `PERCY_TOKEN`, um zu wissen, zu welcher Organisation und welchem Projekt die Screenshots hochgeladen werden sollen. Sie benötigen diesen `PERCY_TOKEN` in den nächsten Schritten.

### Schritt 2: Setzen Sie das Projekt-Token als Umgebungsvariable

Führen Sie den folgenden Befehl aus, um PERCY_TOKEN als Umgebungsvariable zu setzen:

```sh
export PERCY_TOKEN="<your token here>"   // macOS oder Linux
$Env:PERCY_TOKEN="<your token here>"    // Windows PowerShell
set PERCY_TOKEN="<your token here>"    // Windows CMD
```

### Schritt 3: Installieren Sie Percy-Pakete

Installieren Sie die Komponenten, die für die Einrichtung der Integrationsumgebung Ihrer Testsuite erforderlich sind.
Um die Abhängigkeiten zu installieren, führen Sie den folgenden Befehl aus:

```sh
npm install --save-dev @percy/cli
```

### Schritt 4: Installieren Sie Abhängigkeiten

Installieren Sie die Percy Appium App

```sh
npm install --save-dev @percy/appium-app
```

### Schritt 5: Aktualisieren Sie das Testskript

Stellen Sie sicher, dass Sie @percy/appium-app in Ihrem Code importieren.

Unten finden Sie ein Beispieltest, der die percyScreenshot-Funktion verwendet. Verwenden Sie diese Funktion überall dort, wo Sie einen Screenshot machen müssen.

```sh
import percyScreenshot from '@percy/appium-app';
describe('Appium webdriverio test example', function() {
  it('takes a screenshot', async () => {
    await percyScreenshot('Appium JS example');
  });
});
```

Wir übergeben die erforderlichen Argumente an die percyScreenshot-Methode.

Die Argumente der Screenshot-Methode sind:

```sh
percyScreenshot(driver, name[, options])
```

### Schritt 6: Führen Sie Ihr Testskript aus

Führen Sie Ihre Tests mit `percy app:exec` aus.

Wenn Sie den Befehl percy app:exec nicht verwenden können oder es vorziehen, Ihre Tests mit IDE-Ausführungsoptionen auszuführen, können Sie die Befehle percy app:exec:start und percy app:exec:stop verwenden. Weitere Informationen finden Sie unter [Run Percy](https://www.browserstack.com/docs/app-percy/references/commands/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation).

```sh
$ percy app:exec -- appium test command
```

Dieser Befehl startet Percy, erstellt einen neuen Percy-Build, nimmt Snapshots auf und lädt sie in Ihr Projekt hoch und stoppt Percy:

```sh
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Snapshot taken "Appium WebdriverIO Example"
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

## Besuchen Sie die folgenden Seiten für weitere Details:

- [Integrieren Sie Ihre WebdriverIO-Tests mit Percy](https://www.browserstack.com/docs/app-percy/integrate/webdriverio-javascript/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)
- [Umgebungsvariablen-Seite](https://www.browserstack.com/docs/app-percy/get-started/set-env-var/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)
- [Integration mit BrowserStack SDK](https://www.browserstack.com/docs/app-percy/integrate-bstack-sdk/webdriverio/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation), wenn Sie BrowserStack Automate verwenden.

| Ressource                                                                                                                                                                             | Beschreibung                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [Offizielle Dokumentation](https://www.browserstack.com/docs/app-percy/integrate/webdriverio-javascript/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)    | App Percy's WebdriverIO-Dokumentation                                                        |
| [Beispiel-Build - Tutorial](https://www.browserstack.com/docs/app-percy/sample-build/webdriverio-javascript/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation) | App Percy's WebdriverIO-Tutorial                                                            |
| [Offizielles Video](https://youtu.be/a4I_RGFdwvc/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)                                                           | Visuelles Testen mit App Percy                                                              |
| [Blog](https://www.browserstack.com/blog/product-launch-app-percy/?utm_source=webdriverio\&utm_medium=partnered\&utm_campaign=documentation)                                         | Lernen Sie App Percy kennen: KI-gestützte automatisierte Plattform für visuelles Testen nativer Apps |
