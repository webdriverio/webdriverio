---
id: organizingsuites
title: Organización de la suite de pruebas
---

A medida que crecen los proyectos, inevitablemente se agregan más y más pruebas de integración. Esto aumenta el tiempo de construcción y reduce la productividad.

Para evitar esto, debe ejecutar sus pruebas en paralelo. WebdriverIO ya prueba cada especificación (o _archivo de características_ en Cucumber) en paralelo dentro de una sola sesión. En general, intente probar solo una función por archivo de especificaciones. Intente no tener demasiadas o muy pocas pruebas en un solo archivo. (Sin embargo, no existe una regla de oro.)

Una vez que sus pruebas tengan varios archivos de especificaciones, debe comenzar a ejecutar sus pruebas al mismo tiempo. Para ello, ajuste la propiedad `maxInstances` en su archivo de configuración. WebdriverIO le permite ejecutar sus pruebas con la máxima concurrencia, lo que significa que no importa cuántos archivos y pruebas tenga, todos pueden ejecutarse en paralelo.  (Esto todavía está sujeto a ciertos límites, como la CPU de su computadora, restricciones de concurrencia, etc.)

> Supongamos que tiene 3 capacidades diferentes (Chrome, Firefox y Safari) y ha configurado `maxInstances` a `1`. El corredor de prueba WDIO generará 3 procesos. Por lo tanto, si tiene 10 archivos de especificaciones y configura `maxInstances` a `10`, _los_ archivos de especificaciones se probarán simultáneamente y se generarán 30 procesos.

Puede definir globalmente la propiedad `maxInstances` para establecer el atributo para todos los navegadores.

Si ejecuta su propia cuadrícula de WebDriver, puede (por ejemplo) tener más capacidad para un navegador que para otro. En ese caso, puedes _limitar_ el `maxInstances` en tu objeto de capacidad:

```js
// wdio.conf.js
export const config = {
    // ...
    // set maxInstance for all browser
    maxInstances: 10,
    // ...
    capabilities: [{
        browserName: 'firefox'
    }, {
        // maxInstances can get overwritten per capability. So if you have an in-house WebDriver
        // grid with only 5 firefox instance available you can make sure that not more than
        // 5 instance gets started at a time.
        browserName: 'chrome'
    }],
    // ...
}
```

## Heredar del archivo de configuración principal

Si ejecuta su conjunto de pruebas en varios entornos (p. ej., desarrollo e integración), puede ser útil usar varios archivos de configuración para mantener las cosas manejables.

Similar al concepto de objeto de página [](pageobjects), lo primero que necesitará es un archivo de configuración principal. Contiene todas las configuraciones que comparte a través de entornos.

A continuación, cree otro archivo de configuración para cada entorno, y complemente la configuración principal con la específica del entorno:

```js
// wdio.dev.config.js
import { deepmerge } from 'deepmerge-ts'
import wdioConf from './wdio.conf.js'

// have main config file as default but overwrite environment specific information
export const config = deepmerge(wdioConf.config, {
    capabilities: [
        // more caps defined here
        // ...
    ],

    // run tests on sauce instead locally
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    services: ['sauce']
}, { clone: false })

// add an additional reporter
config.reporters.push('allure')
```

## Grupación de pruebas en las suites

Puede agrupar especificaciones de prueba en suites y ejecutar suites individuales específicas en lugar de todas.

Primero, defina sus suites en su configuración WDIO:

```js
// wdio.conf.js
export const config = {
    // define all tests
    specs: ['./test/specs/**/*.spec.js'],
    // ...
    // define specific suites
    suites: {
        login: [
            './test/specs/login.success.spec.js',
            './test/specs/login.failure.spec.js'
        ],
        otherFeature: [
            // ...
        ]
    },
    // ...
}
```

Ahora, si sólo quiere ejecutar una sola suite, puede pasar el nombre de la suite como un argumento CLI:

```sh
wdio wdio.conf.js --suite login
```

O, ejecutar múltiples suites a la vez:

```sh
wdio wdio.conf.js --suite login --suite otherFeature
```

## Agrupación de especificaciones de prueba para ejecutar secuencialmente

Como se describió anteriormente, existen beneficios al ejecutar las pruebas simultáneamente.  Sin embargo, hay casos en los que sería beneficioso agrupar las pruebas de forma secuencial en un solo caso.  Ejemplos de esto son principalmente donde hay un gran costo de configuración p.ej. transcompilar código o proporcionar instancias en la nube, pero también hay modelos de uso avanzados que se benefician de esta capacidad.

