---
id: coverage
title: Coverage
---

Der Browser-Runner von WebdriverIO unterstützt die Berichterstellung zur Codeabdeckung mit [`istanbul`](https://istanbul.js.org/). Der Testrunner instrumentiert automatisch Ihren Code und erfasst die Codeabdeckung für Sie.

## Setup

Um das Code-Coverage-Reporting zu aktivieren, aktivieren Sie es über die WebdriverIO Browser-Runner-Konfiguration, z.B.:

```js title=wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: process.env.WDIO_PRESET,
        coverage: {
            enabled: true
        }
    }],
    // ...
}
```

Schauen Sie sich alle [Deckungsoptionen](/docs/runner#coverage-options)an, um zu erfahren, wie man sie richtig konfiguriert.

## Code ignorieren

Möglicherweise gibt es einige Abschnitte Ihrer Codebasis, die Sie absichtlich von der Abdeckungsverfolgung ausschließen möchten. Dazu können Sie die folgenden Parsing-Hinweise verwenden:

- `/* istanbul Ignoriere if */`: Ignoriere die nächste if-Anweisung.
- `/* istanbul ignore else */`: Ignoriere den else-Teil einer if-Anweisung.
- `/* istanbul ignore next */`: Ignoriere das Nächste im Quellcode (Funktionen, if-Anweisungen, Klassen, was auch immer).
- `/* istanbul ignore file */`: Ignoriere eine komplette Quelldatei (diese sollte am Anfang der Datei platziert werden).

:::info

Es wird empfohlen, Ihre Testdateien vom Coverage-Reporting auszuschließen, da dies Fehler verursachen könnte, z. B. beim Aufrufen von `execute` oder `executeAsync` Befehlen. Wenn Sie sie in Ihrem Bericht behalten möchten, stellen Sie sicher, dass Sie sie über Folgendes ausschließen:

```ts
await browser.execute(/* istanbul ignore next */() => {
    // ...
})
```

:::
