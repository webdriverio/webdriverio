---
id: vscode-extensions
title: VS Code Extension Testing
---

WebdriverIO ermöglicht es Ihnen, Ihre [VS Code](https://code.visualstudio.com/) Erweiterungen nahtlos von End-zu-End in der VS Code Desktop IDE oder als Web-Erweiterung zu testen. Sie müssen lediglich einen Pfad zu Ihrer Erweiterung angeben und das Framework erledigt den Rest. Mit dem [`wdio-vscode-service`](https://www.npmjs.com/package/wdio-vscode-service) wird alles für Sie übernommen und noch viel mehr:

- 🏗️ Installation von VSCode (entweder stable, insiders oder eine bestimmte Version)
- ⬇️ Herunterladen von Chromedriver speziell für die angegebene VSCode-Version
- 🚀 Ermöglicht Ihnen den Zugriff auf die VSCode API aus Ihren Tests
- 🖥️ Starten von VSCode mit benutzerdefinierten Einstellungen (inklusive Unterstützung für VSCode unter Ubuntu, MacOS und Windows)
- 🌐 Oder stellt VSCode über einen Server bereit, um von jedem Browser aus für das Testen von Web-Erweiterungen zugänglich zu sein
- 📔 Erstellen von Page Objects mit Locators, die zu Ihrer VSCode-Version passen

## Erste Schritte

Um ein neues WebdriverIO-Projekt zu starten, führen Sie folgenden Befehl aus:

```sh
npm create wdio@latest ./
```

Ein Installationsassistent wird Sie durch den Prozess führen. Stellen Sie sicher, dass Sie _"VS Code Extension Testing"_ auswählen, wenn Sie gefragt werden, welche Art von Tests Sie durchführen möchten. Danach können Sie die Standardeinstellungen beibehalten oder nach Ihren Vorlieben anpassen.

## Beispielkonfiguration

Um den Service zu nutzen, müssen Sie `vscode` zu Ihrer Liste der Services hinzufügen, optional gefolgt von einem Konfigurationsobjekt. Dadurch wird WebdriverIO die angegebenen VSCode-Binärdateien und die passende Chromedriver-Version herunterladen:

```js
// wdio.conf.ts
export const config = {
    outputDir: 'trace',
    // ...
    capabilities: [{
        browserName: 'vscode',
        browserVersion: '1.71.0', // "insiders" oder "stable" für die neueste VSCode-Version
        'wdio:vscodeOptions': {
            extensionPath: __dirname,
            userSettings: {
                "editor.fontSize": 14
            }
        }
    }],
    services: ['vscode'],
    /**
     * optional können Sie den Pfad definieren, in dem WebdriverIO alle
     * VSCode- und Chromedriver-Binärdateien speichert, z.B.:
     * services: [['vscode', { cachePath: __dirname }]]
     */
    // ...
};
```

Wenn Sie `wdio:vscodeOptions` mit einem anderen `browserName` als `vscode` definieren, z.B. `chrome`, wird der Service die Erweiterung als Web-Erweiterung bereitstellen. Wenn Sie auf Chrome testen, ist kein zusätzlicher Treiber-Service erforderlich, z.B.:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/vscode-extension/chrome.js
```

_Hinweis:_ Beim Testen von Web-Erweiterungen können Sie nur zwischen `stable` oder `insiders` als `browserVersion` wählen.

### TypeScript-Einrichtung

In Ihrer `tsconfig.json` stellen Sie sicher, dass Sie `wdio-vscode-service` zu Ihrer Liste der Typen hinzufügen:

```json
{
    "compilerOptions": {
        "types": [
            "node",
            "webdriverio/async",
            "@wdio/mocha-framework",
            "expect-webdriverio",
            "wdio-vscode-service"
        ],
        "target": "es2020",
        "moduleResolution": "node16"
    }
}
```

## Verwendung

Sie können dann die Methode `getWorkbench` verwenden, um auf die Page Objects für die Locators zuzugreifen, die zu Ihrer gewünschten VSCode-Version passen:

```ts
describe('WDIO VSCode Service', () => {
    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toBe('[Extension Development Host] - README.md - wdio-vscode-service - Visual Studio Code')
    })
})
```

Von dort aus können Sie auf alle Page Objects zugreifen, indem Sie die richtigen Page-Object-Methoden verwenden. Erfahren Sie mehr über alle verfügbaren Page Objects und ihre Methoden in der [Page-Object-Dokumentation](https://webdriverio-community.github.io/wdio-vscode-service/).

### Zugriff auf VSCode APIs

Wenn Sie bestimmte Automatisierungen über die [VSCode API](https://code.visualstudio.com/api/references/vscode-api) ausführen möchten, können Sie dies durch Ausführen von Remote-Befehlen über den benutzerdefinierten Befehl `executeWorkbench` tun. Dieser Befehl ermöglicht die Fernausführung von Code aus Ihrem Test in der VSCode-Umgebung und ermöglicht den Zugriff auf die VSCode API. Sie können beliebige Parameter in die Funktion übergeben, die dann in die Funktion weitergeleitet werden. Das `vscode`-Objekt wird immer als erstes Argument gefolgt von den Parametern der äußeren Funktion übergeben. Beachten Sie, dass Sie nicht auf Variablen außerhalb des Funktionsbereichs zugreifen können, da der Callback remote ausgeführt wird. Hier ist ein Beispiel:

```ts
const workbench = await browser.getWorkbench()
await browser.executeWorkbench((vscode, param1, param2) => {
    vscode.window.showInformationMessage(`I am an ${param1} ${param2}!`)
}, 'API', 'call')

const notifs = await workbench.getNotifications()
console.log(await notifs[0].getMessage()) // gibt aus: "I am an API call!"
```

Die vollständige Page-Object-Dokumentation finden Sie in der [Dokumentation](https://webdriverio-community.github.io/wdio-vscode-service/modules.html). Verschiedene Anwendungsbeispiele finden Sie in der [Testsuite dieses Projekts](https://github.com/webdriverio-community/wdio-vscode-service/blob/main/test/specs).

## Weitere Informationen

Weitere Informationen zur Konfiguration des [`wdio-vscode-service`](https://www.npmjs.com/package/wdio-vscode-service) und zum Erstellen benutzerdefinierter Page Objects finden Sie in der [Service-Dokumentation](/docs/wdio-vscode-service). Sie können auch den folgenden Vortrag von [Christian Bromann](https://twitter.com/bromann) zum Thema [_Testing Complex VSCode Extensions With the Power of Web Standards_](https://www.youtube.com/watch?v=PhGNTioBUiU) ansehen:

<LiteYouTubeEmbed id="PhGNTioBUiU" title="Testing Complex VSCode Extensions With the Power of Web Standards" />
