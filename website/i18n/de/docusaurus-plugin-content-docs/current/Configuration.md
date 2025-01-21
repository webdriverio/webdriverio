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

Type: `String`<br /> Default: `0.0.0.0`

### port

Port für den Browser Treiber.

Type: `Number`<br /> Default: `undefined`

### path

Pfad zum Browser Treiber Endpunkt.

Type: `String`<br /> Default: `/`

### queryParams

Queryparameter, die an den Browser Treiber weitergegeben werden.

Type: `Object`<br /> Default: `undefined`

### user

Ihr Cloud-Service-Benutzername (funktioniert nur für [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com) oder [LambdaTest](https://www.lambdatest.com) Konten). Wenn festgelegt, stellt WebdriverIO automatisch Verbindungsoptionen für Sie ein. Wenn Sie keinen Cloud-Anbieter verwenden, kann dies verwendet werden, um jedes andere WebDriver-Backend zu authentifizieren.

Type: `String`<br /> Default: `undefined`

### key

Ihr Cloud-Service-Benutzername (funktioniert nur für [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com) oder [LambdaTest](https://www.lambdatest.com) Konten). Wenn festgelegt, stellt WebdriverIO automatisch Verbindungsoptionen für Sie ein. Wenn Sie keinen Cloud-Anbieter verwenden, kann dies verwendet werden, um jedes andere WebDriver-Backend zu authentifizieren.

Type: `String`<br /> Default: `undefined`

### capabilities

Definiert die Capabilities, die Sie in Ihrer WebDriver-Sitzung ausführen möchten. Sehen Sie sich das [WebDriver-Protokoll](https://w3c.github.io/webdriver/#capabilities) für weitere Details an. Wenn Sie einen älteren Treiber ausführen, der das WebDriver-Protokoll nicht unterstützt, müssen Sie die [JSONWireProtocol-Funktionen](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) verwenden, um eine Sitzung erfolgreich auszuführen.

Neben den WebDriver-basierten Funktionen können Sie browser- und Cloud-Vendor-spezifische Optionen anwenden, die eine tiefere Konfiguration für den Remote-Browser oder das Remote-Gerät ermöglichen. Diese sind in den entsprechenden Herstellerunterlagen dokumentiert, z. B.:

- `goog:chromeOptions`: for [Google Chrome](https://chromedriver.chromium.org/capabilities#h.p_ID_106)
- `moz:firefoxOptions`: for [Mozilla Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html)
- `ms:edgeOptions`: for [Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options#using-the-edgeoptions-class)
- `sauce:options`: for [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional)
- `bstack:options`: for [BrowserStack](https://www.browserstack.com/automate/capabilities?tag=selenium-4#)
- `selenoid:options`: for [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)

Ein nützliches Dienstprogramm ist außerdem der Sauce Labs [Automated Test Configurator](https://docs.saucelabs.com/basics/platform-configurator/), der Ihnen hilft, dieses Objekt zu erstellen, indem Sie Ihre gewünschten Capability zusammenklicken.

Type: `Object`<br /> Default: `null`

**Beispiel:**

```js
{
    browserName: 'chrome', // options: `chrome`, `edge`, `firefox`, `safari`
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

Specify custom `headers` to pass into every WebDriver request. If your Selenium Grid requires Basic Authentification we recommend to pass in an `Authorization` header through this option to authenticate your WebDriver requests, e.g.:

```ts wdio.conf.ts
import { Buffer } from 'buffer';
// Read the username and password from environment variables
const username = process.env.SELENIUM_GRID_USERNAME;
const password = process.env.SELENIUM_GRID_PASSWORD;

// Combine the username and password with a colon separator
const credentials = `${username}:${password}`;
// Encode the credentials using Base64
const encodedCredentials = Buffer.from(credentials).toString('base64');

export const config: WebdriverIO.Config = {
    // ...
    headers: {
        Authorization: `Basic ${encodedCredentials}`
    }
    // ...
}
```

Type: `Object`<br /> Default: `{}`

### transformRequest

Function intercepting [HTTP request options](https://github.com/sindresorhus/got#options) before a WebDriver request is made

Type: `(RequestOptions) => RequestOptions`<br /> Default: *none*

### transformResponse

Function intercepting HTTP response objects after a WebDriver response has arrived. The function is passed the original response object as the first and the corresponding `RequestOptions` as the second argument.

Type: `(Response, RequestOptions) => Response`<br /> Default: *none*

### strictSSL

Whether it does not require SSL certificate to be valid. It can be set via an environment variables as `STRICT_SSL` or `strict_ssl`.

Type: `Boolean`<br /> Default: `true`

### enableDirectConnect

Whether enable [Appium direct connection feature](https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments). It does nothing if the response did not have proper keys while the flag is enabled.

Type: `Boolean`<br /> Default: `true`

### cacheDir

The path to the root of the cache directory. This directory is used to store all drivers that are downloaded when attempting to start a session.

Type: `String`<br /> Default: `process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()`

---

## WebdriverIO

The following options (including the ones listed above) can be used with WebdriverIO in standalone:

### automationProtocol

:::warning Deprecation

WebdriverIO is deprecating the use of Chrome Devtools as automation protocol through a WebDriver like interface. Instead, you should use [`webdriver`](https://www.npmjs.com/package/webdriver) .

:::

Define the protocol you want to use for your browser automation. Currently only [`webdriver`](https://www.npmjs.com/package/webdriver) and [`devtools`](https://www.npmjs.com/package/devtools) are supported, as these are the main browser automation technologies available.

If you want to automate the browser using `devtools`, make sure you have the NPM package installed (`$ npm install --save-dev devtools`).

Type: `String`<br /> Default: `webdriver`

### baseUrl

Shorten `url` command calls by setting a base URL.
- Wenn Ihr Parameter `url` mit `/`beginnt, wird `baseUrl` vorangestellt (mit Ausnahme des Pfads `baseUrl`, falls vorhanden).
- Wenn Ihr Parameter `url` ohne Schema oder `/` (wie `some/path`) beginnt, wird die vollständige `baseUrl` direkt vorangestellt.

Type: `String`<br /> Default: `null`

### waitforTimeout

Default timeout for all `waitFor*` commands. (Note the lowercase `f` in the option name.) This timeout __only__ affects commands starting with `waitFor*` and their default wait time.

To increase the timeout for a _test_, please see the framework docs.

Type: `Number`<br /> Default: `5000`

### waitforInterval

Default interval for all `waitFor*` commands to check if an expected state (e.g., visibility) has been changed.

Type: `Number`<br /> Default: `100`

### region

If running on Sauce Labs, you can choose to run tests between different data centers: US or EU. To change your region to EU, add `region: 'eu'` to your config.

__Note:__ This only has an effect if you provide `user` and `key` options that are connected to your Sauce Labs account.

Type: `String`<br /> Default: `us`

*(only for vm and or em/simulators)*

---

## Testrunner Options

The following options (including the ones listed above) are defined only for running WebdriverIO with the WDIO testrunner:

### specs

Define specs for test execution. You can either specify a glob pattern to match multiple files at once or wrap a glob or set of paths into an array to run them within a single worker process. All paths are seen as relative from the config file path.

Type: `(String | String[])[]`<br /> Default: `[]`

### exclude

Exclude specs from test execution. All paths are seen as relative from the config file path.

Type: `String[]`<br /> Default: `[]`

### suites

An object describing various of suites, which you can then specify with the `--suite` option on the `wdio` CLI.

Type: `Object`<br /> Default: `{}`

### capabilities

The same as the `capabilities` section described above, except with the option to specify either a [`multiremote`](/docs/multiremote) object, or multiple WebDriver sessions in an array for parallel execution.

You can apply the same vendor and browser specific capabilities as defined [above](/docs/configuration#capabilities).

Type: `Object`|`Object[]`<br /> Default: `[{ 'wdio:maxInstances': 5, browserName: 'firefox' }]`

### maxInstances

Maximum number of total parallel running workers.

__Note:__ that it may be a number as high as `100`, when the tests are being performed on some external vendors such as Sauce Labs's machines. There, the tests are not tested on a single machine, but rather, on multiple VMs. If the tests are to be run on a local development machine, use a number that is more reasonable, such as `3`, `4`, or `5`. Essentially, this is the number of browsers that will be concurrently started and running your tests at the same time, so it depends on how much RAM there is on your machine, and how many other apps are running on your machine.

You can also apply `maxInstances` within your capability objects using the `wdio:maxInstances` capability. This will limit the amount of parallel sessions for that particular capability.

Type: `Number`<br /> Default: `100`

### maxInstancesPerCapability

Maximum number of total parallel running workers per capability.

Type: `Number`<br /> Default: `100`

### injectGlobals

Inserts WebdriverIO's globals (e.g. `browser`, `$` and `$$`) into the global environment. If you set to `false`, you should import from `@wdio/globals`, e.g.:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

Note: WebdriverIO doesn't handle injection of test framework specific globals.

Type: `Boolean`<br /> Default: `true`

### bail

If you want your test run to stop after a specific number of test failures, use `bail`. (It defaults to `0`, which runs all tests no matter what.) **Note:** A test in this context are all tests within a single spec file (when using Mocha or Jasmine) or all steps within a feature file (when using Cucumber). If you want to control the bail behavior within tests of a single test file, take a look at the available [framework](frameworks) options.

Type: `Number`<br /> Default: `0` (don't bail; run all tests)

### specFileRetries

The number of times to retry an entire specfile when it fails as a whole.

Type: `Number`<br /> Default: `0`

### specFileRetriesDelay

Delay in seconds between the spec file retry attempts

Type: `Number`<br /> Default: `0`

### specFileRetriesDeferred

Whether or not retried spec files should be retried immediately or deferred to the end of the queue.

Type: `Boolean`<br />
Default: `true`

### groupLogsByTestSpec

Choose the log output view.

If set to `false` logs from different test files will be printed in real-time. Please note that this may result in the mixing of log outputs from different files when running in parallel.

If set to `true` log outputs will be grouped by Test Spec and printed only when the Test Spec is completed.

By default, it is set to `false` so logs are printed in real-time.

Type: `Boolean`<br />
Default: `false`

### groupLogsByTestSpec

Choose the log output view.

If set to `false` logs from different test files will be printed in real-time. Please note that this may result in the mixing of log outputs from different files when running in parallel.

If set to `true` log outputs will be grouped by Test Spec and printed only when the Test Spec is completed.

By default, it is set to `false` so logs are printed in real-time.

Type: `Boolean`<br /> Default: `false`

### services

Services take over a specific job you don't want to take care of. They enhance your test setup with almost no effort.

Type: `String[]|Object[]`<br /> Default: `[]`

### framework

Defines the test framework to be used by the WDIO testrunner.

Type: `String`<br /> Default: `mocha`<br /> Options: `mocha` | `jasmine`

### mochaOpts, jasmineOpts and cucumberOpts

Specific framework-related options. See the framework adapter documentation on which options are available. Read more on this in [Frameworks](frameworks).

Type: `Object`<br /> Default: `{ timeout: 10000 }`

### cucumberFeaturesWithLineNumbers

List of cucumber features with line numbers (when [using cucumber framework](./Frameworks.md#using-cucumber)).

Type: `String[]` Default: `[]`

### reporters

List of reporters to use. A reporter can be either a string, or an array of `['reporterName', { /* reporter options */}]` where the first element is a string with the reporter name and the second element an object with reporter options.

Type: `String[]|Object[]`<br /> Default: `[]`

Example:

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

Determines in which interval the reporter should check if they are synchronized if they report their logs asynchronously (e.g. if logs are streamed to a 3rd party vendor).

Type: `Number`<br /> Default: `100` (ms)

### reporterSyncTimeout

Determines the maximum time reporters have to finish uploading all their logs until an error is being thrown by the testrunner.

Type: `Number`<br /> Default: `5000` (ms)

### execArgv

Node arguments to specify when launching child processes.

Type: `String[]`<br /> Default: `null`

### filesToWatch

A list of glob supporting string patterns that tell the testrunner to have it additionally watch other files, e.g. application files, when running it with the `--watch` flag. By default the testrunner already watches all spec files.

Type: `String[]`<br /> Default: `[]`

### updateSnapshots

Set to true if you want to update your snapshots. Ideally used as part of a CLI parameter, e.g. `wdio run wdio.conf.js --s`.

Type: `'new' | 'all' | 'none'`<br /> Default: `none` if not provided and tests run in CI, `new` if not provided, otherwise what's been provided

### resolveSnapshotPath

Overrides default snapshot path. For example, to store snapshots next to test files.

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    resolveSnapshotPath: (testPath, snapExtension) => testPath + snapExtension,
}
```

Type: `(testPath: string, snapExtension: string) => string`<br /> Default: stores snapshot files in `__snapshots__` directory next to test file

### tsConfigPath

WDIO uses `tsx` to compile TypeScript files.  Your TSConfig is automatically detected from the current working directory but you can specify a custom path here or by setting the TSX_TSCONFIG_PATH environment variable.

See the `tsx` docs: https://tsx.is/dev-api/node-cli#custom-tsconfig-json-path

Type: `String`<br /> Default: `null`<br />

## Hooks

The WDIO testrunner allows you to set hooks to be triggered at specific times of the test lifecycle. This allows custom actions (e.g. take screenshot if a test fails).

Every hook has as parameter specific information about the lifecycle (e.g. information about the test suite or test). Read more about all hook properties in [our example config](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L183-L326).

**Note:** Some hooks (`onPrepare`, `onWorkerStart`, `onWorkerEnd` and `onComplete`) are executed in a different process and therefore can not share any global data with the other hooks that live in the worker process.

### onPrepare

Gets executed once before all workers get launched.

Parameters:

- `config` (`object`): WebdriverIO-Konfigurationsobjekt
- `param` (`object[]`): Liste der Capabilities

### onWorkerStart

Gets executed before a worker process is spawned and can be used to initialize specific service for that worker as well as modify runtime environments in an async fashion.

Parameters:

- `cid` (`string`): Capability-ID (z. B. 0-0)
- `caps` (`Objekt`): Enthält Capabilities für Sitzungen, die im Worker Prozess erstellt werden
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt werden sollen
- `args` (`object`): Objekt, das mit der Hauptkonfiguration zusammengeführt wird, sobald der Worker initialisiert ist
- `execArgv` (`string[]`): Liste von String-Argumenten, die an den Arbeitsprozess übergeben werden

### onWorkerEnd

Gets executed just after a worker process has exited.

Parameters:

- `cid` (`string`): Capability-ID (z. B. 0-0)
- `exitCode` (`Zahl`): 0 – Erfolg, 1 – Fehler
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt werden sollen
- `retries` (`number`): number of spec level retries used as defined in [_"Add retries on a per-specfile basis"_](./Retry.md#add-retries-on-a-per-specfile-basis)

### beforeSession

Gets executed just before initializing the webdriver session and test framework. It allows you to manipulate configurations depending on the capability or spec.

Parameters:

- `config` (`object`): WebdriverIO-Konfigurationsobjekt
- `caps` (`Objekt`): Enthält die Capability für die Sitzung benutzt wird
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt werden sollen

### before

Gets executed before test execution begins. At this point you can access to all global variables like `browser`. It is the perfect place to define custom commands.

Parameters:

- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process
- `browser` (`Objekt`): Instanz der erstellten Browser-/Gerätesitzung

### beforeSuite

Hook that gets executed before the suite starts (in Mocha/Jasmine only)

Parameters:

- `suite` (`Objekt`): Suite-Details

### beforeHook

Hook that gets executed *before* a hook within the suite starts (e.g. runs before calling beforeEach in Mocha)

Parameters:

- `test` (`Objekt`): Testdetails
- `context` (`Objekt`): Testkontext (repräsentiert World-Objekt in Cucumber)

### afterHook

Hook that gets executed *after* a hook within the suite ends (e.g. runs after calling afterEach in Mocha)

Parameters:

- `test` (`Objekt`): Testdetails
- `context` (`Objekt`): Testkontext (repräsentiert World-Objekt in Cucumber)
- `result` (`Objekt`): Hook-Ergebnis (enthält `error`, `result`, `duration`, `passed`, `retries` Eigenschaften)

### beforeTest

Function to be executed before a test (in Mocha/Jasmine only).

Parameters:

- `test` (`object`): test details
- `context` (`Objekt`): Scope-Objekt, mit dem der Test ausgeführt wurde

### beforeCommand

Runs before a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): Befehlsname
- `args` (`*`): Argumente, die der Befehl erhalten würde

### afterCommand

Runs after a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): Befehlsname
- `args` (`*`): Argumente, die der Befehl erhalten würde
- `result` (`Zahl`): 0 - wenn Befehl erfolgreich wurde, 1 - beim Fehler
- `error` (`Fehler`): Fehlerobjekt, falls vorhanden

### afterTest

Function to be executed after a test (in Mocha/Jasmine) ends.

Parameters:

- `test` (`Objekt`): Testdetails
- `context` (`Objekt`): Scope-Objekt, mit dem der Test ausgeführt wurde
- `result.error` (`Error`): Fehlerobjekt falls der Test fehlschlägt, ansonsten `undefiniert`
- `result.result` (`Any`): Ergebniss der Testfunktion
- `result.duration` (`Ziffer`): Testdauer
- `result.passed` (`Boolean`): wahr, wenn der Test bestanden wurde, andernfalls falsch
- `result.retries` (`Object`): information about single test related retries as defined for [Mocha and Jasmine](./Retry.md#rerun-single-tests-in-jasmine-or-mocha) as well as [Cucumber](./Retry.md#rerunning-in-cucumber), e.g. `{ attempts: 0, limit: 0 }`, see
- `result` (`Objekt`): Hook-Ergebnis (enthält `error`, `result`, `duration`, `passed`, `retries` Eigenschaften)

### afterSuite

Hook that gets executed after the suite has ended (in Mocha/Jasmine only)

Parameters:

- `suite` (`Objekt`): Suite-Details

### after

Gets executed after all tests are done. You still have access to all global variables from the test.

Parameters:

- `exitCode` (`Zahl`): 0 – Erfolg, 1 – Fehler
- `caps` (`Objekt`): Enthält die Capability, die für die Sitzung benutzt wurde
- `specs` (`string[]`): Tests, die im Workerprozess ausgeführt wurden

### afterSession

Gets executed right after terminating the webdriver session.

Parameters:

- `config` (`object`): WebdriverIO-Konfigurationsobjekt
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### onComplete

Gets executed after all workers got shut down and the process is about to exit. An error thrown in the onComplete hook will result in the test run failing.

Parameters:

- `exitCode` (`Zahl`): 0 – Erfolg, 1 – Fehler
- `config` (`object`): WebdriverIO-Konfigurationsobjekt
- `caps` (`Objekt`): Enthält Capabilities für Sitzungen, die im Worker Prozess genutzt wurden
- `Ergebnis` (`Objekt`): Ergebnisobjekt, das Testergebnisse enthält

### onReload

Gets executed when a refresh happens.

Parameters:

- `oldSessionId` (`string`): Sitzungs-ID der alten Sitzung
- `newSessionId` (`string`): Sitzungs-ID der neuen Sitzung

### beforeFeature

Runs before a Cucumber Feature.

Parameters:

- `uri` (`string`): Pfad zur Feature-Datei
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber-Feature-Objekt

### afterFeature

Runs after a Cucumber Feature.

Parameters:

- `uri` (`string`): Pfad zur Feature-Datei
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber-Feature-Objekt

### beforeScenario

Runs before a Cucumber Scenario.

Parameters:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): Weltobjekt, das Informationen zu Pickle und Testschritt enthält
- `context` (`Objekt`): Cucumber World-Objekt

### afterScenario

Runs after a Cucumber Scenario.

Parameters:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): Weltobjekt, das Informationen zu Pickle und Testschritt enthält
- `result` (`Objekt`): Ergebnisobjekt, das das Szenarioergebnisse enthält
- `result.passed` (`boolean`): wahr, wenn der Test bestanden wurde, andernfalls falsch
- `result.error` (`string`): Fehler, wenn Szenario fehlgeschlagen ist
- `result.duration` (`ziffer`): Testdauer
- `context` (`Objekt`): Cucumber World-Objekt

### beforeStep

Runs before a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber Objekt
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber-Szenario Objekt
- `context` (`object`): Cucumber World object

### afterStep

Runs after a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber step object
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber scenario object
- `result` (`Objekt`): Ergebnisobjekt, das das Szenarioergebnisse enthält
- `result.passed` (`boolean`): wahr, wenn der Test bestanden wurde, andernfalls falsch
- `result.error` (`string`): Fehler, wenn Szenario fehlgeschlagen ist
- `result.duration` (`ziffer`): Testdauer
- `context` (`Objekt`): Cucumber World-Objekt

### beforeAssertion

Hook that gets executed before a WebdriverIO assertion happens.

Parameters:

- `params`: assertion information
- `params.matcherName` (`string`): name of the matcher (e.g. `toHaveTitle`)
- `params.expectedValue`: value that is passed into the matcher
- `params.options`: assertion options

### afterAssertion

Hook that gets executed after a WebdriverIO assertion happened.

Parameters:

- `params`: assertion information
- `params.matcherName` (`string`): name of the matcher (e.g. `toHaveTitle`)
- `params.expectedValue`: value that is passed into the matcher
- `params.options`: assertion options
- `params.result`: assertion results
