---
id: configuration
title: Konfiguration
---

Basierend auf dem [Setup-Typ](./SetupTypes.md) (z. B. die Verwendung der Raw-Protokollbindungen, WebdriverIO als eigenständiges Paket oder der WDIO-Testrunner) stehen verschiedene Optionen zur Verfügung, um die Umgebung zu steuern.

## WebDriver-Optionen

Bei Verwendung des Protokollpakets [`webdriver`](https://www.npmjs.com/package/webdriver) sind folgende Optionen definiert:

### protocol

Bei der Kommunikation mit dem Browser Treibers zu verwendendes Protokoll.

Type: `String`<br /> Default: `http`

### hostname

Host Ihres Browser Treibers.

Type: `String`<br /> Default: `localhost`

### port

Port für den Browser Treiber.

Type: `Number`<br /> Default: `4444`

### path

Pfad zum Browser Treiber Endpunkt.

Type: `String`<br /> Default: `/`

### queryParams

Queryparameter, die an den Browser Treiber weitergegeben werden.

Type: `Object`<br /> Default: `null`

### user

Ihr Cloud-Service-Benutzername (funktioniert nur für [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com), [CrossBrowserTesting](https://crossbrowsertesting.com) oder [LambdaTest](https://www.lambdatest.com) Konten). Wenn festgelegt, stellt WebdriverIO automatisch Verbindungsoptionen für Sie ein. Wenn Sie keinen Cloud-Anbieter verwenden, kann dies verwendet werden, um jedes andere WebDriver-Backend zu authentifizieren.

Type: `String`<br /> Default: `null`

### key

Ihr Cloud-Service-Benutzername (funktioniert nur für [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com), [CrossBrowserTesting](https://crossbrowsertesting.com) oder [LambdaTest](https://www.lambdatest.com) Konten). Wenn festgelegt, stellt WebdriverIO automatisch Verbindungsoptionen für Sie ein. Wenn Sie keinen Cloud-Anbieter verwenden, kann dies verwendet werden, um jedes andere WebDriver-Backend zu authentifizieren.

Type: `String`<br /> Default: `null`

### capabilities

Definiert die Capabilities, die Sie in Ihrer WebDriver-Sitzung ausführen möchten. Sehen Sie sich das [WebDriver-Protokoll](https://w3c.github.io/webdriver/#capabilities) für weitere Details an. Wenn Sie einen älteren Treiber ausführen, der das WebDriver-Protokoll nicht unterstützt, müssen Sie die [JSONWireProtocol-Funktionen](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) verwenden, um eine Sitzung erfolgreich auszuführen.

Neben den WebDriver-basierten Funktionen können Sie browser- und Cloud-Vendor-spezifische Optionen anwenden, die eine tiefere Konfiguration für den Remote-Browser oder das Remote-Gerät ermöglichen. Diese sind in den entsprechenden Herstellerunterlagen dokumentiert, z. B.:

- `goog:chromeOptions`: for [Google Chrome](https://chromedriver.chromium.org/capabilities#h.p_ID_106)
- `moz:firefoxOptions`: for [Mozilla Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html)
- `ms:edgeOptions`: for [Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options#using-the-edgeoptions-class)
- `sauce:options`: for [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional)
- `bstack:options`: for [BrowserStack](https://www.browserstack.com/automate/capabilities?tag=selenium-4#)
- `selenoid:options`: for [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)

Ein nützliches Dienstprogramm ist außerdem der Sauce Labs [Automated Test Configurator](https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/), der Ihnen hilft, dieses Objekt zu erstellen, indem Sie Ihre gewünschten Capability zusammenklicken.

Type: `Object`<br /> Default: `null`

**Beispiel:**

```js
{
    browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
    browserVersion: '27.0', // browser version
    platformName: 'Windows 10' // OS platform
}
```

Wenn Sie Web- oder native Tests auf Mobilgeräten ausführen, unterscheiden sich `Capabilities` vom WebDriver-Protokoll. Siehe [Appium Docs](http://appium.io/docs/en/writing-running-appium/caps/) für weitere Details.

### logLevel

Grad der Ausführlichkeit des Loggings.

Type: `String`<br /> Default: `info`<br /> Options: `trace` | `debug` | `info` | `warn` | `error` | `silent`

### outputDir

Verzeichnis zum Speichern aller Testrunner-Logdateien (inklusive Reporter-Logs und `wdio` Logs). Wenn nicht festgelegt, werden alle Protokolle an `stdout` weitergeleitet. Da die meisten Reporter ihre Information an das `stdout` weitergeben, wird empfohlen, diese Option nur für bestimmte Reporter zu verwenden, bei denen es sinnvoller ist, den Bericht in eine Datei zu verschieben (wie zum Beispiel den `junit` Reporter).

Bei der Ausführung im Standalone Modus ist die einzige generierte Log Datei die `wdio` Log Datei.

Type: `String`<br /> Default: `null`

### connectionRetryTimeout

Timeout für jede WebDriver-Befehl, der an einen Treiber oder ein Grid gesendet wird.

Type: `Number`<br /> Default: `120000`

### connectionRetryCount

Maximale Anzahl von Wiederholungsversuchen für Befehle an den Browser Treiber.

Type: `Number`<br /> Default: `3`

### agent

Ermöglicht Ihnen, einen benutzerdefinierten`http`/`https`/`http2` [Agenten](https://www.npmjs.com/package/got#agent) zu verwenden, um Anfragen zu stellen.

Type: `Object`<br /> Default:

```js
{
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
}
```

### headers

Geben Sie benutzerdefinierte `header` an, die an jeden WebDriver-Befehl übergeben werden oder wenn über Puppeteer mithilfe des CDP-Protokolls eine Verbindung zum Browser hergestellen wollen.

:::caution

Diese Header __werden nicht__ an Anfragen, die im Browser gestellt werden, übergeben. Wenn Sie nach dem Ändern von Browser Requests suchen, schauen Sie sich bitte [#6361](https://github.com/webdriverio/webdriverio/issues/6361) an!

:::

Type: `Object`<br /> Default: `{}`

### transformRequest

Funktion, die [HTTP-Requests](https://github.com/sindresorhus/got#options) abfängt, bevor ein WebDriver Befehl gesendet wird

Type: `(RequestOptions) => RequestOptions`<br /> Default: *none*

### transformResponse

Funktion, die HTTP-Responses abfängt, nachdem das Resultat eines WebDriver-Befehls eingetroffen ist. Der Funktion wird das ursprüngliche Antwortobjekt als Erstes und die entsprechenden Request Option als zweites Argument übergeben.

Type: `(Response, RequestOptions) => Response`<br /> Default: *none*

### strictSSL

Legt fest, ob ein gültiges SSL-Zertifikat erforderlich ist. Es kann über eine Umgebungsvariable als `STRICT_SSL` oder `strict_ssl`gesetzt werden.

Type: `Boolean`<br /> Default: `true`

### enableDirectConnect

Aktiviere [Appium direct connection feature](https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments). Es tut nichts, wenn die Antwort keine richtigen Schlüssel hatte, während das Flag aktiviert ist.

Type: `Boolean`<br /> Default: `true`

---

## WebdriverIO

Die folgenden Optionen (einschließlich der oben aufgeführten) können mit WebdriverIO im Standalone-Modus verwendet werden:

### automationProtocol

Definieren Sie das Protokoll, das Sie für Ihre Browserautomatisierung verwenden möchten. Derzeit werden nur [`webdriver`](https://www.npmjs.com/package/webdriver) und [`devtools`](https://www.npmjs.com/package/devtools) unterstützt, da dies die wichtigsten verfügbaren Browser-Automatisierungstechnologien sind.

Wenn Sie den Browser mit `devtools`automatisieren möchten, stellen Sie sicher, dass Sie das notwendige NPM-Paket installiert haben (`$ npm install --save-dev devtools`).

Type: `String`<br /> Default: `webdriver`

### baseUrl

Kürzen Sie `url` Befehle ab, indem Sie eine Basis-URL festlegen.
- Wenn Ihr Parameter `url` mit `/`beginnt, wird `baseUrl` vorangestellt (mit Ausnahme des Pfads `baseUrl`, falls vorhanden).
- Wenn Ihr Parameter `url` ohne Schema oder `/` (wie `some/path`) beginnt, wird die vollständige `baseUrl` direkt vorangestellt.

Type: `String`<br /> Default: `null`

### waitforTimeout

Standard-Timeout für alle `waitFor*` -Befehle. (Beachten Sie den Kleinbuchstaben `f` im Optionsnamen.) (Beachten Sie den Kleinbuchstaben `f` im Optionsnamen.) Diese Zeitüberschreitung __nur__ wirkt sich auf Befehle aus, die mit `waitFor*` und ihrer Standardwartezeit beginnen.

Informationen zum Erhöhen des Timeouts für einen _Test_finden Sie in der Framework-Dokumentation.

Type: `Number`<br /> Default: `3000`

### waitforInterval

Standardintervall für alle `waitFor*` Befehle, um zu prüfen, ob ein erwarteter Zustand (z. B. Element Sichtbarkeit) geändert wurde.

Type: `Number`<br /> Default: `500`

### region

Wenn Sie auf Sauce Labs laufen, können Sie Tests zwischen verschiedenen Rechenzentren durchführen: USA oder EU. Um Ihre Region in EU zu ändern, fügen Sie `region: 'eu'` zu Ihrer Konfiguration hinzu.

__Hinweis:__ Dies hat nur Auswirkungen, wenn Sie `user` und `key`, die mit Ihrem Sauce Labs-Konto verbunden sind, in Ihren Options bereitstellen.

Type: `String`<br /> Default: `us`

*(nur für VM und oder Emu/Simu-latoren)*

---

## Testrunner Options

Die folgenden Optionen (einschließlich der oben aufgeführten) sind nur für die Ausführung von WebdriverIO mit dem WDIO-Testrunner definiert:

### specs

Definieren Sie Test Dateien für die Testausführung. Sie können entweder ein Glob-Muster angeben, um mehrere Dateien gleichzeitig zu finden, oder ein Glob und eine Reihe von Pfaden in einem Array einschließen, um sie in einem einzelnen Worker-Prozessen auszuführen. Alle Pfade werden relativ zum Pfad der Konfigurationsdatei gesehen.

Type: `(String | String[])[]`<br /> Default: `[]`

### exclude

Schließen Sie Dateien von der Testausführung aus. Alle Pfade werden relativ zum Pfad der Konfigurationsdatei gesehen.

Type: `String[]`<br /> Default: `[]`

### suites

Ein Objekt, das verschiedene Suiten beschreibt, die Sie dann mit der Option `--suite` auf der Befehlszeilenschnittstelle `wdio` angeben können.

Type: `Object`<br /> Default: `{}`

### capabilities

Ähnlich wie im oberen Abschnitt beschriebene `capabilities` Option, außer das mit dieser Option, entweder ein [`Multiremote`](Multiremote.md) Objekt oder mehrere Test Sessions in einem Array zur parallelen Ausführung angegeben werden können.

Sie können die gleichen anbieter- und browserspezifischen Capabilities wie oben[anwenden](/docs/configuration#capabilities).

Type: `Object`|`Object[]`<br /> Default: `[{ maxInstances: 5, browserName: 'firefox' }]`

### maxInstances

Maximale Anzahl parallel laufender Worker insgesamt.

__Hinweis:__ kann eine Zahl sein, die bis `100` oder weiter geht, wenn die Tests auf einigen externen Cloud Anbietern durchgeführt werden. Dort werden die Tests nicht auf einer einzelnen Maschine, sondern auf mehreren VMs getestet. Wenn die Tests auf einem lokalen Entwicklungscomputer ausgeführt werden sollen, verwenden Sie eine sinnvollere Zahl, z. B. `3`, `4`oder `5`. Im Wesentlichen ist dies die Anzahl der Browser, die gleichzeitig gestartet werden und Ihre Tests gleichzeitig ausführen, also hängt es davon ab, wie viel RAM auf Ihrem Computer vorhanden ist und wie viele andere Apps auf Ihrem Computer ausgeführt werden.

Type: `Number`<br /> Default: `100`

### maxInstancesPerCapability

Maximale Gesamtzahl parallel laufender Worker pro Capability.

Type: `Number`<br /> Default: `100`

### injectGlobals

Wenn gesetzt, werden die WebdriverIO Variablen (z. B. `browser`, `$` und `$$`) in die globale Umgebung eingefügt. Wenn Sie die Option allerdings auf `false` setzen, sollten Sie diese aus dem `@wdio/globals` Paket importieren, z.B.:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

Hinweis: WebdriverIO ist nicht für das Setzen von Test-Framework-spezifischen Globalen Variablen verantwortlich.

Type: `Boolean`<br /> Default: `true`

### bail

Wenn Sie möchten, dass Ihr Testlauf nach einer bestimmten Anzahl von Testfehlern beendet wird, verwenden Sie `bail`. (Der Standardwert ist `0`, wodurch alle Tests ausgeführt werden, egal was passiert.) **Hinweis:** Bitte beachten Sie, dass bei Verwendung eines Test-Runners eines Drittanbieters (z. B. Mocha) möglicherweise eine zusätzliche Konfiguration erforderlich ist.

Type: `Number`<br /> Default: `0` (don't bail; run all tests)

### specFileRetries

Die Anzahl der Wiederholungen einer gesamten Testdatei, wenn sie als Ganzes fehlschlägt.

Type: `Number`<br /> Default: `0`

### specFileRetriesDelay

Verzögerung in Sekunden zwischen den Wiederholungsversuchen der Testdatei.

Type: `Number`<br /> Default: `0`

### specFileRetriesDeferred

Legt fest, ob wiederholte Testdateien sofort wiederholt oder an das Ende der Warteschlange verschoben werden sollen.

Type: `Boolean`<br /> Default: `true`

### services

WebdriverIO Services übernehmen eine bestimmte Aufgabe, um die Sie sich nicht kümmern möchten. Sie erweitern Ihren Testaufbau nahezu ohne Aufwand.

Type: `String[]|Object[]`<br /> Default: `[]`

### framework

Definiert das vom WDIO-Testrunner zu verwendende Testframework.

Type: `String`<br /> Default: `mocha`<br /> Options: `mocha` | `jasmine` | `cucumber`

### mochaOpts, jasmineOpts and cucumberOpts


Spezifische Framework-bezogene Optionen. Informationen zu den verfügbaren Optionen finden Sie in der Dokumentation zum Framework-Adapter. Lesen Sie mehr dazu in [Frameworks](./Frameworks.md).

Type: `Object`<br /> Default: `{ timeout: 10000 }`

### cucumberFeaturesWithLineNumbers

Liste der Cucumber Features mit Zeilennummern (funktioniert nur, wenn [Cucumber](./Frameworks.md#using-cucumber) verwendet wird).

Type: `String[]` Default: `[]`

### reporters

Liste der zu verwendenden Reporter. Ein Reporter kann entweder ein String sein oder ein Array von `['reporterName', { /* reporter options */}]` bei dem der erste Teil des Arrays der Reporter Name und der zweite Teil die Reporter Optionen sind.

Type: `String[]|Object[]`<br /> Default: `[]`

Beispiel:

```js
reporters: [
    'dot',
    'spec'
    ['junit', {
        outputDir: `${__dirname}/reports`,
        otherOption: 'foobar'
    }]
]
```

### reporterSyncInterval

Legt fest, in welchem Intervall der Reporter prüfen soll, ob er synchronisiert ist, wenn er seine Logs asynchron verarbeitet werden (z. B. wenn Logs an einen Drittanbieter hochgeladen werden).

Type: `Number`<br /> Default: `100` (ms)

### reporterSyncTimeout

Legt die maximale Zeit fest, die Reporter haben, um alle ihre Daten zu verarbeiten.

Type: `Number`<br /> Default: `5000` (ms)

### execArgv

Beim Starten von untergeordneten Worker-Prozesse anzugebende Argumente.

Type: `String[]`<br /> Default: `null`

### filesToWatch

Eine Reihe von Glob-unterstützenden Pfadpatterns, die dem Testrunner mitteilen, dass er zusätzlich diese Dateien auf Änderungen beobachten soll, z. B. Anwendungsdateien, im Falle der Parameter `--watch` wurde gesetzt. Standardmäßig überwacht der Testrunner bereits alle Testdateien.

Type: `String[]`<br /> Default: `[]`

### autoCompileOpts

Compileroptionen bei Verwendung von WebdriverIO mit TypeScript oder Babel.

#### autoCompileOpts.autoCompile

Wenn auf `true` gesetzt, versucht der WDIO-Testrunner automatisch, die Testdateien zu transpilieren.

Type: `Object` Default: `{ transpileOnly: true }`

#### autoCompileOpts.tsNodeOpts

Konfigurieren Sie, wie [`ts-node`](https://www.npmjs.com/package/ts-node) die Dateien transpilieren soll.

Type: `Object` Default: `{ transpileOnly: true }`

#### autoCompileOpts.babelOpts

Konfigurieren Sie, wie [@babel/register](https://www.npmjs.com/package/@babel/register) die Dateien transpilieren soll.

Type: `Object` Default: `{}`

## Hooks

Mit dem WDIO-Testrunner können Sie Hooks festlegen, die zu bestimmten Zeiten des Test-Zyklus ausgelöst werden. Dies ermöglicht benutzerdefinierte Aktionen (z. B. Screenshot erstellen, wenn ein Test fehlschlägt).

Jeder Hook hat als Parameter spezifische Informationen über den Situation (z. B. Informationen über die Testsuite oder den Test). Lesen Sie mehr über alle Hook-Eigenschaften in [unserer Beispielkonfiguration](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L183-L326).

**Hinweis:** Einige Hooks (`onPrepare`, `onWorkerStart`, `onWorkerEnd` und `onComplete`) werden in einem anderen Prozess ausgeführt und können daher keine globalen Daten mit den anderen Hooks teilen, die im Workerprozess leben.

### onPrepare

Wird einmal ausgeführt, bevor alle Worker gestartet werden.

Parameter:

- `config` (`object`): WebdriverIO-Konfigurationsobjekt
- `param` (`object[]`): Liste der Capabilities

### onWorkerStart

Wird ausgeführt, bevor ein Worker-Prozess gestartet wird, und kann verwendet werden, um einen bestimmten Service für diesen Worker zu initialisieren und Laufzeitumgebungen asynchron zu ändern.

Parameter:

- `cid` (`string`): Capability-ID (z. B. 0-0)
- `caps` (`Objekt`): Enthält Capabilities für Sitzungen, die im Worker Prozess erstellt werden
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt werden sollen
- `args` (`object`): Objekt, das mit der Hauptkonfiguration zusammengeführt wird, sobald der Worker initialisiert ist
- `execArgv` (`string[]`): list of string arguments passed to the worker process

### onWorkerEnd

Gets executed just after a worker process has exited.

Parameters:

- `cid` (`string`): capability id (e.g 0-0)
- `exitCode` (`number`): 0 - success, 1 - fail
- `specs` (`string[]`): specs to be run in the worker process
- `retries` (`number`): number of retries used

### beforeSession

Gets executed just before initializing the webdriver session and test framework. It allows you to manipulate configurations depending on the capability or spec.

Parameters:

- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### before

Gets executed before test execution begins. At this point you can access to all global variables like `browser`. It is the perfect place to define custom commands.

Parameters:

- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process
- `browser` (`object`): instance of created browser/device session

### beforeSuite

Hook that gets executed before the suite starts

Parameters:

- `suite` (`object`): suite details

### beforeHook

Hook that gets executed *before* a hook within the suite starts (e.g. runs before calling beforeEach in Mocha)

Parameters:

- `test` (`object`): test details
- `context` (`object`): test context (represents World object in Cucumber)

### afterHook

Hook that gets executed *after* a hook within the suite ends (e.g. runs after calling afterEach in Mocha)

Parameters:

- `test` (`object`): test details
- `context` (`object`): test context (represents World object in Cucumber)
- `result` (`object`): hook result (contains `error`, `result`, `duration`, `passed`, `retries` properties)

### beforeTest

Function to be executed before a test (in Mocha/Jasmine only).

Parameters:

- `test` (`object`): test details
- `context` (`object`): scope object the test was executed with

### beforeCommand

Runs before a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): command name
- `args` (`*`): arguments that command would receive

### afterCommand

Runs after a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): command name
- `args` (`*`): arguments that command would receive
- `result` (`number`): 0 - command success, 1 - command error
- `error` (`Error`): error object if any

### afterTest

Function to be executed after a test (in Mocha/Jasmine) ends.

Parameters:

- `test` (`object`): test details
- `context` (`object`): scope object the test was executed with
- `result.error` (`Error`): error object in case the test fails, otherwise `undefined`
- `result.result` (`Any`): return object of test function
- `result.duration` (`Number`): duration of test
- `result.passed` (`Boolean`): true if test has passed, otherwise false
- `result.retries` (`Object`): informations to spec related retries, e.g. `{ attempts: 0, limit: 0 }`
- `result` (`object`): hook result (contains `error`, `result`, `duration`, `passed`, `retries` properties)

### afterSuite

Hook that gets executed after the suite has ended

Parameters:

- `suite` (`object`): suite details

### after

Gets executed after all tests are done. You still have access to all global variables from the test.

Parameters:

- `result` (`number`): 0 - test pass, 1 - test fail
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### afterSession

Gets executed right after terminating the webdriver session.

Parameters:

- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### onComplete

Gets executed after all workers got shut down and the process is about to exit. An error thrown in the onComplete hook will result in the test run failing.

Parameters:

- `exitCode` (`number`): 0 - success, 1 - fail
- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `result` (`object`): results object containing test results

### onReload

Gets executed when a refresh happens.

Parameters:

- `oldSessionId` (`string`): session ID of the old session
- `newSessionId` (`string`): session ID of the new session

### beforeFeature

Runs before a Cucumber Feature.

Parameters:

- `uri` (`string`): path to feature file
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber feature object

### afterFeature

Runs after a Cucumber Feature.

Parameters:

- `uri` (`string`): path to feature file
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber feature object

### beforeScenario

Runs before a Cucumber Scenario.

Parameters:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): world object containing information on pickle and test step
- `context` (`object`): Cucumber World object

### afterScenario

Runs after a Cucumber Scenario.

Parameters:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): world object containing information on pickle and test step
- `result` (`object`): results object containing scenario results
- `result.passed` (`boolean`): true if scenario has passed
- `result.error` (`string`): error stack if scenario failed
- `result.duration` (`number`): duration of scenario in milliseconds
- `context` (`object`): Cucumber World object

### beforeStep

Runs before a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber step object
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber scenario object
- `context` (`object`): Cucumber World object

### afterStep

Runs after a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber step object
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber scenario object
- `result`: (`object`): results object containing step results
- `result.passed` (`boolean`): true if scenario has passed
- `result.error` (`string`): error stack if scenario failed
- `result.duration` (`number`): duration of scenario in milliseconds
- `context` (`object`): Cucumber World object
