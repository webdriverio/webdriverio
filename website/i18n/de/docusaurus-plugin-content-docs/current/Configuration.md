---
id: configuration
title: Konfiguration
---

Basierend auf dem [Setup-Type](/docs/setuptypes) (z. B. die Verwendung der Raw-Protokollbindungen, WebdriverIO als eigenständiges Paket oder der WDIO-Testrunner) stehen verschiedene Optionen zur Verfügung, um die Umgebung zu steuern.

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

Wenn Sie Web- oder native Tests auf Mobilgeräten ausführen, unterscheiden sich `Capabilities` vom WebDriver-Protokoll. Siehe [Appium Docs](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/) für weitere Details.

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

### cacheDir

The path to the root of the cache directory. This directory is used to store all drivers that are downloaded when attempting to start a session.

Type: `String`<br /> Default: `process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()`

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

Standard-Timeout für alle `waitFor*` -Befehle. (Beachten Sie den Kleinbuchstaben `f` im Optionsnamen.) (Beachten Sie den Kleinbuchstaben `f` im Optionsnamen.) (Beachten Sie den Kleinbuchstaben `f` im Optionsnamen.) Diese Zeitüberschreitung __nur__ wirkt sich auf Befehle aus, die mit `waitFor*` und ihrer Standardwartezeit beginnen.

Informationen zum Erhöhen des Timeouts für einen _Test_finden Sie in der Framework-Dokumentation.

Type: `Number`<br /> Default: `3000`

### waitforInterval

Standardintervall für alle `waitFor*` Befehle, um zu prüfen, ob ein erwarteter Zustand (z. B. Element Sichtbarkeit) geändert wurde.

Type: `Number`<br /> Default: `500`

### region

If running on Sauce Labs, you can choose to run tests between different data centers: US or EU. Um Ihre Region in EU zu ändern, fügen Sie `region: 'eu'` zu Ihrer Konfiguration hinzu.

__Hinweis:__ Dies hat nur Auswirkungen, wenn Sie `user` und `key`, die mit Ihrem Sauce Labs-Konto verbunden sind, in Ihren Options bereitstellen.

Type: `String`<br /> Default: `us`

*(nur für VM und oder Emu/Simu-latoren)*

---

## Testrunner Options

Die folgenden Optionen (einschließlich der oben aufgeführten) sind nur für die Ausführung von WebdriverIO mit dem WDIO-Testrunner definiert:

### specs

Definieren Sie Test Dateien für die Testausführung. Sie können entweder ein Glob-Muster angeben, um mehrere Dateien gleichzeitig zu finden, oder ein Glob und eine Reihe von Pfaden in einem Array einschließen, um sie in einem einzelnen Worker-Prozessen auszuführen. All paths are seen as relative from the config file path.

Type: `(String | String[])[]`<br /> Default: `[]`

### exclude

Schließen Sie Dateien von der Testausführung aus. Alle Pfade werden relativ zum Pfad der Konfigurationsdatei gesehen.

Type: `String[]`<br /> Default: `[]`

### suites

Ein Objekt, das verschiedene Suiten beschreibt, die Sie dann mit der Option `--suite` auf der Befehlszeilenschnittstelle `wdio` angeben können.

Type: `Object`<br /> Default: `{}`

### capabilities

Ähnlich wie im oberen Abschnitt beschriebene `capabilities` Option, außer das mit dieser Option, entweder ein [`Multiremote`](multiremote) Objekt oder mehrere Test Sessions in einem Array zur parallelen Ausführung angegeben werden können.

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

`browser`, `$` und `$$`) in die globale Umgebung eingefügt. Wenn Sie die Option allerdings auf `false` setzen, sollten Sie diese aus dem `@wdio/globals` Paket importieren, z.B.:

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

Whether or not retried spec files should be retried immediately or deferred to the end of the queue.

Type: `Boolean`<br /> Default: `true`

### services

WebdriverIO Services übernehmen eine bestimmte Aufgabe, um die Sie sich nicht kümmern möchten. Sie erweitern Ihren Testaufbau nahezu ohne Aufwand.

Type: `String[]|Object[]`<br /> Default: `[]`

### framework

Definiert das vom WDIO-Testrunner zu verwendende Testframework.

