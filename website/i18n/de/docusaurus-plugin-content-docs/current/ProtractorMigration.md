---
id: protractor-migration
title: Von Protractor
---

Dieses Tutorial richtet sich an Personen, die Protractor verwenden und ihr Framework zu WebdriverIO migrieren möchten. Es wurde initiiert, nachdem das Angular-Team [angekündigt hatte](https://github.com/angular/protractor/issues/5502), dass Protractor nicht mehr unterstützt wird. WebdriverIO wurde von vielen Designentscheidungen durch Protractor beeinflusst, weshalb es wahrscheinlich das die Migration relative einfach verläuft, da sich vieles ähneln wird. Das WebdriverIO-Team schätzt die Arbeit jedes einzelnen Protractor-Entwicklers und hofft, dass dieses Tutorial den Übergang zu WebdriverIO einfach und unkompliziert macht.

Während wir dafür gerne einen vollautomatisierten Prozess hätten, sieht die Realität anders aus. Jeder hat ein anderes Setup und verwendet Protractor auf unterschiedliche Weise. Dieses Dokument gilt als eine Hilfestellung und weniger als Schritt-für-Schritt-Anleitung. Wenn Sie Probleme mit der Migration haben, zögern Sie nicht, uns [zu kontaktieren](https://github.com/webdriverio/codemod/discussions/new).

## Setup

Die Protractor- und WebdriverIO-API sind eigentlich sehr ähnlich, bis zu einem Punkt, an dem die meisten Befehle automatisiert durch einen [Codemod](https://github.com/webdriverio/codemod)umgeschrieben werden können.

Um den Codemod zu installieren, führen Sie Folgendes aus:

```sh
npm install jscodeshift @wdio/codemod
```

## Strategie

Es gibt viele Migrationsstrategien. Abhängig von der Größe Ihres Teams, der Menge der Testdateien und der Dringlichkeit der Migration können Sie versuchen, alle Tests auf einmal oder Datei für Datei zu transformieren.   Sie können Protractor- und WebdriverIO-Tests gleichzeitig ausführen und mit dem Schreiben neuer Tests in WebdriverIO beginnen. In Anbetracht Ihres Zeitbudgets können Sie dann zunächst mit der Migration der wichtigen Testfälle beginnen und sich bis zu Tests vorarbeiten, die Sie möglicherweise sogar löschen können.

## Migration der Konfigurations-Datei

Nachdem wir den Codemod installiert haben, können wir mit der Transformation der ersten Datei beginnen. Werfen Sie zunächst einen Blick auf die Konfigurationsoptionen von [WebdriverIOs](configuration). Konfigurationsdateien können sehr komplex werden und es kann sinnvoll sein, nur die wesentlichen Teile zu portieren und zu sehen, wie der Rest hinzugefügt werden kann. Sobald entsprechende Tests bestimmte Optionen benötigen, können weiter Optionen migriert werden.

Für die erste Migration transformieren wir nur die Konfigurationsdatei und führen Folgendes aus:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./conf.ts
```

:::info

 Ihre Konfiguration kann anders benannt werden, das Prinzip sollte jedoch dasselbe sein: Starten Sie zuerst die Migration der Konfiguration.

:::

## Installieren Sie WebdriverIO-Abhängigkeiten

Der nächste Schritt besteht darin, ein minimales WebdriverIO-Setup zu konfigurieren, das wir als Aufbau benutzen. Zuerst installieren wir die WebdriverIO CLI über:

```sh
npm install --save-dev @wdio/cli
```

Als nächstes führen wir den Konfigurationsassistenten aus:

```sh
npx wdio config
```

Dieser wird Sie durch ein paar Fragen führen. Für dieses Migrationsszenario:
- Wählen Sie die Standardoptionen
- Wir empfehlen, Beispieldateien nicht automatisch zu generieren
- Wählen Sie einen anderen Ordner für WebdriverIO spezifische Test-Dateien
- und Mocha als Test-Framework zu wählen

:::info
Warum Mocha? Auch wenn Sie Protractor vielleicht vorher mit Jasmine verwendet haben, bietet Mocha jedoch bessere Funktionen um Tests bei Fehlern zu wiederholen. Es ist Ihre Entscheidung!
:::

Nach dem Fragebogen installiert der Assistent alle notwendigen Pakete und speichert sie in Ihrer `package.json`.

## Einzelne Konfigurationen Migrieren

Nachdem wir die `conf.ts` migriert und eine neue `wdio.conf.ts` erzeugt haben, ist es nun an der Zeit, die Konfiguration von einer Datei in eine andere zu migrieren. Stellen Sie sicher, dass nur die Konfigurationen migriert werden, die für die Ausführung aller Tests erforderlich ist. In unserem Beispiel wurden die Hook-Funktion und das Framework-Timeout übertragen.

Wir werden jetzt nur noch mit unserer `wdio.conf.ts` Datei fortfahren und brauchen daher keine Änderungen an der ursprünglichen Protractor-Konfiguration mehr. Wir können dessen Änderungen zurücksetzen, sodass beide Frameworks nebeneinander laufen können und wir die einzelne Dateien Schritt für Schritt umschreiben.

## Testdatein Migrieren

Wir sind jetzt bereit, die erste Testdatei zu portieren. Um einfach zu beginnen, starten wir mit einer, die nicht viele Abhängigkeiten zu Paketen von Drittanbietern oder anderen Dateien wie PageObjects hat. In unserem Beispiel ist die erste zu migrierende Datei `first-test.spec.ts`. Erstellen Sie zuerst das Verzeichnis, in dem die neue WebdriverIO-Konfiguration ihre Dateien erwartet, und verschieben Sie es dann dorthin:

```sh
mv mkdir -p ./test/specs/
mv test-suites/first-test.spec.ts ./test/specs
```

Lassen Sie uns nun diese Datei transformieren:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./test/specs/first-test.spec.ts
```

Das war's! Diese Datei ist so einfach, dass wir keine weiteren Änderungen mehr benötigen und direkt versuchen können, diese mit WebdriverIO auszuführen:

```sh
npx wdio run wdio.conf.ts
```

Herzlichen Glückwunsch 🥳 Sie haben gerade die erste Datei migriert!

## Nächste Schritte

Von diesem Punkt an transformieren Sie weiter Test für Test und Seitenobjekt für Seitenobjekt. Es besteht die Möglichkeit, dass der Codemod für bestimmte Dateien mit einem Fehler fehlschlägt, wie zum Beispiel:

```
ERR /path/to/project/test/testdata/failing_submit.js Transformation error (Error transforming /test/testdata/failing_submit.js:2)
Error transforming /test/testdata/failing_submit.js:2

> login_form.submit()
  ^

The command "submit" is not supported in WebdriverIO. Wir empfehlen, stattdessen den Klick Befehl zu verwenden, um auf die Schaltfläche „Senden“ zu klicken. Weitere Informationen zu dieser Konfiguration finden Sie unter https://webdriver.io/docs/api/element/click.
  at /path/to/project/test/testdata/failing_submit.js:132:0
```

Für einige Protactor-Befehle gibt es in WebdriverIO einfach keinen Ersatz. In diesem Fall gibt Ihnen der Codemod einige Ratschläge, wie Sie ihr Test manuell umschreiben können. Wenn Sie zu oft auf solche Fehlermeldungen stoßen, können Sie gerne [ein Problem melden](https://github.com/webdriverio/codemod/issues/new) und darum bitten, eine bestimmte Transformation hinzuzufügen. Während der Codemod bereits den Großteil der Protractor API transformiert, gibt es noch viel Raum für Verbesserungen.

## Zusammenfassung

Wir hoffen, dass dieses Tutorial Sie ein wenig durch den Migrationsprozess zu WebdriverIO führt. Die Community verbessert den Codemod weiter und testet ihn mit verschiedenen Teams in verschiedenen Organisationen. Zögern Sie nicht, [ein Problem zu melden,](https://github.com/webdriverio/codemod/issues/new) wenn Sie Feedback haben, oder [eine Diskussion zu beginnen](https://github.com/webdriverio/codemod/discussions/new) wenn Sie während des Migrationsprozesses auf Schwierigkeiten stoßen.
