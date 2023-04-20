---
id: configuration
title: Configuración
---

Basado en el tipo de configuración [](./SetupTypes.md) (p. ej. usando los enlaces de protocolo crudo, WebdriverIO como paquete independiente o el testrunner WDIo) hay un conjunto diferente de opciones disponibles para controlar el entorno.

## Opciones de WebDriver

Las siguientes opciones se definen al utilizar el paquete de protocolo [`webdriver`](https://www.npmjs.com/package/webdriver):

### Protocolo

Protocolo a usar para comunicarse con el servidor de controladores.

Tipo: `String`<br /> Predeterminado: `localhost`

### nombre del host

Anfitrión de su servidor de controladores.

Tipo: `String`<br /> Predeterminado: `localhost`

### port

Puerto en el que está el servidor del conductor.

Type: `Number`<br /> Default: `100` (ms)

### path

Ruta al punto final del servidor del controlador.

Type: `String`<br /> Default: `/`

### queryParams

Parámetros de consulta que se propagan al servidor de controladores.

Type: `Object`<br /> Default: `null`

### user

Su nombre de usuario de servicio en la nube (solo funciona para [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com), [CrossBrowserTesting](https://crossbrowsertesting.com) o [cuentas LambdaTest](https://www.lambdatest.com)). Si se establece, WebdriverIO automáticamente establecerá las opciones de conexión para usted. Si no utiliza un proveedor de nube esto se puede utilizar para autenticar cualquier otro backend de WebDriver.

Type: `String`<br /> Default: `null`

### key

Su nombre de usuario de servicio en la nube (solo funciona para [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com), [CrossBrowserTesting](https://crossbrowsertesting.com) o [cuentas LambdaTest](https://www.lambdatest.com)). Si se establece, WebdriverIO automáticamente establecerá las opciones de conexión para usted. Si no utiliza un proveedor de nube esto se puede utilizar para autenticar cualquier otro backend de WebDriver.

Type: `String`<br /> Default: `null`

### capabilities

Define las capacidades que desea ejecutar en su sesión de WebDriver. Consulte el Protocolo [WebDriver](https://w3c.github.io/webdriver/#capabilities) para obtener más detalles. Si ejecuta un controlador anterior que no soporta el protocolo WebDriver necesitarás usar las [capacidades JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) para ejecutar correctamente una sesión.

Al lado de las capacidades basadas en WebDriver usted puede aplicar opciones específicas del navegador y del proveedor que permiten una configuración más profunda al navegador o dispositivo remoto. Estos están documentados en los documentos de proveedor correspondientes, por ejemplo.:

- `goog:chromeOptions`: para [Google Chrome](https://chromedriver.chromium.org/capabilities#h.p_ID_106)
- `moz:firefoxOptions`: for [Mozilla Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html)
- `ms:edgeOptions`: for [Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options#using-the-edgeoptions-class)
- `sauce:options`: for [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional)
- `bstack:options`: for [BrowserStack](https://www.browserstack.com/automate/capabilities?tag=selenium-4#)
- `selenoid:options`: for [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)

Adicionalmente, una utilidad útil es el [Configurador Automatizado de Pruebas](https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/)de Sauce Labs, que le ayuda a crear este objeto haciendo clic juntos en las capacidades deseadas.

Type: `Object`<br /> Default: `null`

**Ejemplo:**

```js
{
    browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
    browserVersion: '27.0', // browser version
    platformName: 'Windows 10' // OS platform
}
```

Si está ejecutando pruebas web o nativas en dispositivos móviles, `capacidades` difieren del protocolo WebDriver. Consulte [Appium Docs](http://appium.io/docs/en/writing-running-appium/caps/) para obtener más detalles.

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

Especifique `encabezados personalizados` para pasar a cada solicitud de WebDriver y cuando se conecte al navegador a través de Puppeteer usando el protocolo CDP.

:::caution

Estos encabezados __no__ son pasados a la solicitud del navegador. ¡Si está buscando modificar los encabezados de las solicitudes del navegador, por favor participe en [#6361](https://github.com/webdriverio/webdriverio/issues/6361)!

:::

Type: `Object`<br /> Default: `{}`

### transformRequest

Interceptando funciones [opciones de solicitud HTTP](https://github.com/sindresorhus/got#options) antes de que se haga una solicitud de WebDriver

Type: `(RequestOptions) => RequestOptions`<br /> Default: *none*

### transformResponse

Función interceptando objetos de respuesta HTTP después de que haya llegado una respuesta de WebDriver. La función se pasa el objeto de respuesta original como el primero y la correspondiente `RequestOptions` como segundo argumento.

Type: `(Response, RequestOptions) => Response`<br /> Default: *none*

### strictSSL

Si no requiere que el certificado SSL sea válido. Puede establecerse a través de variables de entorno como `STRICT_SSL` o `strict_ssl`.

Type: `Boolean`<br /> Default: `true`

### enableDirectConnect

Si habilita [la función de conexión directa del Appium](https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments). No hace nada si la respuesta no tiene las teclas apropiadas mientras la bandera está habilitada.

Type: `Boolean`<br /> Default: `true`

---

## WebdriverIO

Las siguientes opciones (incluyendo las mencionadas arriba) se pueden utilizar con WebdriverIO en autónomo:

### automationProtocol

Defina el protocolo que desea utilizar para la automatización de su navegador. Actualmente, solo se admiten [`webdriver`](https://www.npmjs.com/package/webdriver) y [`devtools`](https://www.npmjs.com/package/devtools), ya que estas son las principales tecnologías de automatización de navegadores disponibles.

Si desea automatizar el navegador usando `devtools`, asegúrese de que tiene instalado el paquete NPM (`$ npm install --save-dev devtool`).

Type: `String`<br /> Default: `webdriver`

### baseUrl

Acortar las llamadas de comando de `url` estableciendo una URL base.
- Si tu parámetro `url` comienza con `/`, entonces `baseUrl` está precedida (excepto la ruta `baseUrl`, si tiene una).
- Si el parámetro `url` comienza sin un esquema o `/` (como `some/path`), entonces el `baseUrl` completo se añade directamente.

Type: `String`<br /> Default: `null`

### waitforTimeout

Tiempo de espera predeterminado para todos los comandos `waitFor*`. (Tenga en cuenta la minúscula `f` en el nombre de opción.) Este tiempo de espera __solo__ afecta a los comandos que empiezan con `espera*` y su tiempo de espera predeterminado.

Para aumentar el tiempo de espera de una _prueba_, por favor vea la documentación del framework.

Type: `Number`<br /> Default: `3000`

### waitforInterval

Intervalo predeterminado para todos los comandos `waitFor*` para comprobar si un estado esperado (por ejemplo, visibilidad) ha sido cambiado.

Type: `Number`<br /> Default: `500`

### region

Si se ejecuta en Sauce Labs, puede ejecutar pruebas entre diferentes datacenters: EE. UU. o UE. Para cambiar tu región a la UE, añade `región: 'eu'` a tu configuración.

__Nota:__ Esto solo tiene efecto si proporcionas `usuario` y `opciones de clave` que están conectadas a tu cuenta de Sauce Labs.

Type: `String`<br /> Default: `us`

*(sólo para vm y o em/simuladores)*

---

## Testrunner Options

Las siguientes opciones (incluidas las mencionadas arriba) se definen sólo para ejecutar WebdriverIO con el testrunner WDIO:

### specs

Definir las especificaciones para la ejecución de pruebas. Puede especificar un patrón de glob para que coincida con varios archivos a la vez o envolver un glob o un conjunto de rutas en un array para ejecutarlos dentro de un proceso de un solo worker. Todas las rutas son vistas como relativas desde la ruta del archivo de configuración.

Type: `(String | String[])[]`<br /> Default: `[]`

### exclude

Excluir las especificaciones de la ejecución de pruebas. Todas las rutas son vistas como relativas desde la ruta del archivo de configuración.

Type: `String[]`<br /> Default: `[]`

### suites

Un objeto que describe varias suites, que puede especificar con la opción `--suite` en la CLI `wdio`.

Type: `Object`<br /> Default: `{}`

### capabilities

Lo mismo que la sección `capacidades` descrita anteriormente excepto con la opción para especificar un objeto [`multiremoto`](Multiremote.md), o varias sesiones WebDriver en una matriz para ejecución paralela.

Puede aplicar las mismas capacidades específicas del proveedor y del navegador según lo definido [arriba](/docs/configuration#capabilities).

Type: `Object`|`Object[]`<br /> Default: `[{ maxInstances: 5, browserName: 'firefox' }]`

### maxInstances

Número máximo de trabajadores en ejecución paralela.

__Nota:__ que puede ser un número de hasta `100`, cuando las pruebas se están llevando a cabo en algunos proveedores externos como las máquinas de Sauce Lang. Las pruebas no se prueban en una sola máquina, sino en múltiples máquinas virtuales. Si las pruebas deben ejecutarse en una máquina de desarrollo local, utilice un número más razonable, tales como `3`, `4`o `5`. Esencialmente, este es el número de navegadores que se iniciarán simultáneamente y ejecutarán tus pruebas al mismo tiempo, para que dependa de la cantidad de RAM que hay en su máquina, y de cuántas otras aplicaciones están ejecutándose en su máquina.

Type: `Number`<br /> Default: `100`

### maxInstancesPerCapability

Número máximo de trabajadores en ejecución paralela por capacidad.

Type: `Number`<br /> Default: `100`

### injectGlobals

Inserta los globales de WebdriverIO (por ejemplo, `browser`, `$` y `$$`) en el entorno global. Si se establece a `false`, debería importar de `@wdio/globals`, por ejemplo.:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

Nota: WebdriverIO no maneja la inyección del framework de pruebas globales específicos.

Type: `Boolean`<br /> Default: `true`

### bail

Si quieres que tu ejecución de prueba se detenga después de un número específico de fallos de prueba, usa `bail`. (Por defecto es `0`, que ejecuta todas las pruebas sin importar qué.) **Nota:** Tenga en cuenta que al usar un corredor de pruebas de terceros (como Mocha), podría requerirse una configuración adicional.

Type: `Number`<br /> Default: `0` (don't bail; run all tests)

### specFileRetries

El número de veces para volver a intentar un espectro completo cuando falla en su conjunto.

Type: `Number`<br /> Default: `0`

### specFileRetriesDelay

Retraso en segundos entre los intentos de reintento del archivo específico

Type: `Number`<br /> Default: `0`

### specFileRetriesDeferred

Si los especfiles reintentados o no deben volver a intentarse inmediatamente o posponerse al final de la cola.

Type: `Boolean`<br /> Default: `true`

### services

Los servicios se hacen cargo de un trabajo específico que no desea cuidar. Mejoran su configuración de prueba sin casi ningún esfuerzo.

Type: `String[]|Object[]`<br /> Default: `[]`

### framework

Define el marco de pruebas que utilizará el testrunner WDIO.

Type: `String`<br /> Default: `mocha`<br /> Options: `mocha` | `jasmine`

### mochaOpts, jasmineOpts and cucumberOpts


Opciones específicas relacionadas con el framework. Vea la documentación del adaptador del framework sobre qué opciones están disponibles. Lea más sobre esto en [Frameworks](./Frameworks.md).

Type: `Object`<br /> Default: `{ timeout: 10000 }`

### cucumberFeaturesWithLineNumbers

Lista de características de cucumber con números de línea (cuando [utiliza marco de pepino](./Frameworks.md#using-cucumber)).

Type: `String[]` Default: `[]`

### reporters

Lista de reporteros a utilizar. Un reportero puede ser una cadena o un array de `['reporterName', { /* reportero options */}]` donde el primer elemento es una cadena con el nombre del reportero y el segundo elemento un objeto con opciones de reportero.

Type: `String[]|Object[]`<br /> Default: `[]`

Ejemplo:

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

Determina en qué intervalo el reportero debe comprobar si se sincronizan si reportan sus registros de forma asincrónica (e., si los registros son transmitidos a un proveedor de terceros).

Type: `Number`<br /> Default: `100` (ms)

### reporterSyncTimeout

Determina el tiempo máximo que los periodistas tienen que terminar de cargar todos sus registros hasta que el testrunner lanza un error.

Type: `Number`<br /> Default: `5000` (ms)

### execArgv

Argumentos del nodo a especificar al lanzar procesos.

Type: `String[]`<br /> Default: `null`

### filesToWatch

Una lista de glob que soporta patrones de cadenas que le dicen al testrunner que lo tenga adicionalmente para ver otros archivos.. archivos de aplicación al ejecutarlo con la bandera `--watch`. Por defecto, el testrunner ya observa todos los archivos de especialización.

Type: `String[]`<br /> Default: `[]`

### autoCompileOpts

Opciones de compilador al usar WebdriverIO con TypeScript o Babel.

#### autoCompileOpts.autoCompile

Si se establece en `true` el testrunner WDIO intentará transpirar automáticamente los archivos de especificación.

Type: `Object` Default: `{ transpileOnly: true }`

#### autoCompileOpts.tsNodeOpts

Configura cómo [`ts-node`](https://www.npmjs.com/package/ts-node) se supone que transpile los archivos.

Type: `Object` Default: `{ transpileOnly: true }`

#### autoCompileOpts.babelOpts

Configura cómo [](https://www.npmjs.com/package/@babel/register)ts-node se supone que transpile los archivos.

Type: `Object` Default: `{}`

## Hooks

El testrunner WDIO le permite configurar ganchos para que se activen en momentos específicos del ciclo de vida de la prueba. Esto permite acciones personalizadas (por ejemplo, tomar captura de pantalla si una prueba falla).

Cada gancho tiene como parámetro información específica sobre el ciclo de vida (por ejemplo, información sobre el conjunto de pruebas o la prueba). Lea más sobre todas las propiedades de gancho en [nuestra configuración de ejemplo](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L183-L326).

**Nota:** Algunos hooks (`onPrepare`, `onWorkerStart`, `onWorkerEnd` y `onComplete`) se ejecutan en un proceso diferente y por lo tanto no pueden compartir ningún dato global con los otros ganchos que viven en el proceso de trabajo.

### onPrepare

Se ejecuta una vez antes de que todos los trabajadores sean lanzados.

Parámetros:

- `config` (`objeto`): objeto de configuración WebdriverIO
- `param` (`object[]`): lista de detalles de capacidades

### onWorkerStart

Se ejecuta antes de que un proceso trabajador sea generado y se puede utilizar para inicializar un servicio específico para ese trabajador, así como para modificar los entornos de tiempo de ejecución de una manera asíncrona.

Parámetros:

- `cid` (`string`): id de capacidad (por ejemplo, 0-0)
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo
- `argumentos` (`objeto`): objeto que se fusionará con la configuración principal una vez que se inicialice el trabajador
- `execArgv` (`string[]`): lista de argumentos de cadena pasados al proceso de trabajo

### onWorkerEnd

Se ejecuta justo después de que el proceso de un trabajador haya terminado.

Parámetros:

- `cid` (`string`): id de capacidad (por ejemplo, 0-0)
- `exitCode` (`número`): 0 - éxito, 1 - error
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo
- `retries` (`number`): número de reintentos utilizados

### beforeSession

Se ejecuta justo antes de inicializar la sesión webdriver y el framework de pruebas. Permite manipular configuraciones dependiendo de la capacidad o especificación.

Parámetros:

- `config` (`objeto`): objeto de configuración WebdriverIO
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo

### before

Se ejecuta antes de comenzar la ejecución de la prueba. En este punto puede acceder a todas las variables globales como `navegador`. Es el lugar perfecto para definir comandos personalizados.

Parámetros:

- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo
- `browser` (`object`): instancia de la sesión de navegador/dispositivo creada

### beforeSuite

Gancho que se ejecuta antes de que la suite comience

Parámetros:

- `suite` (`objeto`): detalles de suite

### beforeHook

Gancho que se ejecuta *antes de* que se inicie un gancho dentro de la suite (por ejemplo, se ejecuta antes de llamar a beforeEach en Mocha)

Parámetros:

- `test` (`object`): detalles de prueba
- `contexto` (`objeto`): contexto de prueba (representa el objeto del mundo en cupón)

### afterHook

Gancho que es ejecutado *después de* un gancho dentro de la suite termina (por ejemplo, después de llamar después de cada llamada en Mocha)

Parámetros:

- `test` (`object`): detalles de prueba
- `contexto` (`objeto`): contexto de prueba (representa el objeto del mundo en cupón)
- `resultado` (`objeto`): resultado de gancho (contiene `error`, `resultado`, `duración`, `pasado`, `reintentos` propiedades)

### beforeTest

Función que se ejecuta antes de una prueba (en Mocha/Jasmine solamente).

Parámetros:

- `test` (`object`): detalles de prueba
- `contexto` (`objeto`): objeto de ámbito con el que se ejecutó la prueba

### beforeCommand

Ejecuta antes de que un comando WebdriverIO sea ejecutado.

Parámetros:

- `commandName` (`string`): nombre de comando
- `args` (`*`): argumentos que recibiría el comando

### afterCommand

Ejecuta después de que un comando WebdriverIO sea ejecutado.

Parámetros:

- `commandName` (`string`): nombre de comando
- `args` (`*`): argumentos que recibiría el comando
- `resultado` (`número`): 0 - comando exitoso, 1 - error de comando
- `error` (`Error`): objeto de error si existe

### afterTest

Función que se ejecuta después de que finalice una prueba (en Mocha/Jasmine).

Parámetros:

- `test` (`object`): detalles de prueba
- `contexto` (`objeto`): objeto de ámbito con el que se ejecutó la prueba
- `result.error` (`Error`): objeto de error en caso de que la prueba falle, de lo contrario `indefinido`
- `result.result` (`Any`): devuelve el objeto de la función de prueba
- `resultado.duración` (`Número`): duración de la prueba
- `result.passed` (`Boolean`): verdadero si la prueba ha pasado, de lo contrario, falso
- `result.retries` (`Objeto`): información de las especificaciones relacionadas con las recuperaciones, por ejemplo, `{ attempts: 0, limit: 0 }`
- `resultado` (`objeto`): resultado de gancho (contiene `error`, `resultado`, `duración`, `pasado`, `reintentos` propiedades)

### afterSuite

Gancho que es ejecutado después de que la suite haya terminado

Parámetros:

- `suite` (`objeto`): detalles de suite

### after

Se ejecuta después de que todas las pruebas hayan terminado. Todavía tiene acceso a todas las variables globales de la prueba.

Parámetros:

- `exitCode` (`número`): 0 - éxito, 1 - error
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo

### afterSession

Se ejecuta justo después de terminar la sesión del controlador web.

Parámetros:

- `config` (`objeto`): objeto de configuración WebdriverIO
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `especificaciones` (`cadenas []`): especificaciones que se ejecutarán en el proceso de trabajo

### onComplete

Se ejecutó después de que todos los trabajadores se cerraron y el proceso está a punto de salir. Un error arrojado en el gancho onComplete resultará en que la prueba falle.

Parámetros:

- `exitCode` (`número`): 0 - éxito, 1 - error
- `config` (`objeto`): objeto de configuración WebdriverIO
- `caps` (`object`): conteniendo capacidades para la sesión que aparecerán en el worker
- `resultado` (`objeto`): objeto de resultados que contiene resultados de prueba

### onReload

Se ejecuta cuando ocurre una actualización.

Parámetros:

- `oldSessionId` (`string`): ID de sesión de la sesión anterior
- `newSessionId` (`string`): ID de sesión de la nueva sesión

### beforeFeature

Se ejecuta antes de una Característica de Cucumber

Parámetros:

- `uri` (`string`): ruta al archivo de características
- `función` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): objeto función pepino

### afterFeature

Se ejecuta antes de una Característica de Cucumber.

Parámetros:

- `uri` (`string`): ruta al archivo de características
- `función` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): objeto función pepino

### beforeScenario

Se ejecuta antes de una Característica de Cucumber.

Parámetros:

- `mundo` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): objeto del mundo que contiene información sobre el ickle y paso de prueba
- `contexto` (`objeto`): objeto Cucumber World

### afterScenario

Se ejecuta antes de una Característica de Cucumber.

Parámetros:

- `mundo` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): objeto del mundo que contiene información sobre el ickle y paso de prueba
- `resultado` (`objeto`): objeto de resultados que contiene resultados de prueba
- `result.passed` (`boolean`): verdadero si la prueba ha pasado, de lo contrario, falso
- `result.error` (`string`): pila de errores si el escenario falló
- `result.duration` (`number`): duración del escenario en milisegundos
- `contexto` (`objeto`): objeto Cucumber World

### beforeStep

Se ejecuta antes de una Característica de Cucumber

Parámetros:

- `paso` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): objeto de paso Cucumber
- `paso` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): objeto de paso Cucumber
- `contexto` (`objeto`): objeto Cucumber World

### afterStep

Se ejecuta antes de una Característica de Cucumber

Parámetros:

- `paso` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): objeto de paso Cucumber
- `paso` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): objeto de paso Cucumber
- `resultado` (`objeto`): objeto de resultados que contiene resultados de prueba
- `result.passed` (`boolean`): verdadero si la prueba ha pasado, de lo contrario, falso
- `result.error` (`string`): pila de errores si el escenario falló
- `result.duration` (`number`): duración del escenario en milisegundos
- `contexto` (`objeto`): objeto Cucumber World
