---
id: watcher
title: Test-Dateien bei Änderungen Neustarten
---

Mit dem WDIO-Testrunner können Sie Dateien beobachten, während Sie daran arbeiten. Sie werden automatisch erneut ausgeführt, wenn Sie etwas in Ihrer App oder in Ihren Testdateien ändern. Durch Hinzufügen eines `--watch` Parameter beim Aufrufen des Befehls `wdio run` wartet der Testrunner auf Dateiänderungen, nachdem er alle Tests ausgeführt hat, z.B.:

```sh
wdio wdio.conf.js --watch
```

Standardmäßig überwacht es nur Ihre `specs` Dateien auf Änderungen. Wenn Sie jedoch eine `filesToWatch` Eigenschaft in Ihrer `wdio.conf.js` festlegen, die eine Liste von Dateipfaden enthält (Globbing wird unterstützt), wird der Testrunner auch darauf achten, alle Tests neuzustarten, wenn auch diese Dateien geändert werden. Hier ein Beispiel, wie Sie Ihre Applikationsdateien angeben können:

```js
// wdio.conf.js
export const config = {
    // ...
    filesToWatch: [
        // watch for all JS files in my app
        './src/app/**/*.js'
    ],
    // ...
}
```

:::info
Versuchen Sie, die Tests so weit wie möglich parallel durchzuführen. E2E-Tests sind von Natur aus langsam. Das erneute Ausführen von Tests ist nur dann sinnvoll, wenn Sie die einzelne Testlaufzeit kurz halten können. Um Zeit zu sparen, hält der Testrunner WebDriver-Sitzungen aufrecht, während er auf Dateiänderungen wartet. Stellen Sie sicher, dass Ihr WebDriver-Backend so modifiziert werden kann, dass es die Sitzung nicht automatisch schließt, wenn nach einiger Zeit kein Befehl ausgeführt wurde.
:::
