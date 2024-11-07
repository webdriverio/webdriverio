---
id: configuration
title: Configuración
---

Based on the [setup type](/docs/setuptypes) (e.g. using the raw protocol bindings, WebdriverIO as standalone package or the WDIO testrunner) there is a different set of options available to control the environment.

## Opciones de WebDriver

Las siguientes opciones se definen al utilizar el paquete de protocolo [`webdriver`](https://www.npmjs.com/package/webdriver):

### Protocolo

Protocolo a usar para comunicarse con el servidor de controladores.

Tipo: `String`<br /> Predeterminado: `localhost`

### nombre del host

Anfitrión de su servidor de controladores.

Type: `String`<br /> Default: `0.0.0.0`

### port

Puerto en el que está el servidor del conductor.

Type: `Number`<br /> Default: `undefined`

### path

Ruta al punto final del servidor del controlador.

Type: `String`<br /> Default: `/`

### queryParams

Parámetros de consulta que se propagan al servidor de controladores.

Type: `Object`<br /> Default: `undefined`

### user

Su nombre de usuario de servicio en la nube (solo funciona para [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com) o [cuentas LambdaTest](https://www.lambdatest.com)). Si se establece, WebdriverIO automáticamente establecerá las opciones de conexión para usted. Si no utiliza un proveedor de nube esto se puede utilizar para autenticar cualquier otro backend de WebDriver.

Type: `String`<br /> Default: `undefined`

### key

Su nombre de usuario de servicio en la nube (solo funciona para [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com) o [cuentas LambdaTest](https://www.lambdatest.com)). Si se establece, WebdriverIO automáticamente establecerá las opciones de conexión para usted. Si no utiliza un proveedor de nube esto se puede utilizar para autenticar cualquier otro backend de WebDriver.

Type: `String`<br /> Default: `undefined`

### capabilities

Define las capacidades que desea ejecutar en su sesión de WebDriver. Consulte el Protocolo [WebDriver](https://w3c.github.io/webdriver/#capabilities) para obtener más detalles. Si ejecuta un controlador anterior que no soporta el protocolo WebDriver necesitarás usar las [capacidades JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) para ejecutar correctamente una sesión.

Al lado de las capacidades basadas en WebDriver usted puede aplicar opciones específicas del navegador y del proveedor que permiten una configuración más profunda al navegador o dispositivo remoto. Estos están documentados en los documentos de proveedor correspondientes, por ejemplo.:

- `goog:chromeOptions`: para [Google Chrome](https://chromedriver.chromium.org/capabilities#h.p_ID_106)
- `moz:firefoxOptions`: for [Mozilla Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html)
- `ms:edgeOptions`: for [Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options#using-the-edgeoptions-class)
- `sauce:options`: for [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional)
- `bstack:options`: for [BrowserStack](https://www.browserstack.com/automate/capabilities?tag=selenium-4#)
- `selenoid:options`: for [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)

Adicionalmente, una utilidad útil es el [Configurador Automatizado de Pruebas](https://docs.saucelabs.com/basics/platform-configurator/)de Sauce Labs, que le ayuda a crear este objeto haciendo clic juntos en las capacidades deseadas.

Type: `Object`<br /> Default: `null`

**Ejemplo:**

```js
{
    browserName: 'chrome', // options: `chrome`, `edge`, `firefox`, `safari`
    browserVersion: '27.0', // browser version
    platformName: 'Windows 10' // OS platform
}
```

Si está ejecutando pruebas web o nativas en dispositivos móviles, `capacidades` difieren del protocolo WebDriver. See the [Appium Docs](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/) for more details.

### logLevel

Nivel de detalle de registro.

Type: `String`<br /> Default: `info`<br /> Options: `trace` | `debug` | `info` | `warn` | `error` | `silent`

### outputDir

Directorio para almacenar todos los archivos de registro de testrunner (incluyendo los registros de los reporteros y `wdio` registros). Si no se establece, todos los registros se transfieren a `stdout`. Puesto que la mayoría de los reporteros están hechos para iniciar sesión en `stdout`, se recomienda usar esta opción sólo para reporteros específicos donde tiene más sentido enviar un informe a un archivo (como el reportero `junit`, por ejemplo).

Cuando se ejecuta en modo independiente, el único registro generado por WebdriverIO será el registro de `wdio`.

Type: `String`<br /> Default: `null`

### connectionRetryTimeout

Tiempo de espera para cualquier solicitud de WebDriver a un controlador o grid.

Type: `Number`<br /> Default: `120000`

### connectionRetryCount

Número máximo de intentos de solicitud al servidor Selenium.

Type: `Number`<br /> Default: `3`

### agent

Le permite usar un`http`/`https`/`http2` [agente](https://www.npmjs.com/package/got#agent) personalizado para realizar solicitudes.

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

If you want to automate the browser using a different automation technology, make you set this property to a path that resolves to a module that adheres to the following interface:

```ts
import type { Capabilities } from '@wdio/types';
import type { Client, AttachOptions } from 'webdriver';

export default class YourAutomationLibrary {
    /**
     * Start a automation session and return a WebdriverIO [monad](https://github.com/webdriverio/webdriverio/blob/940cd30939864bdbdacb2e94ee6e8ada9b1cc74c/packages/wdio-utils/src/monad.ts)
     * with respective automation commands. See the [webdriver](https://www.npmjs.com/package/webdriver) package
     * as a reference implementation
     *
     * @param {Capabilities.RemoteConfig} options WebdriverIO options
     * @param {Function} hook that allows to modify the client before it gets released from the function
     * @param {PropertyDescriptorMap} userPrototype allows user to add custom protocol commands
     * @param {Function} customCommandWrapper allows to modify the command execution
     * @returns a WebdriverIO compatible client instance
     */
    static newSession(
        options: Capabilities.RemoteConfig,
        modifier?: (...args: any[]) => any,
        userPrototype?: PropertyDescriptorMap,
        customCommandWrapper?: (...args: any[]) => any
    ): Promise<Client>;

    /**
     * allows user to attach to existing sessions
     * @optional
     */
    static attachToSession(
        options?: AttachOptions,
        modifier?: (...args: any[]) => any, userPrototype?: {},
        commandWrapper?: (...args: any[]) => any
    ): Client;

    /**
     * Changes The instance session id and browser capabilities for the new session
     * directly into the passed in browser object
     *
     * @optional
     * @param   {object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
     */
    static reloadSession(
        instance: Client,
        newCapabilities?: WebdriverIO.Capabilitie
    ): Promise<string>;
}
```

Type: `String`<br />
Default: `webdriver`

### baseUrl

Shorten `url` command calls by setting a base URL.
- Si tu parámetro `url` comienza con `/`, entonces `baseUrl` está precedida (excepto la ruta `baseUrl`, si tiene una).
- Si el parámetro `url` comienza sin un esquema o `/` (como `some/path`), entonces el `baseUrl` completo se añade directamente.

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

The same as the `capabilities` section described above, except with the option to specify either a [`multiremote`](multiremote) object, or multiple WebDriver sessions in an array for parallel execution.

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

- `config` (`objeto`): objeto de configuración WebdriverIO
- `param` (`object[]`): lista de detalles de capacidades

### onWorkerStart

Gets executed before a worker process is spawned and can be used to initialize specific service for that worker as well as modify runtime environments in an async fashion.

Parameters:

- `cid` (`string`): id de capacidad (por ejemplo, 0-0)
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo
- `argumentos` (`objeto`): objeto que se fusionará con la configuración principal una vez que se inicialice el trabajador
- `execArgv` (`string[]`): lista de argumentos de cadena pasados al proceso de trabajo

### onWorkerEnd

Gets executed just after a worker process has exited.

Parameters:

- `cid` (`string`): id de capacidad (por ejemplo, 0-0)
- `exitCode` (`número`): 0 - éxito, 1 - error
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo
- `retries` (`number`): number of spec level retries used as defined in [_"Add retries on a per-specfile basis"_](./Retry.md#add-retries-on-a-per-specfile-basis)

### beforeSession

Gets executed just before initializing the webdriver session and test framework. It allows you to manipulate configurations depending on the capability or spec.

Parameters:

- `config` (`objeto`): objeto de configuración WebdriverIO
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo

### before

Gets executed before test execution begins. At this point you can access to all global variables like `browser`. It is the perfect place to define custom commands.

Parameters:

- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process
- `browser` (`object`): instancia de la sesión de navegador/dispositivo creada

### beforeSuite

Hook that gets executed before the suite starts (in Mocha/Jasmine only)

Parameters:

- `suite` (`objeto`): detalles de suite

### beforeHook

Hook that gets executed *before* a hook within the suite starts (e.g. runs before calling beforeEach in Mocha)

Parameters:

- `test` (`object`): detalles de prueba
- `contexto` (`objeto`): contexto de prueba (representa el objeto del mundo en cupón)

### afterHook

Hook that gets executed *after* a hook within the suite ends (e.g. runs after calling afterEach in Mocha)

Parameters:

- `test` (`object`): detalles de prueba
- `contexto` (`objeto`): contexto de prueba (representa el objeto del mundo en cupón)
- `resultado` (`objeto`): resultado de gancho (contiene `error`, `resultado`, `duración`, `pasado`, `reintentos` propiedades)

### beforeTest

Function to be executed before a test (in Mocha/Jasmine only).

Parameters:

- `test` (`object`): test details
- `contexto` (`objeto`): objeto de ámbito con el que se ejecutó la prueba

### beforeCommand

Runs before a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): nombre de comando
- `args` (`*`): argumentos que recibiría el comando

### afterCommand

Runs after a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): nombre de comando
- `args` (`*`): argumentos que recibiría el comando
- `resultado` (`número`): 0 - comando exitoso, 1 - error de comando
- `error` (`Error`): objeto de error si existe

### afterTest

Function to be executed after a test (in Mocha/Jasmine) ends.

Parameters:

- `test` (`object`): detalles de prueba
- `contexto` (`objeto`): objeto de ámbito con el que se ejecutó la prueba
- `result.error` (`Error`): objeto de error en caso de que la prueba falle, de lo contrario `indefinido`
- `result.result` (`Any`): devuelve el objeto de la función de prueba
- `resultado.duración` (`Número`): duración de la prueba
- `result.passed` (`Boolean`): verdadero si la prueba ha pasado, de lo contrario, falso
- `result.retries` (`Object`): information about single test related retries as defined for [Mocha and Jasmine](./Retry.md#rerun-single-tests-in-jasmine-or-mocha) as well as [Cucumber](./Retry.md#rerunning-in-cucumber), e.g. `{ attempts: 0, limit: 0 }`, see
- `resultado` (`objeto`): resultado de gancho (contiene `error`, `resultado`, `duración`, `pasado`, `reintentos` propiedades)

### afterSuite

Hook that gets executed after the suite has ended (in Mocha/Jasmine only)

Parameters:

- `suite` (`objeto`): detalles de suite

### after

Gets executed after all tests are done. You still have access to all global variables from the test.

Parameters:

- `exitCode` (`número`): 0 - éxito, 1 - error
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo

### afterSession

Gets executed right after terminating the webdriver session.

Parameters:

- `config` (`objeto`): objeto de configuración WebdriverIO
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### onComplete

Gets executed after all workers got shut down and the process is about to exit. An error thrown in the onComplete hook will result in the test run failing.

Parameters:

- `exitCode` (`número`): 0 - éxito, 1 - error
- `config` (`objeto`): objeto de configuración WebdriverIO
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `resultado` (`objeto`): objeto de resultados que contiene resultados de prueba

### onReload

Gets executed when a refresh happens.

Parameters:

- `oldSessionId` (`string`): ID de sesión de la sesión anterior
- `newSessionId` (`string`): ID de sesión de la nueva sesión

### beforeFeature

Runs before a Cucumber Feature.

Parameters:

- `uri` (`string`): ruta al archivo de características
- `función` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): objeto función pepino

### afterFeature

Runs after a Cucumber Feature.

Parameters:

- `uri` (`string`): ruta al archivo de características
- `función` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): objeto función pepino

### beforeScenario

Runs before a Cucumber Scenario.

Parameters:

- `mundo` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): objeto del mundo que contiene información sobre el ickle y paso de prueba
- `contexto` (`objeto`): objeto Cucumber World

### afterScenario

Runs after a Cucumber Scenario.

Parameters:

- `mundo` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): objeto del mundo que contiene información sobre el ickle y paso de prueba
- `resultado` (`objeto`): objeto de resultados que contiene resultados de prueba
- `result.passed` (`boolean`): verdadero si la prueba ha pasado, de lo contrario, falso
- `result.error` (`string`): pila de errores si el escenario falló
- `result.duration` (`number`): duración del escenario en milisegundos
- `contexto` (`objeto`): objeto Cucumber World

### beforeStep

Runs before a Cucumber Step.

Parameters:

- `paso` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): objeto de paso Cucumber
- `paso` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): objeto de paso Cucumber
- `context` (`object`): Cucumber World object

### afterStep

Runs after a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber step object
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber scenario object
- `resultado` (`objeto`): objeto de resultados que contiene resultados de prueba
- `result.passed` (`boolean`): verdadero si la prueba ha pasado, de lo contrario, falso
- `result.error` (`string`): pila de errores si el escenario falló
- `result.duration` (`number`): duración del escenario en milisegundos
- `contexto` (`objeto`): objeto Cucumber World

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
