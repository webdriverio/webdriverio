---
id: frameworks
title: Frameworks
---

WebdriverIO Runner has built-in support for [Mocha](http://mochajs.org/), [Jasmine](http://jasmine.github.io/), and [Cucumber.js](https://cucumber.io/). You can also integrate it with 3rd-party open-source frameworks, such as [Serenity/JS](#using-serenityjs).

:::tip Integrating WebdriverIO with test frameworks
To integrate WebdriverIO with a test framework, you need an adapter package available on NPM. Note that the adapter package must be installed in the same location where WebdriverIO is installed. Wenn Sie also WebdriverIO global installiert haben, stellen Sie sicher, dass Sie auch das Framework-Adapterpaket global installieren.
:::

Integrating WebdriverIO with a test framework lets you access the WebDriver instance using the global `browser` variable in your spec files or step definitions. Note that WebdriverIO will also take care of instantiating and ending the Selenium session, so you don't have to do it yourself.

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

This ensures that you use the right helpers within the WebdriverIO framework and allows you to use an independent Cucumber version for other types of testing.

## Using Serenity/JS

[Serenity/JS](https://serenity-js.org?pk_campaign=wdio8&pk_source=webdriver.io) is an open-source framework designed to make acceptance and regression testing of complex software systems faster, more collaborative, and easier to scale.

For WebdriverIO test suites, Serenity/JS offers:
- [Enhanced Reporting](https://serenity-js.org/handbook/reporting/?pk_campaign=wdio8&pk_source=webdriver.io) - You can use Serenity/JS as a drop-in replacement of any built-in WebdriverIO framework to produce in-depth test execution reports and living documentation of your project.
- [Screenplay Pattern APIs](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io) - To make your test code portable and reusable across projects and teams, Serenity/JS gives you an optional [abstraction layer](https://serenity-js.org/api/webdriverio?pk_campaign=wdio8&pk_source=webdriver.io) on top of native WebdriverIO APIs.
- [Integration Libraries](https://serenity-js.org/api/core/?pk_campaign=wdio8&pk_source=webdriver.io) - For test suites that follow the Screenplay Pattern, Serenity/JS also provides optional integration libraries to help you write [API tests](https://serenity-js.org/api/rest/?pk_campaign=wdio8&pk_source=webdriver.io), [manage local servers](https://serenity-js.org/api/local-server/?pk_campaign=wdio8&pk_source=webdriver.io), [perform assertions](https://serenity-js.org/api/assertions/?pk_campaign=wdio8&pk_source=webdriver.io), and more!

![Serenity BDD Report Example](/img/serenity-bdd-reporter.png)

### Installing Serenity/JS

To add Serenity/JS to an [existing WebdriverIO project](https://webdriver.io/docs/gettingstarted), install the following Serenity/JS modules from NPM:

```sh npm2yarn
npm install @serenity-js/{core,web,webdriverio,assertions,console-reporter,serenity-bdd} --save-dev
```

Learn more about Serenity/JS modules:
- [`@serenity-js/core`](https://serenity-js.org/api/core/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/web`](https://serenity-js.org/api/web/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/webdriverio`](https://serenity-js.org/api/webdriverio/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/assertions`](https://serenity-js.org/api/assertions/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/console-reporter`](https://serenity-js.org/api/console-reporter/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io)

### Configuring Serenity/JS

To enable integration with Serenity/JS, configure WebdriverIO as follows:

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

Learn more about:
- [Serenity/JS Cucumber configuration options](https://serenity-js.org/api/cucumber-adapter/interface/CucumberConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Serenity/JS Jasmine configuration options](https://serenity-js.org/api/jasmine-adapter/interface/JasmineConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Serenity/JS Mocha configuration options](https://serenity-js.org/api/mocha-adapter/interface/MochaConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [WebdriverIO configuration file](configurationfile)

### Producing Serenity BDD reports and living documentation

[Serenity BDD reports and living documentation](https://serenity-bdd.github.io/docs/reporting/the_serenity_reports) are generated by [Serenity BDD CLI](https://github.com/serenity-bdd/serenity-core/tree/main/serenity-cli), a Java program downloaded and managed by the [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io) module.

To produce Serenity BDD reports, your test suite must:
- download the Serenity BDD CLI, by calling `serenity-bdd update` which caches the CLI `jar` locally
- produce intermediate Serenity BDD `.json` reports, by registering [`SerenityBDDReporter`](https://serenity-js.org/api/serenity-bdd/class/SerenityBDDReporter/?pk_campaign=wdio8&pk_source=webdriver.io) as per the [configuration instructions](#configuring-serenityjs)
- invoke the Serenity BDD CLI when you want to produce the report, by calling `serenity-bdd run`

The pattern used by all the [Serenity/JS Project Templates](https://serenity-js.org/handbook/getting-started#serenityjs-project-templates?pk_campaign=wdio8&pk_source=webdriver.io) relies on using:
- a [`postinstall`](https://docs.npmjs.com/cli/v9/using-npm/scripts#life-cycle-operation-order) NPM script to download the Serenity BDD CLI
- [`npm-failsafe`](https://www.npmjs.com/package/npm-failsafe) to run the reporting process even if the test suite itself has failed (which is precisely when you need test reports the most...).
- [`rimraf`](https://www.npmjs.com/package/rimraf) as a convenience method to remove any test reports left over from the previous run

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

To learn more about the `SerenityBDDReporter`, please consult:
- installation instructions in [`@serenity-js/serenity-bdd` documentation](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io),
- configuration examples in [`SerenityBDDReporter` API docs](https://serenity-js.org/api/serenity-bdd/class/SerenityBDDReporter/?pk_campaign=wdio8&pk_source=webdriver.io),
- [Serenity/JS examples on GitHub](https://github.com/serenity-js/serenity-js/tree/main/examples).

### Using Serenity/JS Screenplay Pattern APIs

The [Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io) is an innovative, user-centred approach to writing high-quality automated acceptance tests. It steers you towards an effective use of layers of abstraction, helps your test scenarios capture the business vernacular of your domain, and encourages good testing and software engineering habits on your team.

By default, when you register `@serenity-js/webdriverio` as your WebdriverIO `framework`, Serenity/JS configures a default [cast](https://serenity-js.org/api/core/class/Cast/?pk_campaign=wdio8&pk_source=webdriver.io) of [actors](https://serenity-js.org/api/core/class/Actor/?pk_campaign=wdio8&pk_source=webdriver.io), where every actor can:
- [`BrowseTheWebWithWebdriverIO`](https://serenity-js.org/api/webdriverio/class/BrowseTheWebWithWebdriverIO/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`TakeNotes.usingAnEmptyNotepad()`](https://serenity-js.org/api/core/class/TakeNotes/?pk_campaign=wdio8&pk_source=webdriver.io)

This should be enough to help you get started with introducing test scenarios that follow the Screenplay Pattern even to an existing test suite, for example:

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

To learn more about the Screenplay Pattern, check out:
- [The Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Web testing with Serenity/JS](https://serenity-js.org/handbook/web-testing/?pk_campaign=wdio8&pk_source=webdriver.io)
- ["BDD in Action, Second Edition"](https://www.manning.com/books/bdd-in-action-second-edition)
