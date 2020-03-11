---
id: watcher
title: Test Dateien Überwachen
---

Mit dem WDIO Testrunner können Sie Dateien beobachten lassen, während Sie an ihnen arbeiten. Sie werden dann automatisch ausgeführt, wenn Sie entweder etwas in Ihrer App oder in Ihren Testdateien ändern. Durch das Hinzufügen eines `--watch` Flag beim Aufruf des `wdio` Befehls, wird der Tester nach dem Ausführen aller Tests auf Dateiänderungen warten, z.B.:

```sh
$ wdio wdio.conf.js --watch
```

Standardmäßig wird nur für Änderungen in Ihren `Test Dateien` geachtet. Aber Sie können zusätzlich durch das Setzen der `filesToWatch` Einstellung in Ihrer `wdio.conf.js` bestimmen, auf welche Dateien der Testrunner zusätzlich auf Änderungen achten soll. Dies ist nützlich, wenn Sie automatisch alle Tests erneut ausführen möchten, sobald Sie z. B. irgendetwas in Ihrer App geändert haben.

```js
// wdio.conf.js
export.config = {
    // ...
    filesToWatch: [
        // watch for all JS files in my app
        './src/app/**/*.js'
    ],
    // ...
}
```

**Hinweis:** Stellen Sie sicher, dass Sie so viele Tests wie möglich parallel ausführen. Da E2E Tests von Natur aus langsam sind, macht dieses Feature nur Sinn, wenn Sie Ihre Tests klein halten und eine große Anzahl von ihnen parallel ausgeführt werden können. Um Zeit zu sparen, hält der Tester die WebDriver-Sitzungen am Leben, während er auf Dateiänderungen wartet. Stellen Sie sicher, dass Ihr WebDriver Backend Ihre Session nicht automatisch beendet, wenn nach einiger Zeit kein Befehl ausgeführt wurde.