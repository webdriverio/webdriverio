---
id: environment
title: Umgebungsvariablen
---

WebdriverIO setzt die folgenden Umgebungsvariablen in jedem Worker Prozess:

## `NODE_ENV`

Gesetzt mit `'test'` wenn es nicht bereits auf etwas anderes definiert ist.

## `WDIO_LOG_LEVEL`

Kann folgender Werte beinhalten: `trace`, `debug`, `info`, `warn`, `error` oder `silent`. Hat Priorität über dem übergebenen `LogLevel` Wert.

## `WDIO_WORKER_ID`

Eine einzigartige Id, die dabei hilft, den Worker-Prozess zu identifizieren. Diese hat folgenden Format: `{number}-{number}` , die erste Zahl identifiziert die Remote Umgebung und die zweite die Test Datei. `0-5` identifiziert den ersten Worker, welcher die sechste Test Datei ausführt.
