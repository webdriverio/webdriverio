---
id: globals
title: Globale Variablen
---

In Ihren Testdateien definiert WebdriverIO jeder dieser Methoden und Objekte in die globale Umgebung. Sie müssen nichts importieren, um sie zu verwenden. Wenn Sie aber explizite Importe bevorzugen, können Sie `import { browser, $, $, expect } von '@wdio/globals'` nutzen und `injectGlobals: false` in Ihrer WDIO-Konfiguration setzen.

Die folgenden globalen Objekte sind gesetzt, wenn nicht anders konfiguriert:

- `browser`: WebdriverIO [Browser-Objekt](https://webdriver.io/docs/api/browser)
- `driver`: Alias für `browser` (Wird beim Ausführen von mobilen Tests verwendet)
- `multiremotebrowser`: Alias für `browser` oder `driver` aber nur für [Multiremote](/docs/multiremote) Sitzungen gesetzt
- `$`: Befehl zum Finden eines Elements (mehr in der [API Dokumentation](/docs/api/browser/$))
- `$$`: Befehl zum Finden von Elementen (mehr in [API-Dokumentation](/docs/api/browser/$$))
- `expect`: Assertion Framework für WebdriverIO (siehe [API Dokumentation](/docs/api/expect-webdriverio))

__Hinweis:__ WebdriverIO hat keine Kontrolle über verwendete Frameworks (z.B. Mocha oder Jasmin), die globale Variablen beim Bootstrappen ihrer Umgebung einstellen.
