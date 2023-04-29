---
id: frameworks
title: Frameworks
---

Der WDIO-Runner unterstützt derzeit [Mocha](http://mochajs.org/),  [Jasmine](http://jasmine.github.io/) und [Cucumber](https://cucumber.io/).

Um jedes Framework mit WebdriverIO zu integrieren, gibt es Adapterpakete auf NPM, die installiert werden müssen. Sie können die Adapter nicht einfach überall installieren; diese Pakete müssen am selben Ort installiert werden, an dem WebdriverIO installiert ist. Wenn Sie also WebdriverIO global installiert haben, stellen Sie sicher, dass Sie auch das Framework-Adapterpaket global installieren.

Innerhalb Ihrer Test-Dateien (oder Step-Definitionen) können Sie auf die WebdriverIO-Instanz zugreifen, indem Sie die globale Variable `browser`verwenden oder von `@wdio/globals` importieren. (Sie müssen die Selenium-Sitzung weder starten noch beenden. Dafür sorgt der `wdio` Testrunner.)

## Verwendung von Mocha

Installieren Sie zuerst das Adapterpaket von NPM:

```bash npm2yarn
npm install @wdio/mocha-framework --save-dev
```

Standardmäßig stellt WebdriverIO eine [Assertion-Library](assertion) bereit, die Sie direkt nutzen können:

```js
describe('my awesome website', () => {
    it('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

WebdriverIO unterstützt Mochas `BDD` (Standard), `TDD` und `QUnit` [Interfaces](https://mochajs.org/#interfaces).

Wenn Sie Ihre Spezifikationen gerne im TDD-Stil schreiben, setzen Sie die Eigenschaft `ui` in Ihrer Konfiguration `mochaOpts` auf `tdd`. Jetzt sollten Ihre Testdateien wie folgt geschrieben sein:

```js
suite('my awesome website', () => {
    test('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

Wenn Sie andere Mocha-spezifische Einstellungen definieren möchten, können Sie dies mit dem Schlüssel `mochaOpts` in Ihrer Konfigurationsdatei tun. Eine Liste aller Optionen finden Sie auf der [Mocha-Projektwebsite](https://mochajs.org/api/mocha).

__Hinweis:__ WebdriverIO unterstützt nicht die veraltete Verwendung von `done` Callbacks in Mocha:

```js
it('should test something', (done) => {
    done() // throws "done is not a function"
})
```

### Mocha-Optionen

Die folgenden Optionen können in Ihrer `wdio.conf.js` angewendet werden, um Ihre Mocha-Umgebung zu konfigurieren. __Hinweis:__ Nicht alle Optionen werden unterstützt, z. B. führt die Anwendung der Option `parallel` zu einem Fehler, da der WDIO-Testrunner seine eigene Art hat, Tests parallel auszuführen. Die folgenden Optionen werden jedoch unterstützt:

#### require
Die Option `require` ist nützlich, wenn Sie grundlegende Funktionen hinzufügen oder erweitern möchten (WebdriverIO-Framework-Option).

Type: `string|string[]`<br /> Default: `[]`

#### compilers
Verwenden Sie die angegebenen Module, um Dateien zu kompilieren. Compiler werden ausgeführt bevor die von `require` definierten Fixtures (WebdriverIO-Framework-Option).

Type: `string[]`<br /> Default: `[]`

#### allowUncaught
Propagieren Sie nicht erfasste Fehler.

Type: `boolean`<br /> Default: `false`

#### bail
Tests beenden nach dem ersten Fehlschlag.

Type: `boolean`<br /> Default: `false`

#### checkLeaks
Suchen Sie nach globalen Variablenlecks.

Type: `boolean`<br /> Default: `false`

#### delay
Ausführung der Root-Suite verzögern.

Type: `boolean`<br /> Default: `false`

#### fgrep
Fokussieren der Tests, die diesem Pattern folgen.

Type: `string`<br /> Default: `null`

#### forbidOnly
Tests, die mit `only` markiert sind, werden als Fehler angegeben.

Type: `boolean`<br /> Default: `false`

#### forbidPending
Brechen Sie den Test-Lauf beim ersten Fehler ab.

Type: `boolean`<br /> Default: `false`

#### fullTrace
Vollständiger Stacktrace bei Fehler anzeigen.

Type: `boolean`<br /> Default: `false`

#### global
Mocha Variablen im Globalen Scope injizieren.

Type: `string[]`<br /> Default: `[]`

#### grep
Filter Tests, die dem Regulären Ausdruck entsprechen.

Type: `RegExp|string`<br /> Default: `null`

#### invert
Testfilter-Matches umkehren.

Type: `boolean`<br /> Default: `false`

#### retries
Anzahl der Wiederholungen fehlgeschlagener Tests.

Type: `number`<br /> Default: `0`

#### timeout
Timeout-Schwellenwert (in ms).

Type: `number`<br /> Default: `30000`

## Verwendung von Jasmin

Installieren Sie zuerst das Adapterpaket von NPM:

```bash npm2yarn
npm install @wdio/jasmine-framework --save-dev
```

Anschließend können Sie Ihre Jasmine-Umgebung konfigurieren, indem Sie in Ihrer Konfiguration die Eigenschaft `jasmineOpts` festlegen. Eine Liste aller Optionen finden Sie auf der [Jasmine-Projektwebsite](https://jasmine.github.io/api/3.5/Configuration.html).

### Assertion Abfangen

Das Jasmine-Framework ermöglicht es, jede Assertion abzufangen, um je nach Ergebnis den Status der Anwendung oder Website zu protokollieren.

Beispielsweise ist es ziemlich praktisch, jedes Mal einen Screenshot zu machen, wenn eine Assertion fehlschlägt. In Ihrem `jasmineOpts` können Sie eine Eigenschaft namens `ExpectationResultHandler` hinzufügen, die eine auszuführende Funktion übernimmt. Die Parameter der Funktion geben Auskunft über das Ergebnis der Assertion.

Das folgende Beispiel zeigt, wie Sie einen Screenshot erstellen, wenn eine Assertion fehlschlägt:

```js
jasmineOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function(passed, assertion) {
        /**
         * only take screenshot if assertion failed
         */
        if(passed) {
            return
        }

        browser.saveScreenshot(`assertionError_${assertion.error.message}.png`)
    }
},
```

**Hinweis:** Sie können die Testausführung nicht anhalten, um etwas Asynchrones zu tun. Es kann vorkommen, dass der Befehl zu lange dauert und sich der Zustand der Website geändert hat. (Obwohl normalerweise nach weiteren 2 Befehlen der Screenshot trotzdem gemacht wird, was immer noch _einige_ wertvolle Informationen über den Fehler liefert.)

### Jasmin-Optionen

Die folgenden Optionen können in Ihrer `wdio.conf.js` angewendet werden, um Ihre Jasmine-Umgebung mit der Eigenschaft `jasmineOpts` zu konfigurieren. Weitere Informationen zu diesen Konfigurationsoptionen finden Sie in der [Jasmine-Dokumentation](https://jasmine.github.io/api/edge/Configuration).

#### defaultTimeoutInterval
Standard-Timeout-Intervall für Tests.

Type: `number`<br /> Default: `60000`

#### helpers
Liste von Dateipfaden (und Globs) relativ zu `spec_dir`, die vor den Jasmin-Spezifikationen eingefügt werden sollen.

Type: `string[]`<br /> Default: `[]`

#### requires
Die Option `requires` ist nützlich, wenn Sie grundlegende Funktionen hinzufügen oder erweitern möchten (WebdriverIO-Framework-Option.

Type: `string[]`<br /> Default: `[]`

#### random
Ob die Ausführungsreihenfolge der Spezifikation randomisiert werden soll.

Type: `boolean`<br /> Default: `true`

#### seed
Seed als Basis für die Randomisierung zu verwenden. Null bewirkt, dass der Seed zu Beginn der Ausführung zufällig bestimmt wird.

Type: `Function`<br /> Default: `null`

#### failSpecWithNoExpectations
Definiert, ob der Test als fehlgeschlagen markiert werden soll, wenn keine Assertion gemacht wurde. Standardmäßig wird eine Spezifikation, die keine Assertion enthält, als bestanden gemeldet. Wenn Sie dies auf „true“ setzen, wird eine solcher Test als Fehler gemeldet.

Type: `boolean`<br /> Default: `false`

#### oneFailurePerSpec
Ob bewirkt werden soll, dass Tests nur einen Erwartungsfehler aufweisen.

Type: `boolean`<br /> Default: `false`

#### specFilter
Funktion zum Filtern von Spezifikationen.

Type: `Function`<br /> Default: `(spec) => true`

#### grep
Führen Sie nur Tests aus, die mit dieser Zeichenfolge oder diesem regulären Ausdruck übereinstimmen. (Nur zutreffend, wenn keine benutzerdefinierte `specFilter` Funktion eingestellt ist)

Type: `string|Regexp`<br /> Default: `null`

#### invertGrep
Wenn gesetzt, werden die übereinstimmenden Tests invertiert und nur Tests ausgeführt, die nicht mit dem in `grep`verwendeten Ausdruck übereinstimmen. (Nur zutreffend, wenn keine benutzerdefinierte `specFilter` Funktion eingestellt ist)

Type: `boolean`<br /> Default: `false`

## Cucumber verwenden

Installieren Sie zuerst das Adapterpaket von NPM:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

Wenn Sie Cucumber verwenden möchten, setzen Sie die Eigenschaft `framework` auf `cucumber` , indem Sie `framework: 'cucumber'` zur Konfigurationsdatei [](configurationfile) hinzufügen.

Optionen für Cucumber können in der Konfigurationsdatei mit `cucumberOpts`angegeben werden. Schauen Sie sich die gesamte Liste der Optionen [hier an](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options).

Um Cucumber schnell zum Laufen zu bringen, werfen Sie einen Blick auf unser [`Cucumber-Boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) Projekt, welches viele Step-Definitionen enthält, die Sie für den Einstieg benötigen, um sofort mit dem Schreiben von Feature-Dateien zu starten.

### Cucumber Optionen

Die folgenden Optionen können in Ihrer `wdio.conf.js` angewendet werden, um Ihre Cucumber-Umgebung mit der Eigenschaft `cucumberOpts` zu konfigurieren:

#### backtrace
Vollständige Rückverfolgung für Fehler anzeigen.

Type: `Boolean`<br /> Default: `true`

#### requireModule
Laden von Modulen, die vor den Support Dateien geladen werden sollen.

Type: `string[]`<br /> Default: `[]`<br /> Example:

```js
cucumberOpts: {
    requireModule: ['@babel/register']
    // or
    requireModule: [
        [
            '@babel/register',
            {
                rootMode: 'upward',
                ignore: ['node_modules']
            }
        ]
    ]
 }
 ```

#### failAmbiguousDefinitions
Uneindeutige Definitionen als Fehler markieren. Bitte beachten Sie, dass dies eine `@wdio/cucumber-framework` spezifische Option ist und von Cucumber selbst nicht erkannt wird.

Type: `boolean`<br /> Default: `false`

#### failFast
Brechen Sie den Test-Lauf beim ersten Fehler ab.

Type: `boolean`<br /> Default: `false`

#### ignoreUndefinedDefinitions
Behandeln Sie undefinierte Definitionen als Warnungen. Bitte beachten Sie, dass dies eine @wdio/cucumber-framework spezifische Option ist und von Cucumber selbst nicht erkannt wird.

Type: `boolean`<br /> Default: `false`

#### names
Führen Sie nur die Szenarien aus, deren Name dem Ausdruck entspricht (wiederholbar).

Type: `RegExp[]`<br /> Default: `[]`

#### profile
Geben Sie das zu verwendende Cucumber-Profil an.

Type: `string[]`<br /> Default: `[]`

#### require
Liste der Dateien, die die Step-Definitionen implementieren. Liste der Dateien, die die Step-Definitionen implementieren Liste der Dateien, die die Step-Definitionen implementieren Sie können auch einen Glob für Ihre Step-Definitionen angeben.

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### snippetSyntax
Geben Sie eine benutzerdefinierte Snippet-Syntax an.

Type: `string`<br /> Default: `null`

#### snippets
Step Definitionen für ausstehende Schritte ausblenden.

Type: `boolean`<br /> Default: `true`

#### source
Quell-URIS ausblenden.

Type: `boolean`<br /> Default: `true`

#### strict
Fehlgeschlagen, wenn undefinierte oder ausstehende Schritte vorhanden sind.

Type: `boolean`<br /> Default: `false`

#### tagExpression
Führen Sie nur die Funktionen oder Szenarien mit Tags aus, die dem Ausdruck entsprechen. Weitere Einzelheiten finden Sie in der [Cucumber-Dokumentation](https://docs.cucumber.io/cucumber/api/#tag-expressions).

Type: `string`<br /> Default: `null`

#### tagsInTitle
Cucumber-Tags zum Funktions- oder Szenarionamen hinzufügen.

Type: `boolean`<br /> Default: `false`

#### timeout
Timeout in Millisekunden für Schrittdefinitionen.

Type: `number`<br /> Default: `30000`

### Überspringen von Tests in Cucumber

Beachten Sie, dass Sie, wenn Sie einen Test mit den in `cucumberOpts` verfügbaren Filterfunktionen für Cucumber Tests überspringen möchten, dies für alle Browser und Geräte tun werden, die in den Funktionen konfiguriert sind. Um Szenarien nur für bestimmte Browser-Kombinationen überspringen zu können, ohne dass eine Sitzung gestartet wird, falls dies nicht erforderlich ist, stellt WebdriverIO die folgende spezifische Tag-Syntax für Gurke bereit:

`@skip([condition])`

ist eine optionale Kombination von Capability-Eigenschaften mit ihren Werten, die, wenn **alle** übereinstimmen, dazu führen, dass das markierte Szenario oder Feature übersprungen wird. Natürlich können Sie Szenarien und Funktionen mehrere Tags hinzufügen, um Tests unter verschiedenen Bedingungen zu überspringen.

Sie können auch die Annotation '@skip' verwenden, um Tests zu überspringen, ohne 'tagExpression' zu ändern. In diesem Fall werden die übersprungenen Tests im Testbericht angezeigt.

Hier haben Sie einige Beispiele für diese Syntax:
- `@skip` oder `@skip()`: Überspringt immer das markierte Element
- `@skip(browserName="chrome")`: Der Test wird nicht für Chrome-Browser ausgeführt.
- `@skip(browserName="firefox";platformName="linux")`: überspringt den Test in Firefox in Linux.
- `@skip(browserName=["chrome","firefox"])`: Markierte Steps werden sowohl mit Chrome- als auch mit dem Firefox-Browser übersprungen.
- `@skip(browserName=/i.*explorer/`: Funktionen mit Browsern, die mit dem regulären Ausdruck übereinstimmen, werden übersprungen (z.B.: `iexplorer`, `internet explorer`, `internet-explorer`, ...).

### Hilfe zum Importieren von Schrittdefinitionen

Um Schrittdefinitionshelfer wie `Given`, `When` or `Then` oder Hooks zu verwenden, sollten Sie then from `@cucumber/cucumber`importieren, z. B. so:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Wenn Sie Cucumber jetzt bereits für andere Arten von Tests verwenden, die nichts mit WebdriverIO zu tun haben und für die Sie eine bestimmte Version verwenden, müssen Sie diese Helfer in Ihre e2e-Tests aus dem WebdriverIO Cucumber-Paket importieren, z.B.:

```js
import { Given, When, Then } from '@wdio/cucumber-framework'
```

Dadurch wird sichergestellt, dass Sie die richtigen Helfer innerhalb des WebdriverIO-Frameworks verwenden, und Sie können eine unabhängige Cucumber-Version für andere Arten von Tests verwenden.
