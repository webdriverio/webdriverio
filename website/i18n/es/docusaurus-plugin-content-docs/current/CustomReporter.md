---
id: customreporter
title: Reporte personalizado
---

Puede escribir su propio reportero personalizado para el corredor de pruebas WDIO que se adapte a sus necesidades. ¡Y es sencillo!

Todo lo que necesitas hacer es crear un módulo de nodo que hereda del paquete `@wdio/reporter`. para que pueda recibir mensajes de la prueba.

La configuración básica debería ser así:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    constructor(options) {
        /*
         * make reporter to write to the output stream by default
         */
        options = Object.assign(options, { stdout: true })
        super(options)
    }

    onTestPass(test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`)
    }
}
```

Para usar este reportero, todo lo que necesitas hacer es asignarlo a la propiedad de `reporter` en tu configuración.


El archivo `mysite/urls.py` debería verse ahora así:

```js
import CustomReporter from './reporter/my.custom.reporter'

export const config = {
    // ...
    reporters: [
        /**
         * use imported reporter class
         */
        [CustomReporter, {
            someOption: 'foobar'
        }]
        /**
         * use absolute path to reporter
         */
        ['/path/to/reporter.js', {
            someOption: 'foobar'
        }]
    ],
    // ...
}
```

También puedes publicar el reportero en el NPM para que todos puedan usarlo. Nombra el paquete como otros reporteros `wdio-<reportername>-reportero`, y etiquetarlo con palabras clave como `wdio` o `wdio-reporter`.

## Controladores de eventos

Usted puede registrar un controlador de eventos para varios eventos que se activan durante la prueba. Todos los siguientes controladores recibirán cargas útiles con información útil sobre el estado actual y el progreso.

La estructura de estos objetos de carga útil depende del evento, y están unificados a través de los marcos (Mocha, Jasmín y Cupeber). Una vez implementado un reportero personalizado, debería funcionar para todos los frameworks.

La siguiente lista contiene todos los métodos posibles que puede añadir a su clase de reportero:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onRunnerStart() {}
    onBeforeCommand() {}
    onAfterCommand() {}
    onSuiteStart() {}
    onHookStart() {}
    onHookEnd() {}
    onTestStart() {}
    onTestPass() {}
    onTestFail() {}
    onTestSkip() {}
    onTestEnd() {}
    onSuiteEnd() {}
    onRunnerEnd() {}
}
```

Los nombres de los métodos son bastante autoexplicativos.

Para imprimir algo en un evento determinado, usa el método `this.write(...)`, que es proporcionado por la clase padre `WDIOReporter`. Transmite el contenido a `stdout`, o a un archivo de registro (dependiendo de las opciones del reportero).

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onTestPass(test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`)
    }
}
```

Tenga en cuenta que no puede diferir de ninguna manera la ejecución de la prueba.

Todos los controladores de eventos deben ejecutar rutinas sincrónicas (o se encontrarán en condiciones de carrera).

Asegúrate de revisar la sección de ejemplo de [](https://github.com/webdriverio/webdriverio/tree/main/examples/wdio) donde puedes encontrar un informador personalizado de ejemplo que imprime el nombre del evento para cada evento.

Si has implementado un reportero personalizado que podría ser útil para la comunidad, no dude en hacer una Pull Request para que podamos poner el reportero a disposición del público!

Además, si ejecutas el testrunner WDIO a través de la interfaz `Launcher`, no puedes aplicar un reportero personalizado como función de la siguiente manera:

```js
import Launcher from '@wdio/cli'

import CustomReporter from './reporter/my.custom.reporter'

const launcher = new Launcher('/path/to/config.file.js', {
    // this will NOT work, because CustomReporter is not serializable
    reporters: ['dot', CustomReporter]
})
```

## Espera hasta que `se sincronice`

Si su reportero tiene que ejecutar operaciones asíncronas para reportar los datos (p. ej. carga de archivos de registro u otros activos) puede sobrescribir el método `isSynchronised` en su reportero personalizado para permitir al corredor WebdriverIO esperar hasta que lo haya calculado todo. Un ejemplo de esto se puede ver en la [`@wdio/sumologic-reporter`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-sumologic-reporter/src/index.js):

```js
export default class SumoLogicReporter extends WDIOReporter {
    constructor (options) {
        // ...
        this.unsynced = []
        this.interval = setInterval(::this.sync, this.options.syncInterval)
        // ...
    }

    /**
     * overwrite isSynchronised method
     */
    get isSynchronised () {
        return this.unsynced.length === 0
    }

    /**
     * sync log files
     */
    sync () {
        // ...
        request({
            method: 'POST',
            uri: this.options.sourceAddress,
            body: logLines
        }, (err, resp) => {
            // ...
            /**
             * remove transferred logs from log bucket
             */
            this.unsynced.splice(0, MAX_LINES)
            // ...
        }
    }
}
```

De esta manera, el corredor esperará hasta que toda la información de registro sea cargada.

## Publicar el reporte en NPM

Para que el reportero sea más fácil de consumir y descubrir por la comunidad WebdriverIO, sigue estas recomendaciones:

* Los servicios deben usar esta convención de nombres: `wdio-*-reporter`
* Usar palabras clave NPM: `wdio-plugin`, `wdio-reporter`
* La entrada `main` entry debe `exportar` una instancia del reportero
* Ejemplo de reportero: [`@wdio/dot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-dot-reporter)

Siguiendo el patrón de nomenclatura recomendado permite que los servicios se añadan por nombre:

```js
// Add wdio-custom-reporter
export const config = {
    // ...
    reporter: ['custom'],
    // ...
}
```

### Añadir Servicio Publicado a WDIO CLI y Docs

Realmente apreciamos cada nuevo plugin que podría ayudar a otras personas a hacer mejores pruebas! Si has creado un plugin de este tipo, por favor considera añadirlo a nuestro CLI y documentos para que sea más fácil de encontrar. Si has creado un plugin de este tipo, por favor considera añadirlo a nuestro CLI y documentos para que sea más fácil de encontrar.

Por favor, envíe un pull request con los siguientes cambios:

- añade tu servicio a la lista de [reporters soportados](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/constants.ts#L74-L91)) en el módulo CLI
- mejorar la lista de reporteros [](https://github.com/webdriverio/webdriverio/blob/main/scripts/docs-generation/3rd-party/reporters.json) para añadir sus documentos a la página oficial de Webdriver.io