Para agrupar pruebas a ejecutar en una sola instancia, definirlas como una matriz dentro de la definición de especificaciones.

```json
    "specs": [
        [
            "./test/specs/test_login.js",
            "./test/specs/test_product_order.js",
            "./test/specs/test_checkout.js"
        ],
        "./test/specs/test_b*.js",
    ],
```
En el ejemplo anterior, las pruebas 'test_login.js', 'test_product_order.js' y 'test_checkout. s' se ejecutará secuencialmente en una sola instancia y cada una de las pruebas "test_b*" se ejecutarán simultáneamente en instancias individuales.

También es posible agrupar especificaciones definidas en conjuntos, por lo que ahora también puede definir conjuntos como este:
```json
    "suites": {
        end2end: [
            [
                "./test/specs/test_login.js",
                "./test/specs/test_product_order.js",
                "./test/specs/test_checkout.js"
            ]
        ],
        allb: ["./test/specs/test_b*.js"]
},
```
y en este caso todas las pruebas de la suite "end2end" se ejecutarían en una sola instancia.

Al ejecutar pruebas secuencialmente usando un patrón, ejecutará los archivos de especificaciones en orden alfabético

```json
  "suites": {
    end2end: ["./test/specs/test_*.js"]
  },
```

Esto ejecutará los archivos que coincidan con el patrón anterior en el siguiente orden:

```
  [
      "./test/specs/test_checkout.js",
      "./test/specs/test_login.js",
      "./test/specs/test_product_order.js"
  ]
```

## Ejecutar las pruebas seleccionadas

En algunos casos, es posible que desee ejecutar solo una prueba (o un subconjunto de pruebas) de sus suites.

Con el parámetro `--spec` , puede especificar qué _suite_ (Mocha, Jasmine) o _feature_ (Cucumber) deben ejecutarse. La ruta se resuelve relativa desde su directorio de trabajo actual.

Por ejemplo, para ejecutar sólo su prueba de login:

```sh
wdio wdio.conf.js --spec ./test/specs/e2e/login.js
```

Para imprimir varios pedidos a la vez:

```sh
wdio wdio.conf.js --spec ./test/specs/signup.js --spec ./test/specs/forgot-password.js
```

Si el valor `--spec` no apunta a un archivo específico en particular, se utiliza para filtrar los nombres de archivo especificados en la configuración.

Para ejecutar todas las especificaciones con la palabra “diálogo” en los nombres de los archivos especificados, puede usar:

```sh
wdio wdio.conf.js --spec dialog
```

Tenga en cuenta que cada archivo de prueba se está ejecutando en un único proceso de ejecución de pruebas. Puesto que no escaneamos los archivos de antemano (ver la siguiente sección para obtener información sobre los nombres de archivo de la tubería a `wdio`), usted _no puede_ usar (por ejemplo) `describe. nly` en la parte superior de tu archivo de especialización para indicar a Mocha que ejecute sólo esa suite.

Esta característica le ayudará a lograr el mismo objetivo.

Cuando se proporciona la opción `--spec` , sobreescribirá cualquier patrón definido por el parámetro `especificaciones` del nivel de configuración o capacidad.

## Excluir las pruebas seleccionadas

Cuando sea necesario, si necesita excluir archivo(s) específicos de una ejecución, puedes usar el parámetro `--exclude` (Mocha, Jasmine) o función (Cupeber).

Por ejemplo, para excluir su prueba de inicio de sesión de la ejecución de la prueba:

```sh
wdio wdio.conf.js --exclude ./test/specs/e2e/login.js
```

O, excluir múltiples especificaciones:

 ```sh
wdio wdio.conf.js --exclude ./test/specs/signup.js --exclude ./test/specs/forgot-password.js
```

O, excluir un archivo de especificaciones al filtrar usando una suite:

```sh
wdio wdio.conf.js --suite login --exclude ./test/specs/e2e/login.js
```

Cuando se proporciona la opción `--spec` , sobreescribirá cualquier patrón definido por el parámetro `especificaciones` del nivel de configuración o capacidad.

## Ejecutar suites y pruebas

Ejecute una suite completa junto con especificaciones individuales.

