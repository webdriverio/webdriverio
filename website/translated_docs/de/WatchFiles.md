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

**Hinweis:** Stellen Sie sicher, dass Sie so viele Tests wie möglich parallel ausführen. E2E tests are by nature slow and rerunning tests is only useful if you can keep the individual testrun time short. In order to save time the testrunner keeps the WebDriver sessions alive while waiting for file changes. Make sure your WebDriver backend can be modified so that it doesn't automatically close the session if no command was executed after some specific time.