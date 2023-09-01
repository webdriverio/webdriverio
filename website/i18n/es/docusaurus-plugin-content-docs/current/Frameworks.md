---
id: frameworks
title: Marcos de trabajo
---

WebdriverIO Runner has built-in support for [Mocha](http://mochajs.org/), [Jasmine](http://jasmine.github.io/), and [Cucumber.js](https://cucumber.io/). You can also integrate it with 3rd-party open-source frameworks, such as [Serenity/JS](#using-serenityjs).

:::tip Integrating WebdriverIO with test frameworks
To integrate WebdriverIO with a test framework, you need an adapter package available on NPM. Note that the adapter package must be installed in the same location where WebdriverIO is installed. Por lo tanto, si ha instalado WebdriverIO globalmente, asegúrese de instalar el paquete adaptador a nivel global, también.
:::

Integrating WebdriverIO with a test framework lets you access the WebDriver instance using the global `browser` variable in your spec files or step definitions. Note that WebdriverIO will also take care of instantiating and ending the Selenium session, so you don't have to do it yourself.

## Uso de Mocha

Primero, instale el paquete adaptador desde NPM:

```bash npm2yarn
npm install @wdio/mocha-framework --save-dev
```

Por defecto, WebdriverIO proporciona una librería de aserción [](assertion) que está integrada y que puede comenzar de inmediato:

```js
describe('my awesome website', () => {
    it('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

WebdriverIO soporta `BDD` de Mocha (por defecto), `TDD`y `QUnit` [interfaces](https://mochajs.org/#interfaces).

Si te gusta escribir tus especificaciones en estilo TDD, establecer la propiedad `ui` en la configuración `mochaOpts` a `tdd`. Ahora los archivos de prueba deben ser escritos así:

```js
suite('my awesome website', () => {
    test('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

Si desea definir otras configuraciones específicas de Mocha, puede hacerlo con la clave `mochaOpts` en su archivo de configuración. Puede encontrar una lista de todas las opciones en el sitio web [del proyecto Mocha](https://mochajs.org/api/mocha).

__Nota:__ WebdriverIO no soporta el uso obsoleto de `done` callbacks en Mocha:

```js
it('should test something', (done) => {
    done() // throws "done is not a function"
})
```

### Opciones de Mocha

Las siguientes opciones se pueden aplicar en su `wdio.conf.js` para configurar su entorno Mocha. __Nota:__ no todas las opciones son compatibles, p. ej. aplicar la opción `paralela` causará un error ya que el testrunner WDIO tiene su propia manera de ejecutar pruebas en paralelo. Se pueden ejecutar las siguientes acciones:

#### require
La opción `require` es útil cuando desea agregar o extender alguna funcionalidad básica (opción de framework WebdriverIo).

Tipo: `String`<br /> Predeterminado: `localhost`

#### compilers
Use el/los módulo(s) dados para compilar archivos. Los compiladores serán incluidos antes de lo requerido (opción de framework WebdriverIo).

Tipo: `String`<br /> Predeterminado: `localhost`

#### allowUncaught
Propagar errores no detectados.

Tipo: `String`<br /> Predeterminado: `localhost`

#### bail
Respuesta después de la primera prueba fallida.

Tipo: `String`<br /> Predeterminado: `localhost`

#### checkLeaks
Comprobar las fugas globales de variables.

Tipo: `String`<br /> Predeterminado: `localhost`

#### delay
Retrasar la ejecución de la suite root.

Tipo: `String`<br /> Predeterminado: `localhost`

#### fgrep
Evalúa el filtro dado de cadena.

Tipo: `String`<br /> Predeterminado: `localhost`

#### forbidOnly
Las pruebas marcan `solo` fallaron en la suite.

Tipo: `String`<br /> Predeterminado: `localhost`

#### forbidPending
Las pruebas pendientes fallan en la suite.

Tipo: `String`<br /> Predeterminado: `localhost`

#### fullTrace
Rastros completos en caso de falla.

Tipo: `boolean`<br /> Predeterminado: `false`

#### global
Variables esperadas en el ámbito global.

Type: `string[]`<br /> Default: `[]`

#### grep
Evalúa el filtro de expresión regular.

Tipo: `RegExp|string`<br /> Predeterminado: `null`

#### invert
Invertir filtros de prueba.

Tipo: `boolean`<br /> Predeterminado: `false`

#### retries
Número de veces para volver a intentar pruebas fallidas.

Type: `number`<br /> Default: `0`

#### timeout
Valor límite de tiempo de espera (en ms).

Tipo: `String`<br /> Predeterminado: `localhost`

## Utilizando Jasmine

Primero, instale el paquete adaptador de NPM:

```bash npm2yarn
npm install @wdio/jasmine-framework --save-dev
```

A continuación, puede configurar su entorno Jasmine configurando una propiedad `jasmineOpts` en su configuración. Puede encontrar una lista de todas las opciones en el sitio web [del proyecto Mocha](https://jasmine.github.io/api/3.5/Configuration.html).

### Interceptar Aserción

El framework de Jasmine le permite interceptar cada afirmación para registrar el estado de la aplicación o sitio web, dependiendo del resultado.

Por ejemplo, es bastante práctico tomar una captura de pantalla cada vez que una afirmación falla. En tu `jasmineOpts` puedes añadir una propiedad llamada `expectationResultHandler` que toma una función para ejecutar. Los parámetros de la función proporcionan información acerca del resultado de la afirmación.

El siguiente ejemplo muestra cómo tomar una captura de pantalla si una afirmación falla:

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

**Nota:** No se puede detener la ejecución de la prueba para hacer algo asíncrono. Puede suceder que el comando tome demasiado tiempo y el estado del sitio web haya cambiado. (Aunque normalmente, después de otros 2 comandos se hace la captura de pantalla de todos modos, lo que sigue proporcionando _alguna información valiosa sobre el error_)

### Opciones de Jasmine

Las siguientes opciones pueden ser aplicadas en su `wdio.conf.js` para configurar su entorno de Jasmine utilizando la propiedad `jasmineOpts`. Para obtener más información sobre estas opciones de configuración, consulte la [documentación de Jasmine](https://jasmine.github.io/api/edge/Configuration).

#### defaultTimeoutInterval
Intervalo de tiempo de espera por defecto para las operaciones de Jasmin.

Tipo: `String`<br /> Predeterminado: `localhost`

#### helpers
Matriz de rutas de archivo (y globos) relativas a spec_dir para incluir antes de jasmine specs.

Tipo: `String`<br /> Predeterminado: `localhost`

#### requires
La opción `requiere` es útil cuando desea agregar o ampliar alguna funcionalidad básica.

Tipo: `String`<br /> Predeterminado: `localhost`

#### random
Si aleatoriza o no el orden de ejecución de las especificaciones.

Tipo: `boolean`<br /> Predeterminado: `false`

#### seed
Semilla a utilizar como base de la aleatorización. Null hace que la semilla se determine aleatoriamente al inicio de la ejecución.

Tipo: `String`<br /> Predeterminado: `localhost`

#### failSpecWithNoExpectations
Si falló o no la especificación si no cumplió ninguna expectativa. Por defecto se reporta una especificación que no ha ejecutado ninguna expectativa como se ha pasado. Establecer esto como verdadero reportará tal especificación como un fracaso.

Tipo: `boolean`<br /> Predeterminado: `false`

#### oneFailurePerSpec
Si provocar que las especificaciones sólo tengan un fallo de expectativa.

Tipo: `boolean`<br /> Predeterminado: `false`

#### specFilter
Función a utilizar para filtrar las especificaciones.

Tipo: `Función`<br /> Predeterminada: `(spec) => true`

#### grep
Ejecute sólo pruebas que coincidan con esta cadena o regexp. (Sólo aplicable si no se establece ninguna función personalizada `specFilter`)

Tipo: `String`<br /> Predeterminado: `localhost`

#### invertGrep
Si es verdadero, invierte las pruebas coincidentes y solo ejecuta pruebas que no coincidan con la expresión usada en `grep`. (Sólo aplicable si no se establece ninguna función personalizada `specFilter`)

Tipo: `boolean`<br /> Predeterminado: `false`

## Utilizando Cucumber

Primero, instale el paquete adaptador de NPM:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

Si quieres usar pepino, establece la propiedad `framework` a `cupeber` añadiendo `framework: 'cupeber'` al archivo de configuración [](configurationfile) .

Las opciones para Cucumber se pueden dar en el archivo de configuración con `cucumberOpts`. Echa un vistazo a la lista completa de opciones [aquí](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options).

Para levantarse y funcionar rápidamente con Cupeber, échale un vistazo a nuestro proyecto [`pepino boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) que viene con todas las definiciones de pasos que necesitas para empezar, y estarás escribiendo archivos de características de inmediato.

### Opciones de Cucumber

Las siguientes opciones pueden ser aplicadas en su `wdio.conf.js` para configurar su entorno de Jasmine utilizando la propiedad `jasmineOpts`:

#### backtrace
Mostrar el backtrace completo para errores.

Tipo: `boolean`<br /> Predeterminado: `false`

#### requireModule
Requiere módulos antes de requerir cualquier archivo de soporte.

Tipo: `String`<br /> Predeterminado: `localhost`:

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
Abordar la ejecución en el primer fallo.

Tipo: `boolean`<br /> Predeterminado: `false`

#### names
Ejecutar sólo los escenarios con el nombre que coincide con la expresión (repetible).

Tipo: `String`<br /> Predeterminado: `localhost`

#### require
Requiere archivos que contengan sus definiciones de paso antes de ejecutar características. También puedes especificar un glob a tus definiciones de pasos.

Tipo: `String`<br /> Predeterminado: `localhost`:

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
Fallo si hay algún paso indefinido o pendiente.

Tipo: `boolean`<br /> Predeterminado: `false`

## tags
Sólo ejecutar las características o escenarios con etiquetas que coincidan con la expresión. Consulte la [documentación de Cucumber](https://docs.cucumber.io/cucumber/api/#tag-expressions) para más detalles.

Type: `String`<br /> Default: ``

### timeout
Tiempo de espera en milisegundos para definiciones de pasos.

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
Tratar las definiciones indefinidas como advertencias.

Type: `Boolean`<br /> Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### failAmbiguousDefinitions
Tratar definiciones ambigüas como errores.

Type: `Boolean`<br /> Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### tagExpression
Only execute the features or scenarios with tags matching the expression. Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.

Type: `String`<br /> Default: ``

***Please note that this option would be deprecated in future. Use [`tags`](#tags) config property instead***

#### profile
Especifica la tabla de Cc para su uso.

Tipo: `String`<br /> Predeterminado: `localhost`

***Kindly take note that only specific values (worldParameters, name, retryTagFilter) are supported within profiles, as `cucumberOpts` takes precedence. Additionally, when using a profile, make sure that the mentioned values are not declared within `cucumberOpts`.***

### Omitiendo pruebas en Cucumber

Ten en cuenta que si quieres saltar una prueba usando las capacidades de filtrado de pruebas de pepino regulares disponibles en `cucumberOpts`, lo haremos para todos los navegadores y dispositivos configurados en las capacidades. Para poder omitir escenarios sólo para combinaciones de capacidades específicas sin tener una sesión iniciada si no es necesario, webdriverio proporciona la siguiente sintaxis específica de etiquetas para pepinos:

`@skip([condition])`

cuando la condición es una combinación opcional de propiedades de capacidades con sus valores que cuando **todas** coinciden con hace que el escenario o la característica etiquetada se omita. Por supuesto, puede añadir varias etiquetas a escenarios y características para omitir una prueba bajo varias condiciones diferentes.

También puede usar la anotación '@skip' para saltar pruebas sin cambiar 'tagExpression'. En este caso las pruebas omitidas se mostrarán en el informe de pruebas.

Aquí tienes algunos ejemplos de esta sintaxis:
- `@skip` o `@skip()`: siempre omitirá el elemento etiquetado
- `@skip(browserName="chrome")`: la prueba no se ejecutará contra los navegadores chrome.
- `@skip(browserName="firefox";platformName="linux")`: omitirá la prueba en firefox sobre ejecuciones de linux.
- `@skip(browserName=["cromo","firefox"])`: los elementos etiquetados serán omitidos para los navegadores de cromo y firefox.
- `@skip(browserName=/i.*explorer/)`: capabilities with browsers matching the regexp will be skipped (like `iexplorer`, `internet explorer`, `internet-explorer`, ...).

### Importar ayuda de definición de pasos

Para utilizar el ayudante de definición de pasos como `dado`, `Cuando` o `Luego` o ganchos, se supone que se importará desde `@cucumber/pepino`, e.. como esto:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Esto asegura que usted utilice los ayudantes adecuados dentro del framework WebdriverIO y le permite usar una versión independiente de Cupeber para otros tipos de pruebas.

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