```sh
wdio wdio.conf.js --suite login --spec ./test/specs/signup.js
```

## Ejecutar Múltiples Especificaciones de Prueba

A veces es necesario&mdash;en el contexto de la integración continua y, de lo contrario&mdash;para especificar múltiples conjuntos de especificaciones para ejecutar. La utilidad de línea de comandos `wdio` de WebdriverIO acepta nombres de archivos canalizados (de `find`, `grep`u otros).

Los nombres de archivo canalizados anulan la lista de globs o nombres de archivo especificados en la lista `spec` de la configuración.

```sh
grep -r -l --include "*.js" "myText" | wdio wdio.conf.js
```

_**Nota:** Esto_ no _anulará el indicador `--spec` para ejecutar una única especificación._

## Ejecutando Pruebas Específicas con MochaOpts

También puede filtrar qué `suite|describe` y/o `it|test` específico desea ejecutar pasando un argumento específico de mocha: `--mochaOpts.grep` a la CLI de wdio.

```sh
wdio wdio.conf.js --mochaOpts.grep myText
wdio wdio.conf.js --mochaOpts.grep "Text with spaces"
```

_**Nota:** Mocha filtrará las pruebas después de que el ejecutor de pruebas WDIO cree las instancias, por lo que es posible que vea varias instancias generadas pero que no se ejecutan realmente._

## Detener la prueba después de un error

Con la opción `bail` , puede decirle a WebdriverIO que detenga la prueba después de que falle cualquier prueba.

Esto es útil con conjuntos de pruebas grandes cuando ya sabe que su compilación fallará, pero desea evitar la larga espera de una ejecución de prueba completa.

La opción `bail` espera un número, que especifica cuántas fallas de prueba pueden ocurrir antes de que WebDriver detenga la ejecución de prueba completa. El valor predeterminado es `0`, lo que significa que siempre ejecuta todas las especificaciones de prueba que puede encontrar.

[Consulte la página](configuration) de Opcionespara obtener información adicional sobre la configuración de la fianza.
## Ejecutar jerarquía de opciones

Al declarar qué especificaciones ejecutar, hay una cierta jerarquía que define qué patrón tendrá prioridad. Actualmente, así es como funciona, de mayor a menor prioridad:

> CLI `--spec` argument > capability `specs` pattern > config `specs` pattern CLI `--exclude` argument > config `exclude` pattern > capability `exclude` pattern

Si solo se proporciona el parámetro de configuración, se utilizará para todas las funciones. Sin embargo, si define el patrón en el nivel de capacidad, se utilizará en lugar del patrón de configuración. Finalmente, cualquier patrón de especificación definido en la línea de comandos anulará todos los demás patrones dados.

### Uso de patrones de especificación definidos por capacidad

Cuando define un patrón de especificación en el nivel de capacidad, anulará cualquier patrón definido en el nivel de configuración. Esto es útil cuando es necesario separar las pruebas en función de la diferenciación de las capacidades del dispositivo. En casos como este, es más útil usar un patrón de especificación genérico en el nivel de configuración y patrones más específicos en el nivel de capacidad.

Por ejemplo, digamos que tenías dos directorios, uno para pruebas de Android, y otro para pruebas de iOS.

Su archivo de configuración puede definir el patrón como tal, para pruebas de dispositivos no específicos:

```js
{
    specs: ['tests/general/**/*.js']
}
```

pero luego, tendrá diferentes capacidades para sus dispositivos Android e iOS, donde los patrones podrían verse así:

```json
{
  "platformName": "Android",
  "specs": [
    "tests/android/**/*.js"
  ]
}
```

```json
{
  "platformName": "iOS",
  "specs": [
    "tests/ios/**/*.js"
  ]
}
```

Si necesita ambas capacidades en su archivo de configuración, entonces el dispositivo Android solo ejecutará las pruebas bajo el espacio de nombres "android", y las pruebas de iOS solo ejecutarán las pruebas bajo el espacio de nombres "ios".

```js
//wdio.conf.js
export const config = {
    "specs": [
        "tests/general/**/*.js"
    ],
    "capabilities": [
        {
            platformName: "Android",
            specs: ["tests/android/**/*.js"],
            //...
        },
        {
            platformName: "iOS",
            specs: ["tests/ios/**/*.js"],
            //...
        },
        {
            platformName: "Chrome",
            //config level specs will be used
        }
    ]
}
```

