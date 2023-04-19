---
id: customservices
title: Servicios personalizados
---

Puede escribir su propio servicio personalizado para que el corredor de pruebas WDIO se adapte a sus necesidades.

Los servicios son complementos creados para la lógica reutilizable que simplifica las pruebas, administra tu suite de pruebas e integra resultados. Los servicios tienen acceso a todos los mismos [hooks](/docs/configurationfile) disponibles en `wdio.conf.js`.

Hay dos tipos de servicios que se pueden definir: un servicio de lanzador que sólo tiene acceso al `onPrepare`, `onWorkerStart`, `onWorkerEnd` y `onComplete` gancho que solo son ejecutados una vez por ejecución de prueba, y un servicio de trabajador que tiene acceso a todos los otros ganchos y que está siendo ejecutado por cada trabajador. Tenga en cuenta que no puede compartir variables (globales) entre ambos tipos de servicios mientras los servicios de worker se ejecutan en un proceso diferente (worker).

Un servicio de lanzador puede ser definido de la siguiente manera:

```js
export default class CustomLauncherService {
    // If a hook returns a promise, WebdriverIO will wait until that promise is resolved to continue.
    async onPrepare(config, capabilities) {
        // TODO: something before all workers launch
    }

    onComplete(exitCode, config, capabilities) {
        // TODO: something after the workers shutdown
    }

    // custom service methods ...
}
```

Donde un servicio de trabajador debería verse así:

```js
export default class CustomWorkerService {
    /**
     * `serviceOptions` contains all options specific to the service
     * e.g. if defined as follows:
     *
     * ```
     * services: [['custom', { foo: 'bar' }]]
     * ```
     *
     * the `serviceOptions` parameter will be: `{ foo: 'bar' }`
     */
    constructor (serviceOptions, capabilities, config) {
        this.options = serviceOptions
    }

    /**
     * this browser object is passed in here for the first time
     */
    async before(config, capabilities, browser) {
        this.browser = browser

        // TODO: something before all tests are run, e.g.:
        await this.browser.setWindowSize(1024, 768)
    }

    after(exitCode, config, capabilities) {
        // TODO: something after all tests are run
    }

    beforeTest(test, context) {
        // TODO: something before each Mocha/Jasmine test run
    }

    beforeScenario(test, context) {
        // TODO: something before each Cucumber scenario run
    }

    // other hooks or custom service methods ...
}
```

Es recomendable almacenar el objeto del navegador a través del parámetro pasado en el constructor. Por último, exponer ambos tipos de trabajadores de la siguiente manera:

```js
import CustomLauncherService from './launcher'
import CustomWorkerService from './service'

export default CustomWorkerService
export const launcher = CustomLauncherService
```

Si está utilizando TypeScript y quiere asegurarse de que el parámetro de métodos ganok son seguros, puede definir su clase de servicio de la siguiente manera:

```ts
import type { Capabilities, Options, Services } from '@wdio/types'

export default class CustomWorkerService implements Services.ServiceInstance {
    constructor (
        private _options: MyServiceOptions,
        private _capabilities: Capabilities.RemoteCapability,
        private _config: Omit<Options.Testrunner, 'capabilities'>
    ) {
        // ...
    }

    // ...
}
```

## Error de servicio

Un error arrojado durante un gancho de servicio será registrado mientras el corredor continúa. Si un gancho en su servicio es crítico para la configuración o desmontaje del corredor de pruebas, el `SevereServiceError` expuesto desde el paquete `webdriverio` se puede utilizar para detener el ejecutor.

```js
import { SevereServiceError } from 'webdriverio'

export default class CustomServiceLauncher {
    async onPrepare(config, capabilities) {
        // TODO: something critical for setup before all workers launch

        throw new SevereServiceError('Something went wrong.')
    }

    // custom service methods ...
}
```

## Importar servicio desde el módulo

Lo único que hay que hacer ahora para usar este servicio es asignarlo a la propiedad de `services`.

Modifique su archivo `wdio.conf.js` para que se vea así:

```js
import CustomService from './service/my.custom.service'

export const config = {
    // ...
    services: [
        /**
         * use imported service class
         */
        [CustomService, {
            someOption: true
        }],
        /**
         * use absolute path to service
         */
        ['/path/to/service.js', {
            someOption: true
        }]
    ],
    // ...
}
```

## Publicar servicio en NPM

Para facilitar el consumo y descubrimiento de servicios por parte de la comunidad WebdriverIO, por favor sigue estas recomendaciones:

* Los servicios deben utilizar esta convención de nomenclatura: `wdio-*-service`
* Usar palabras clave NPM: `wdio-plugin`, `wdio-service`
* La entrada `principal` debería `exportar` una instancia del servicio
* Ejemplo de reportero: [`@wdio/dot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service)

Siguiendo el patrón de nomenclatura recomendado permite que los servicios se añadan por nombre:

```js
// Add wdio-custom-service
export const config = {
    // ...
    services: ['custom'],
    // ...
}
```

### Añadir Servicio Publicado a WDIO CLI y Docs

Realmente apreciamos cada nuevo plugin que podría ayudar a otras personas a hacer mejores pruebas! Si has creado un plugin de este tipo, por favor considera añadirlo a nuestro CLI y documentos para que sea más fácil de encontrar. Si has creado un plugin de este tipo, por favor considera añadirlo a nuestro CLI y documentos para que sea más fácil de encontrar.

Por favor, envíe un pull request con los siguientes cambios:

- añade tu servicio a la lista de [reporters soportados](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/constants.ts#L92-L128)) en el módulo CLI
- mejorar la lista de reporteros [](https://github.com/webdriverio/webdriverio/blob/main/scripts/docs-generation/3rd-party/services.json) para añadir sus documentos a la página oficial de Webdriver.io
