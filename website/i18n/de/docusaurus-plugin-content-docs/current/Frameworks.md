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

Standardmäßig stellt WebdriverIO eine [Assertion-Library](Assertion.md) bereit, die Sie direkt nutzen können:

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

Wenn Sie etwas asynchron ausführen möchten, nutzen Sie Node.js `async`/`await` features.

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
Tests die als Pending markiert sind, werden als Fehler angegeben.

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
The `requires` option is useful when you want to add or extend some basic functionality.

Type: `string[]`<br /> Default: `[]`

#### random
Whether to randomize spec execution order.

Type: `boolean`<br /> Default: `true`

#### seed
Seed to use as the basis of randomization. Null causes the seed to be determined randomly at the start of execution.

Type: `Function`<br /> Default: `null`

#### failSpecWithNoExpectations
Whether to fail the spec if it ran no expectations. By default a spec that ran no expectations is reported as passed. Setting this to true will report such spec as a failure.

Type: `boolean`<br /> Default: `false`

#### oneFailurePerSpec
Whether to cause specs to only have one expectation failure.

Type: `boolean`<br /> Default: `false`

#### specFilter
Function to use to filter specs.

Type: `Function`<br /> Default: `(spec) => true`

#### grep
Only run tests matching this string or regexp. (Only applicable if no custom `specFilter` function is set)

Type: `string|Regexp`<br /> Default: `null`

#### invertGrep
If true it inverts the matching tests and only runs tests that don't match with the expression used in `grep`. (Only applicable if no custom `specFilter` function is set)

Type: `boolean`<br /> Default: `false`

## Using Cucumber

First, install the adapter package from NPM:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

If you want to use Cucumber, set the `framework` property to `cucumber` by adding `framework: 'cucumber'` to the [config file](ConfigurationFile.md).

Options for Cucumber can be given in the config file with `cucumberOpts`. Check out the whole list of options [here](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options).

To get up and running quickly with Cucumber, have a look on our [`cucumber-boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) project that comes with all the step definitions you need to get stared, and you'll be writing feature files right away.

### Cucumber Options

The following options can be applied in your `wdio.conf.js` to configure your Cucumber environment using the `cucumberOpts` property:

#### backtrace
Show full backtrace for errors.

Type: `Boolean`<br /> Default: `true`

#### requireModule
Require modules prior to requiring any support files.

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
Treat ambiguous definitions as errors. Please note that this is a `@wdio/cucumber-framework` specific option and not recognized by cucumber-js itself.

Type: `boolean`<br /> Default: `false`

#### failFast
Abort the run on first failure.

Type: `boolean`<br /> Default: `false`

#### ignoreUndefinedDefinitions
Treat undefined definitions as warnings. Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself.

Type: `boolean`<br /> Default: `false`

#### names
Only execute the scenarios with name matching the expression (repeatable).

Type: `RegExp[]`<br /> Default: `[]`

#### profile
Specify the profile to use.

Type: `string[]`<br /> Default: `[]`

#### require
Require files containing your step definitions before executing features. You can also specify a glob to your step definitions.

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### snippetSyntax
Specify a custom snippet syntax.

Type: `string`<br /> Default: `null`

#### snippets
Hide step definition snippets for pending steps.

Type: `boolean`<br /> Default: `true`

#### source
Hide source uris.

Type: `boolean`<br /> Default: `true`

#### strict
Fail if there are any undefined or pending steps.

Type: `boolean`<br /> Default: `false`

#### tagExpression
Only execute the features or scenarios with tags matching the expression. Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.

Type: `string`<br /> Default: `null`

#### tagsInTitle
Add cucumber tags to feature or scenario name.

Type: `boolean`<br /> Default: `false`

#### timeout
Timeout in milliseconds for step definitions.

Type: `number`<br /> Default: `30000`

### Skipping tests in cucumber

Note that if you want to skip a test using regular cucumber test filtering capabilities available in `cucumberOpts`, you will do it for all the browsers and devices configured in the capabilities. In order to be able to skip scenarios only for specific capabilities combinations without having a session started if not necessary, webdriverio provides the following specific tag syntax for cucumber:

`@skip([condition])`

were condition is an optional combination of capabilities properties with their values that when **all** matched with cause the tagged scenario or feature to be skipped. Of course you can add several tags to scenarios and features to skip a tests under several different conditions.

You can also use the '@skip' annotation to skip tests without changing `tagExpression'. In this case the skipped tests will be displayed in the test report.

Here you have some examples of this syntax:
- `@skip` or `@skip()`: will always skip the tagged item
- `@skip(browserName="chrome")`: the test will not be executed against chrome browsers.
- `@skip(browserName="firefox";platformName="linux")`: will skip the test in firefox over linux executions.
- `@skip(browserName=["chrome","firefox"])`: tagged items will be skipped for both chrome and firefox browsers.
- `@skip(browserName=/i.*explorer/`: capabilities with browsers matching the regexp will be skipped (like `iexplorer`, `internet explorer`, `internet-explorer`, ...).

### Import Step Definition Helper

In order to use step definition helper like `Given`, `When` or `Then` or hooks, you are suppose to import then from `@cucumber/cucumber`, e.g. like this:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Now, if you use Cucumber already for other types of tests unrelated to WebdriverIO for which you use a specific version you need to import these helpers in your e2e tests from the WebdriverIO Cucumber package, e.g.:

```js
import { Given, When, Then } from '@wdio/cucumber-framework'
```

This ensures that you use the right helpers within the WebdriverIO framework and allows you to use an independant Cucumber version for other types of testing.
