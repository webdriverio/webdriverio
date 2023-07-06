---
id: v6-migration
title: Von v5 auf v6
---

Dieses Tutorial richtet sich an Personen, die noch `v5` von WebdriverIO verwenden und auf `v6` oder auf die neueste Version von WebdriverIO migrieren möchten. Wie in unserem [Release-Blogbeitrag](https://webdriver.io/blog/2020/03/26/webdriverio-v6-released) erwähnt, können die Änderungen für dieses Versions-Upgrade wie folgt zusammengefasst werden:

- Wir haben die Parameter für einige Befehle konsolidiert (z. B. `newWindow`, `respond$`, `respond$$`, `waitUntil`, `dragAndDrop`, `moveTo`, `waitForDisplayed`, `waitForEnabled`, `waitForExist`) und alle optionalen Parameter in einem einzigen Objekt verschmolzen, z.B.:

    ```js
    // v5
    browser.newWindow(
        'https://webdriver.io',
        'WebdriverIO window',
        'width=420,height=230,resizable,scrollbars=yes,status=1'
    )
    // v6
    browser.newWindow('https://webdriver.io', {
        windowName: 'WebdriverIO window',
        windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1'
    })
    ```

- Konfigurationen für Services, die in die Pluginliste verschoben, z.B.:

    ```js
    // v5
    exports.config = {
        services: ['sauce'],
        sauceConnect: true,
        sauceConnectOpts: { foo: 'bar' },
    }
    // v6
    exports.config = {
        services: [['sauce', {
            sauceConnect: true,
            sauceConnectOpts: { foo: 'bar' }
        }]],
    }
    ```

- Einige Serviceoptionen wurden zur Vereinfachung umbenannt
- Wir haben den `launchApp` in `launchChromeApp` für Chrome WebDriver-Sitzungen umbenannt

:::info

Wenn Sie WebdriverIO `v4` oder niedriger verwenden, aktualisieren Sie bitte zuerst auf `v5`.

:::

Während wir dafür gerne einen vollautomatisierten Prozess hätten, sieht die Realität anders aus. Jeder nutzt WebdriverIO auf eine andere Art und Weise. Dieses Dokument gilt als eine Hilfestellung und weniger als Schritt-für-Schritt-Anleitung. Wenn Sie Probleme mit der Migration haben, zögern Sie nicht, uns [zu kontaktieren](https://github.com/webdriverio/codemod/discussions/new).

## Setup

Ähnlich wie bei anderen Migrationen können wir den WebdriverIO [Codemod](https://github.com/webdriverio/codemod)verwenden. Um den Codemod zu installieren, führen Sie Folgendes aus:

```sh
npm install jscodeshift @wdio/codemod
```

## Aktualisieren Sie WebdriverIO-Abhängigkeiten

Da alle WebdriverIO-Versionen eng beieinander liegen, ist es am besten, immer auf ein bestimmtes Tag zu aktualisieren, z. B. `6.12.0`. Wenn Sie sich für ein Upgrade von `v5` direkt auf `v8` entscheiden, können Sie das Tag weglassen und die neuesten Versionen aller Pakete installieren. Dazu kopieren wir alle WebdriverIO-bezogenen Abhängigkeiten aus unserer `package.json` und installieren sie neu über:

```sh
npm i --save-dev @wdio/allure-reporter@6 @wdio/cli@6 @wdio/cucumber-framework@6 @wdio/local-runner@6 @wdio/spec-reporter@6 @wdio/sync@6 wdio-chromedriver-service@6 webdriverio@6
```

Normalerweise sind WebdriverIO-Abhängigkeiten Teil der Dev-Dependencies, je nach Projekt kann dies jedoch variieren. Danach sollte Ihre `package.json` und `package-lock.json` aktualisiert werden. __Hinweis:__ Dies sind Beispielabhängigkeiten, Ihre können abweichen. Stellen Sie sicher, dass Sie die neueste v6-Version finden, indem Sie anrufen, z.B.:

```sh
npm show webdriverio versions
```

Versuchen Sie, die neueste Version 6 zu installieren, die für alle zentralen WebdriverIO-Pakete verfügbar ist. Bei Community-Paketen kann dies von Paket zu Paket unterschiedlich sein. Hier empfehlen wir, den Changelog zu überprüfen, um Informationen darüber zu erhalten, welche Version noch mit v6 kompatibel ist.

## Konfigurationsdatei Transformieren

Ein guter erster Schritt ist, mit der Konfigurationsdatei zu beginnen. Alle Breaking Changes können mit dem Codemod vollautomatisch behoben werden:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./wdio.conf.js
```

:::caution

Der Codemod unterstützt noch keine TypeScript-Projekte. Siehe [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10). Wir arbeiten daran, die Unterstützung dafür bald zu implementieren. Wenn Sie TypeScript verwenden, ist jede Hilfe gern gesehen!

:::

## Spec Dateien und Seitenobjekte aktualisieren

Um alle Befehlsänderungen zu aktualisieren, führen Sie den Codemod auf allen Ihren e2e-Dateien aus, die WebdriverIO-Befehle enthalten, z.B.:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./e2e/*
```

Das war's! Keine Änderungen mehr nötig 🎉

## Zusammenfassung

Wir hoffen, dass dieses Tutorial Ihnen ein wenig durch den Migrationsprozess zu WebdriverIO `v6` geholfen hat. Wir empfehlen dringend, weiterhin auf die neueste Version zu aktualisieren, da die Aktualisierung auf `v7` trivial ist und es fast keine Breaking Changes gibt. Bitte lesen Sie den Migrationsleitfaden [zum Upgrade auf v7](v7-migration).

Die Community verbessert den Codemod weiter und testet ihn mit verschiedenen Teams in verschiedenen Organisationen. Zögern Sie nicht, [ein Problem zu melden,](https://github.com/webdriverio/codemod/issues/new) wenn Sie Feedback haben, oder [eine Diskussion zu beginnen](https://github.com/webdriverio/codemod/discussions/new) wenn Sie während des Migrationsprozesses auf Schwierigkeiten stoßen.