Type: `String`<br /> Default: `mocha`<br /> Options: `mocha` | `jasmine` | `cucumber`

### mochaOpts, jasmineOpts and cucumberOpts


Spezifische Framework-bezogene Optionen. Informationen zu den verfügbaren Optionen finden Sie in der Dokumentation zum Framework-Adapter. Lesen Sie mehr dazu in [Frameworks](frameworks).

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

Legt fest, in welchem Intervall der Reporter prüfen soll, ob er synchronisiert ist, wenn er seine Logs asynchron verarbeitet werden (z. B.

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
- `execArgv` (`string[]`): Liste von String-Argumenten, die an den Arbeitsprozess übergeben werden

### onWorkerEnd

Wird unmittelbar nach dem Beenden eines Worker-Prozesses ausgeführt.

Parameter:

- `cid` (`string`): Capability-ID (z. B. 0-0)
- `exitCode` (`Zahl`): 0 – Erfolg, 1 – Fehler
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt werden sollen
- `retries` (`Nummer`): Anzahl der verwendeten Wiederholungen

### beforeSession

Wird unmittelbar vor der Initialisierung der Webdriver-Sitzung und des Testframeworks ausgeführt. Es ermöglicht Ihnen, Konfigurationen je nach Capability oder Test zu manipulieren.

Parameter:

- `config` (`object`): WebdriverIO-Konfigurationsobjekt
- `caps` (`Objekt`): Enthält die Capability für die Sitzung benutzt wird
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt werden sollen

### before

Wird ausgeführt, bevor die Testausführung beginnt. An dieser Stelle können Sie auf alle globalen Variablen wie `browser`zugreifen. Es ist der perfekte Ort, um benutzerdefinierte Befehle zu definieren.

Parameter:

- `caps` (`Objekt`): Enthält die Capability, die für die Sitzung benutzt wird
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt werden sollen
- `browser` (`Objekt`): Instanz der erstellten Browser-/Gerätesitzung

### beforeSuite

Hook that gets executed before the suite starts (in Mocha/Jasmine only)

Parameter:

- `suite` (`Objekt`): Suite-Details

### beforeHook

Hook, die ausgeführt wird, *bevor* eine Hook innerhalb der Suite beginnt (z. B. läuft vor dem Aufruf von beforeEach in Mocha)

Parameter:

- `test` (`Objekt`): Testdetails
- `context` (`Objekt`): Testkontext (repräsentiert World-Objekt in Cucumber)

### afterHook

Hook, die ausgeführt wird, *nachdem* ein Hook innerhalb der Suite endet (z. B.: läuft nach dem Aufruf von afterEach in Mocha)

Parameter:

- `test` (`Objekt`): Testdetails
- `context` (`Objekt`): Testkontext (repräsentiert World-Objekt in Cucumber)
- `result` (`Objekt`): Hook-Ergebnis (enthält `error`, `result`, `duration`, `passed`, `retries` Eigenschaften)

### beforeTest

Funktion, die vor einem Test ausgeführt werden soll (nur in Mocha/Jasmine).

Parameter:

- `test` (`Objekt`): Testdetails
- `context` (`Objekt`): Scope-Objekt, mit dem der Test ausgeführt wurde

### beforeCommand

Wird ausgeführt, bevor ein WebdriverIO-Befehl ausgeführt wird.

Parameter:

- `commandName` (`string`): Befehlsname
- `args` (`*`): Argumente, die der Befehl erhalten würde

### afterCommand

Wird ausgeführt, nachdem ein WebdriverIO-Befehl ausgeführt wurde.

Parameter:

- `commandName` (`string`): Befehlsname
- `args` (`*`): Argumente, die der Befehl erhalten würde
- `result` (`Zahl`): 0 - wenn Befehl erfolgreich wurde, 1 - beim Fehler
- `error` (`Fehler`): Fehlerobjekt, falls vorhanden

### afterTest

Funktion, die nach dem Ende eines Tests (in Mocha/Jasmine) ausgeführt werden soll.

Parameter:

- `test` (`Objekt`): Testdetails
- `context` (`Objekt`): Scope-Objekt, mit dem der Test ausgeführt wurde
- `result.error` (`Error`): Fehlerobjekt falls der Test fehlschlägt, ansonsten `undefiniert`
- `result.result` (`Any`): Ergebniss der Testfunktion
- `result.duration` (`Ziffer`): Testdauer
- `result.passed` (`Boolean`): wahr, wenn der Test bestanden wurde, andernfalls falsch
- `result.retries` (`Object`): information about spec related retries, e.g. `{ attempts: 0, limit: 0 }`
- `result` (`Objekt`): Hook-Ergebnis (enthält `error`, `result`, `duration`, `passed`, `retries` Eigenschaften)

### afterSuite

Hook that gets executed after the suite has ended (in Mocha/Jasmine only)

Parameter:

- `suite` (`Objekt`): Suite-Details

### after

Wird ausgeführt, nachdem alle Tests abgeschlossen sind. Sie haben weiterhin Zugriff auf alle globalen Variablen aus dem Test.

Parameter:

- `exitCode` (`Zahl`): 0 – Erfolg, 1 – Fehler
- `caps` (`Objekt`): Enthält die Capability, die für die Sitzung benutzt wurde
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt wurden

### afterSession

Wird direkt nach dem Beenden der Webdriver-Sitzung ausgeführt.

Parameter:

- `config` (`object`): WebdriverIO-Konfigurationsobjekt
- `caps` (`Objekt`): Enthält die Capability, die für die Sitzung benutzt wurde
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt wurden

### onComplete

Wird ausgeführt, nachdem alle Worker heruntergefahren wurden und der Testrunner Prozess dabei ist geschlossen zu werden. Ein Fehler, der in den onComplete-Hook geworfen wird, führt dazu, dass der Testlauf fehlschlägt.

Parameter:

- `exitCode` (`Zahl`): 0 – Erfolg, 1 – Fehler
- `config` (`object`): WebdriverIO-Konfigurationsobjekt
- `caps` (`Objekt`): Enthält Capabilities für Sitzungen, die im Worker Prozess genutzt wurden
- `Ergebnis` (`Objekt`): Ergebnisobjekt, das Testergebnisse enthält

### onReload

Wird ausgeführt, wenn eine Session-Aktualisierung erfolgt.

Parameter:

- `oldSessionId` (`string`): Sitzungs-ID der alten Sitzung
- `newSessionId` (`string`): Sitzungs-ID der neuen Sitzung

### beforeFeature

Läuft vor einem Cucumber-Feature.

Parameter:

- `uri` (`string`): Pfad zur Feature-Datei
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber-Feature-Objekt

### afterFeature

Läuft nach einem Cucumber-Feature.

Parameter:

- `uri` (`string`): Pfad zur Feature-Datei
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber-Feature-Objekt

### beforeScenario

Läuft vor einem Cucumber-Szenario.

Parameter:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): Weltobjekt, das Informationen zu Pickle und Testschritt enthält
- `context` (`Objekt`): Cucumber World-Objekt

### afterScenario

Läuft nach einem Cucumber-Szenario.

Parameter:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): Weltobjekt, das Informationen zu Pickle und Testschritt enthält
- `result` (`Objekt`): Ergebnisobjekt, das das Szenarioergebnisse enthält
- `result.passed` (`boolean`): wahr, wenn der Test bestanden wurde, andernfalls falsch
- `result.error` (`string`): Fehler, wenn Szenario fehlgeschlagen ist
- `result.duration` (`ziffer`): Testdauer
- `context` (`Objekt`): Cucumber World-Objekt

### beforeStep

Läuft vor einem Cucumber-Schritt.

Parameter:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber Objekt
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber-Szenario Objekt
- `context` (`Objekt`): Cucumber World-Objekt

### afterStep

Läuft nach einem Cucumber Schritt.

Parameter:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber Objekt
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber-Szenario Objekt
- `result` (`Objekt`): Ergebnisobjekt, das das Szenarioergebnisse enthält
- `result.passed` (`boolean`): wahr, wenn der Test bestanden wurde, andernfalls falsch
- `result.error` (`string`): Fehler, wenn Szenario fehlgeschlagen ist
- `result.duration` (`ziffer`): Testdauer
- `context` (`Objekt`): Cucumber World-Objekt
