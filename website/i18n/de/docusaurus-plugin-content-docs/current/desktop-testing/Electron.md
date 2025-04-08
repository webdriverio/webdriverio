---
id: electron
title: Electron
---

Electron ist ein Framework zur Erstellung von Desktop-Anwendungen mit JavaScript, HTML und CSS. Durch die Einbettung von Chromium und Node.js in seine Binärdatei ermöglicht Electron die Pflege einer einzigen JavaScript-Codebasis und die Erstellung plattformübergreifender Apps, die auf Windows, macOS und Linux funktionieren – ohne dass Erfahrung in nativer Entwicklung erforderlich ist.

WebdriverIO bietet einen integrierten Service, der die Interaktion mit Ihrer Electron-App vereinfacht und das Testen sehr einfach macht. Die Vorteile der Verwendung von WebdriverIO zum Testen von Electron-Anwendungen sind:

- 🚗 Automatische Einrichtung des erforderlichen Chromedrivers
- 📦 Automatische Pfaderkennung Ihrer Electron-Anwendung - unterstützt [Electron Forge](https://www.electronforge.io/) und [Electron Builder](https://www.electron.build/)
- 🧩 Zugriff auf Electron-APIs in Ihren Tests
- 🕵️ Mocking von Electron-APIs über eine Vitest-ähnliche API

Sie benötigen nur wenige einfache Schritte, um loszulegen. Schauen Sie sich dieses einfache Schritt-für-Schritt-Video-Tutorial vom [WebdriverIO YouTube](https://www.youtube.com/@webdriverio)-Kanal an:

<LiteYouTubeEmbed id="iQNxTdWedk0" title="Getting Started with ElectronJS Testing in WebdriverIO" />

Oder folgen Sie der Anleitung im folgenden Abschnitt.

## Erste Schritte

Um ein neues WebdriverIO-Projekt zu starten, führen Sie folgenden Befehl aus:

```sh
npm create wdio@latest ./
```

Ein Installationsassistent führt Sie durch den Prozess. Stellen Sie sicher, dass Sie _"Desktop Testing - of Electron Applications"_ auswählen, wenn Sie gefragt werden, welche Art von Tests Sie durchführen möchten. Geben Sie anschließend den Pfad zu Ihrer kompilierten Electron-Anwendung an, z.B. `./dist`, und behalten Sie dann die Standardeinstellungen bei oder passen Sie sie nach Ihren Wünschen an.

Der Konfigurationsassistent installiert alle erforderlichen Pakete und erstellt eine `wdio.conf.js` oder `wdio.conf.ts` mit der notwendigen Konfiguration zum Testen Ihrer Anwendung. Wenn Sie der automatischen Generierung einiger Testdateien zustimmen, können Sie Ihren ersten Test über `npm run wdio` ausführen.

## Manuelle Einrichtung

Wenn Sie WebdriverIO bereits in Ihrem Projekt verwenden, können Sie den Installationsassistenten überspringen und einfach die folgenden Abhängigkeiten hinzufügen:

```sh
npm install --save-dev wdio-electron-service
```

Dann können Sie die folgende Konfiguration verwenden:

```ts
// wdio.conf.ts
export const config: WebdriverIO.Config = {
    // ...
    services: [['electron', {
        appEntryPoint: './path/to/bundled/electron/main.bundle.js',
        appArgs: [/** ... */],
    }]]
}
```

Das war's 🎉

Erfahren Sie mehr darüber, [wie Sie den Electron Service konfigurieren](/docs/desktop-testing/electron/configuration), [wie Sie Electron-APIs mocken](/docs/desktop-testing/electron/mocking) und [wie Sie auf Electron-APIs zugreifen](/docs/desktop-testing/electron/api).
