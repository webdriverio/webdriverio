---
id: frameworks
title: Frameworks
---

WebdriverIO Runner bietet integrierte Unterstützung für [Mocha](http://mochajs.org/), [Jasmine](http://jasmine.github.io/)und [Cucumber.js](https://cucumber.io/). Sie können es auch mit Drittanbieter-Open-Source-Frameworks, wie [Serenity/JS](#using-serenityjs) integrieren.

:::tip Integrieren von WebdriverIO mit Testframeworks
Um WebdriverIO mit einem Testframework zu integrieren, benötigen Sie ein Adapterpaket, das auf NPM verfügbar ist. Beachten Sie, dass das Adapterpaket am selben Speicherort installiert werden muss, an dem WebdriverIO installiert ist. Wenn Sie also WebdriverIO global installiert haben, stellen Sie sicher, dass Sie auch das Framework-Adapterpaket global installieren.
:::

Durch die Integration von WebdriverIO in ein Test-Framework können Sie über die globale `browser` Variable in Ihren Spezifikationsdateien oder Schrittdefinitionen auf die WebdriverIO-Instanz zugreifen. Beachten Sie, dass WebdriverIO sich auch um das Instanziieren und Beenden der Selenium-Sitzung kümmert, so dass Sie es nicht selbst tun müssen selbst.

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

#### failFast
Brechen Sie den Test-Lauf beim ersten Fehler ab.

Type: `boolean`<br /> Default: `false`

#### names
Führen Sie nur die Szenarien aus, deren Name dem Ausdruck entspricht (wiederholbar).

Type: `RegExp[]`<br /> Default: `[]`

#### require
Liste der Dateien, die die Step-Definitionen implementieren. Liste der Dateien, die die Step-Definitionen implementieren Liste der Dateien, die die Step-Definitionen implementieren Sie können auch einen Glob für Ihre Step-Definitionen angeben.

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

### import
Paths to where your support code is, for ESM.

Type: `String[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    import: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### strict
Fehlgeschlagen, wenn undefinierte oder ausstehende Schritte vorhanden sind.

Type: `boolean`<br /> Default: `false`

## tags
Führen Sie nur die Funktionen oder Szenarien mit Tags aus, die dem Ausdruck entsprechen. Weitere Einzelheiten finden Sie in der [Cucumber-Dokumentation](https://docs.cucumber.io/cucumber/api/#tag-expressions).

Type: `String`<br /> Default: ``

### timeout
Timeout in Millisekunden für Schrittdefinitionen.

Type: `Number`<br /> Default: `30000`

### retry
Specify the number of times to retry failing test cases.

Type: `Number`<br /> Default: `0`

### retryTagFilter
Only retries the features or scenarios with tags matching the expression (repeatable). This option requires '--retry' to be specified.

Type: `RegExp`

### tagsInTitle
Add cucumber tags to feature or scenario name

Type: `Boolean`<br /> Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### ignoreUndefinedDefinitions
Behandeln Sie undefinierte Definitionen als Warnungen.

Type: `Boolean`<br /> Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### failAmbiguousDefinitions
Uneindeutige Definitionen als Fehler markieren.

Type: `Boolean`<br /> Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### tagExpression
Only execute the features or scenarios with tags matching the expression. Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.

Type: `String`<br /> Default: ``

***Please note that this option would be deprecated in future. Use [`tags`](#tags) config property instead***

#### profile
Geben Sie das zu verwendende Cucumber-Profil an.

Type: `string[]`<br /> Default: `[]`

***Kindly take note that only specific values (worldParameters, name, retryTagFilter) are supported within profiles, as `cucumberOpts` takes precedence. Additionally, when using a profile, make sure that the mentioned values are not declared within `cucumberOpts`.***

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
- `@skip(browserName=/i.*explorer/)`: capabilities with browsers matching the regexp will be skipped (like `iexplorer`, `internet explorer`, `internet-explorer`, ...).

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

## Verwendung Serenity/JS

[Serenity/JS](https://serenity-js.org?pk_campaign=wdio8&pk_source=webdriver.io) ist ein Open-Source-Framework, das entwickelt wurde, um Akzeptanz- und Regressionstests komplexer Softwaresysteme schneller, kollaborativer und einfacher zu skalieren.

Für WebdriverIO-Testsuiten bietet Serenity/JS:
- [Verbesserte Berichterstattung](https://serenity-js.org/handbook/reporting/?pk_campaign=wdio8&pk_source=webdriver.io) – Sie können Serenity/JS als Drop-in-Ersatz für jedes integrierte WebdriverIO-Framework verwenden, um detaillierte Testausführungsberichte und eine lebendige Dokumentation Ihres Projekts zu erstellen.
- [Screenplay Pattern APIs](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io) – Um Ihren Testcode über Projekte und Teams hinweg portierbar und wiederverwendbar zu machen, bietet Ihnen Serenity/JS eine optionale [Abstraktionsschicht](https://serenity-js.org/api/webdriverio?pk_campaign=wdio8&pk_source=webdriver.io) zusätzlich zu den nativen WebdriverIO-APIs.
- [Integrationsbibliotheken](https://serenity-js.org/api/core/?pk_campaign=wdio8&pk_source=webdriver.io) - Für Testsuiten, die dem Screenplay Pattern folgen, bietet Serenity/JS auch optionale Integrationsbibliotheken, die Ihnen beim Schreiben von [API-Tests](https://serenity-js.org/api/rest/?pk_campaign=wdio8&pk_source=webdriver.io), [beim Verwalten lokaler Server](https://serenity-js.org/api/local-server/?pk_campaign=wdio8&pk_source=webdriver.io), [beim Durchführen von Behauptungen](https://serenity-js.org/api/assertions/?pk_campaign=wdio8&pk_source=webdriver.io)und mehr helfen!

![Beispiel für einen Serenity BDD-Bericht](/img/serenity-bdd-reporter.png)

### Installation von Serenity/JS

Um Serenity/JS zu einem [WebdriverIO-Projekt](https://webdriver.io/docs/gettingstarted)hinzuzufügen, installieren Sie die folgenden Serenity/JS-Module von NPM:

```sh npm2yarn
npm install @serenity-js/{core,web,webdriverio,assertions,console-reporter,serenity-bdd} --save-dev
```

Erfahren Sie mehr über Serenity/JS-Module:
- [`@serenity-js/core`](https://serenity-js.org/api/core/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/web`](https://serenity-js.org/api/web/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/webdriverio`](https://serenity-js.org/api/webdriverio/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/assertions`](https://serenity-js.org/api/assertions/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/console-reporter`](https://serenity-js.org/api/console-reporter/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io)

### Konfiguration von Serenity/JS

Um die Integration mit Serenity/JS zu aktivieren, konfigurieren Sie WebdriverIO wie folgt:

<Tabs>
<TabItem value="wdio-conf-typescript" label="TypeScript" default>

```typescript title="wdio.conf.ts"
import { WebdriverIOConfig } from '@serenity-js/webdriverio';

export const config: WebdriverIOConfig = {

    // Tell WebdriverIO to use Serenity/JS framework
    framework: '@serenity-js/webdriverio',

    // Serenity/JS configuration
    serenity: {
        // Configure Serenity/JS to use the appropriate adapter for your test runner
        runner: 'cucumber',
        // runner: 'mocha',
        // runner: 'jasmine',

        // Register Serenity/JS reporting services, a.k.a. the "stage crew"
        crew: [
            // Optional, print test execution results to standard output
            '@serenity-js/console-reporter',

            // Optional, produce Serenity BDD reports and living documentation (HTML)
            '@serenity-js/serenity-bdd',
            [ '@serenity-js/core:ArtifactArchiver', { outputDirectory: 'target/site/serenity' } ],

            // Optional, automatically capture screenshots upon interaction failure
            [ '@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' } ],
        ]
    },

    // Configure your Cucumber runner
    cucumberOpts: {
        // see Cucumber configuration options below
    },


    // ... or Jasmine runner
    jasmineOpts: {
        // see Jasmine configuration options below
    },

    // ... or Mocha runner
    mochaOpts: {
        // see Mocha configuration options below
    },

    runner: 'local',

    // Any other WebdriverIO configuration
};
```

</TabItem>
<TabItem value="wdio-conf-javascript" label="JavaScript">

```typescript title="wdio.conf.js"
export const config = {

    // Tell WebdriverIO to use Serenity/JS framework
    framework: '@serenity-js/webdriverio',

    // Serenity/JS configuration
    serenity: {
        // Configure Serenity/JS to use the appropriate adapter for your test runner
        runner: 'cucumber',
        // runner: 'mocha',
        // runner: 'jasmine',

        // Register Serenity/JS reporting services, a.k.a. the "stage crew"
        crew: [
            '@serenity-js/console-reporter',
            '@serenity-js/serenity-bdd',
            [ '@serenity-js/core:ArtifactArchiver', { outputDirectory: 'target/site/serenity' } ],
            [ '@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' } ],
        ]
    },

    // Configure your Cucumber runner
    cucumberOpts: {
        // see Cucumber configuration options below
    },


    // ... or Jasmine runner
    jasmineOpts: {
        // see Jasmine configuration options below
    },

    // ... or Mocha runner
    mochaOpts: {
        // see Mocha configuration options below
    },

    runner: 'local',

    // Any other WebdriverIO configuration
};
```

</TabItem>
</Tabs>

Erfahren Sie mehr über
- [Konfigurationsoptionen für Serenity/JS Cucumber](https://serenity-js.org/api/cucumber-adapter/interface/CucumberConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Konfigurationsoptionen für Serenity/JS Jasmine](https://serenity-js.org/api/jasmine-adapter/interface/JasmineConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Serenity/JS Mocha-Konfigurationsoptionen](https://serenity-js.org/api/mocha-adapter/interface/MochaConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [WebdriverIO-Konfigurationsdatei](configurationfile)

### Erstellung von Serenity BDD-Berichten und Dokumentation

[Serenity BDD-Berichte und Dokumentation](https://serenity-bdd.github.io/docs/reporting/the_serenity_reports) werden von [Serenity BDD CLI](https://github.com/serenity-bdd/serenity-core/tree/main/serenity-cli)generiert, ein Java-Programm, das vom Modul [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io) heruntergeladen und verwaltet wird.

Um Serenity BDD-Berichte zu erstellen, muss Ihre Testsuite:
- Laden Sie die Serenity BDD CLI herunter, indem Sie `serenity-bdd update` aufrufen, das die CLI `jar` lokal zwischenspeichert
- Erstellen Sie Zwischenberichte von Serenity BDD `.json` , indem Sie [`SerenityBDDReporter`](https://serenity-js.org/api/serenity-bdd/class/SerenityBDDReporter/?pk_campaign=wdio8&pk_source=webdriver.io) gemäß den [Konfigurationsanweisungen](#configuring-serenityjs)registrieren
- Rufen Sie die Serenity BDD-CLI auf, wenn Sie den Bericht erstellen möchten, indem Sie `serenity-bdd run`aufrufen

Das von allen [Serenity/JS-Projektvorlagen](https://serenity-js.org/handbook/getting-started#serenityjs-project-templates?pk_campaign=wdio8&pk_source=webdriver.io) verwendete Muster basiert auf der Verwendung von:
- ein [`postinstall`](https://docs.npmjs.com/cli/v9/using-npm/scripts#life-cycle-operation-order) NPM-Skript zum Herunterladen der Serenity BDD CLI
- [`npm-failsafe`](https://www.npmjs.com/package/npm-failsafe) , um den Berichtsprozess auch dann auszuführen, wenn die Testsuite selbst fehlgeschlagen ist (genau dann, wenn Sie Testberichte am meisten benötigen ...).
- [`rimraf`](https://www.npmjs.com/package/rimraf) als bequeme Methode zum Entfernen aller Testberichte, die vom vorherigen Lauf übrig geblieben sind

```json title="package.json"
{
  "scripts": {
    "postinstall": "serenity-bdd update",
    "clean": "rimraf target",
    "test": "failsafe clean test:execute test:report",
    "test:execute": "wdio wdio.conf.ts",
    "test:report": "serenity-bdd run"
  }
}
```

Um mehr über den `SerenityBDDReporter`zu erfahren, konsultieren Sie bitte:
- Installationsanweisungen in [`@serenity-js/serenity-bdd` Dokumentation](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io),
- Konfigurationsbeispiele in [`SerenityBDDReporter` API-Dokumente](https://serenity-js.org/api/serenity-bdd/class/SerenityBDDReporter/?pk_campaign=wdio8&pk_source=webdriver.io),
- [Serenity/JS-Beispiele auf GitHub](https://github.com/serenity-js/serenity-js/tree/main/examples).

### Verwendung der Serenity/JS-Screenplay-Pattern-APIs

Das [Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io) ist ein innovativer, benutzerzentrierter Ansatz zum Schreiben hochwertiger automatisierter Abnahmetests. Es führt Sie zu einer effektiven Nutzung von Abstraktionsebenen, Ihren Testszenarien dabei, die Geschäftssprache Ihrer Domäne zu erfassen, und fördert gute Test- und Softwareentwicklungsgewohnheiten in Ihrem Team.

Standardmäßig, wenn Sie `@serenity-js/webdriverio` als Ihr WebdriverIO `Framework`, registrieren, konfiguriert Serenity/JS standardmäßig [Cast](https://serenity-js.org/api/core/class/Cast/?pk_campaign=wdio8&pk_source=webdriver.io) von [Akteuren](https://serenity-js.org/api/core/class/Actor/?pk_campaign=wdio8&pk_source=webdriver.io), wobei jeder Akteur Folgendes kann:
- [`BrowseTheWebWithWebdriverIO`](https://serenity-js.org/api/webdriverio/class/BrowseTheWebWithWebdriverIO/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`TakeNotes.usingAnEmptyNotepad()`](https://serenity-js.org/api/core/class/TakeNotes/?pk_campaign=wdio8&pk_source=webdriver.io)

Dies sollte ausreichen, um Ihnen den Einstieg in die Einführung von Testszenarien, die dem Drehbuchmuster folgen, auch in einer vorhandenen Testsuite zu erleichtern, zum Beispiel:

```typescript title="specs/example.spec.ts"
import { actorCalled } from '@serenity-js/core'
import { Navigate, Page } from '@serenity-js/web'
import { Ensure, equals } from '@serenity-js/assertions'

describe('My awesome website', () => {
    it('can have test scenarios that follow the Screenplay Pattern', async () => {
        await actorCalled('Alice').attemptsTo(
            Navigate.to(`https://webdriver.io`),
            Ensure.that(
                Page.current().title(),
                equals(`WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO`)
            ),
        )
    })

    it('can have non-Screenplay scenarios too', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser)
            .toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

Weitere Informationen zum Drehbuchmuster finden Sie hier:
- [Das Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Webtests mit Serenity/JS](https://serenity-js.org/handbook/web-testing/?pk_campaign=wdio8&pk_source=webdriver.io)
- ["BDD in Aktion, Zweite Ausgabe"](https://www.manning.com/books/bdd-in-action-second-edition)
