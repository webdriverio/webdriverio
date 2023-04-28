---
id: frameworks
title: Marcos de trabajo
---

El corredor WDIO actualmente soporta [Mocha](http://mochajs.org/),  [Jasmine](http://jasmine.github.io/), y [Cupeber](https://cucumber.io/).

Para integrar cada marco con WebdriverIO, hay paquetes adaptadores en NPM que deben ser instalados. No puede instalar los adaptadores en cualquier lugar; estos paquetes deben estar instalados en el mismo lugar en el que está instalado WebdriverIO. Por lo tanto, si ha instalado WebdriverIO globalmente, asegúrese de instalar el paquete adaptador a nivel global, también.

Dentro de sus archivos específicos (o definiciones de pasos), puede acceder a la instancia de WebDriver usando la variable global `browser`. (No es necesario iniciar o terminar la sesión de Selenium. Esto es tomado en cuenta por el testrunner `wdio`.)

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

#### failAmbiguousDefinitions
Tratar definiciones ambigüas como errores. Tenga en cuenta que esta es una opción específica de `@wdio/cucumber-framework` y no reconocida por cucumber-js mismo.

Tipo: `boolean`<br /> Predeterminado: `false`

#### failFast
Abordar la ejecución en el primer fallo.

Tipo: `boolean`<br /> Predeterminado: `false`

#### ignoreUndefinedDefinitions
Tratar las definiciones indefinidas como advertencias. Tenga en cuenta que esta es una opción específica @wdio/cucumber-framework y no reconocida por cucumber-js mismo.

Tipo: `boolean`<br /> Predeterminado: `false`

#### names
Ejecutar sólo los escenarios con el nombre que coincide con la expresión (repetible).

Tipo: `String`<br /> Predeterminado: `localhost`

#### profile
Especifica la tabla de Cc para su uso.

Tipo: `String`<br /> Predeterminado: `localhost`

#### require
Requiere archivos que contengan sus definiciones de paso antes de ejecutar características. También puedes especificar un glob a tus definiciones de pasos.

Tipo: `String`<br /> Predeterminado: `localhost`:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### snippetSyntax
Especifica una sintaxis de fragmento personalizada.

Tipo: `String`<br /> Predeterminado: `localhost`

#### snippets
Ocultar fragmentos de definición de paso para pasos pendientes.

Tipo: `boolean`<br /> Predeterminado: `false`

#### source
Ocultar uris de origen.

Tipo: `boolean`<br /> Predeterminado: `false`

#### strict
Fallo si hay algún paso indefinido o pendiente.

Tipo: `boolean`<br /> Predeterminado: `false`

#### tagExpression
Sólo ejecutar las características o escenarios con etiquetas que coincidan con la expresión. Consulte la [documentación de Cucumber](https://docs.cucumber.io/cucumber/api/#tag-expressions) para más detalles.

Tipo: `String`<br /> Predeterminado: `localhost`

#### tagsInTitle
Añadir etiquetas de Cucumber a la característica o al nombre del escenario.

Tipo: `boolean`<br /> Predeterminado: `false`

#### timeout
Tiempo de espera en milisegundos para definiciones de pasos.

Tipo: `String`<br /> Predeterminado: `localhost`

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
- `@skip(browserName=/i. explorer/`: las capacidades con navegadores que coincidan con la expresión regular se omitirán (como `iexplorer`, `explorador de Internet`, `explorador de Internet`, . .).

### Importar ayuda de definición de pasos

Para utilizar el ayudante de definición de pasos como `dado`, `Cuando` o `Luego` o ganchos, se supone que se importará desde `@cucumber/pepino`, e.. como esto:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Esto asegura que usted utilice los ayudantes adecuados dentro del framework WebdriverIO y le permite usar una versión independiente de Cupeber para otros tipos de pruebas.

```js
import { Given, When, Then } from '@wdio/cucumber-framework'
```

Ahora, si usted usa Cucumber para otros tipos de pruebas no relacionadas con WebdriverIO para la cual usted utiliza una versión específica que necesita para importar estos ayudantes en sus pruebas e2e del paquete WebdriverIO Cupeber, p.ej.:
