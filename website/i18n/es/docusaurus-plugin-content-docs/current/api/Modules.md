---
id: modules
title: Módulos
---

WebdriverIO publica varios módulos a NPM y otros registros que puede utilizar para construir su propio marco de automatización. Vea más documentación sobre tipos de configuración de WebdriverIO [aquí](/docs/setuptypes).

## `webdriver` y `devtools`

Los paquetes de protocolo ([`webdriver`](https://www.npmjs.com/package/webdriver) y [`devtools`](https://www.npmjs.com/package/devtools)) exponen una clase con las siguientes funciones estáticas adjuntas que le permiten iniciar sesiones:

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

Inicia una nueva sesión con capacidades específicas. Basado en los comandos de respuesta de sesión de diferentes protocolos serán proporcionados.

##### Parámetros

- `options`: [Opciones de WebDriver](/docs/configuration#webdriver-options)
- `modifier`: función que permite modificar la instancia del cliente antes de que sea devuelta
- `userPrototype`: objeto de propiedades que permite extender el prototipo de instancia
- `customCommandWrapper`: función que permite envolver la funcionalidad alrededor de llamadas de función

##### Retornos

- [Objeto del navegador](/docs/api/browser)

##### Ejemplo

```js
const client = await WebDriver.newSession({
    capabilities: { browserName: 'chrome' }
})
```

#### `attachSession(attachInstance, modifier, userPrototype, customCommandWrapper)`

Se adjunta a una sesión de WebDriver o DevTools en ejecución.

##### Parámetros

- `attachInstance`: instancia para adjuntar una sesión a, o al menos un objeto con una propiedad `sessionId` (e. . `{ sessionId: 'xxx' }`)
- `modifier`: función que permite modificar la instancia del cliente antes de que sea devuelta
- `userPrototype`: objeto de propiedades que permite extender el prototipo de instancia
- `customCommandWrapper`: función que permite envolver la funcionalidad alrededor de llamadas de función

##### Retornos

- [Browser](/docs/api/browser) object

##### Ejemplo

```js
const client = await WebDriver.newSession({...})
const clonedClient = await WebDriver.attachSession(client)
```

#### `reloadSession(instance)`

Recarga una instancia proporcionada de sesión.

##### Parámetros

- `instancia`: instancia de paquete para recargar

##### Ejemplo

```js
const client = await WebDriver.newSession({...})
await WebDriver.reloadSession(client)
```

## `webdriverio`

Similar en cuanto a los paquetes de protocolo (`webdriver` y `devtools`) también puede usar las API de paquetes WebdriverIO para administrar sesiones. Las APIs se pueden importar usando `importar { remote, attach, multiremote } de 'webdriverio` y contienen la siguiente funcionalidad:

#### `remote(options, modifier)`

Inicia una sesión WebdriverIO. La instancia contiene todos los comandos como el paquete de protocolo, pero con funciones adicionales de orden superior, vea [API docs](/docs/api).

##### Parámetros

- `options`: [Opciones de WebDriver](/docs/configuration#webdriverio)
- `modifier`: función que permite modificar la instancia del cliente antes de que sea devuelta

##### Retornos

- [Objeto del navegador](/docs/api/browser)

##### Ejemplo

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})
```

#### `attach(attachOptions)`

Se adjunta a una sesión de WebDriver o DevTools en ejecución.

##### Parámetros

- `attachInstance`: instancia para adjuntar una sesión a, o al menos un objeto con una propiedad `sessionId` (e. . `{ sessionId: 'xxx' }`)

##### Retornos

- [Objeto del navegador](/docs/api/browser)

##### Ejemplo

```js
import { remote, attach } from 'webdriverio'

const browser = await remote({...})
const newBrowser = await attach(browser)
```

#### `multiremote(multiremoteOptions)`

Inicia una instancia multiremota que le permite controlar varias sesiones dentro de una sola instancia. Compruebe nuestros [ejemplos multiremotos](https://github.com/webdriverio/webdriverio/tree/main/examples/multiremote) para casos de uso de concreto.

##### Parámetros

- `multiremoteOptions`: un objeto con claves que representan el nombre del navegador y sus [Opciones WebdriverIO](/docs/configuration#webdriverio).

##### Retornos

- [Objeto del navegador](/docs/api/browser)

##### Ejemplo

```js
import { multiremote } from 'webdriverio'

const matrix = await multiremote({
    myChromeBrowser: {
        capabilities: { browserName: 'chrome' }
    },
    myFirefoxBrowser: {
        capabilities: { browserName: 'firefox' }
    }
})
await matrix.url('http://json.org')
await matrix.getInstance('browserA').url('https://google.com')

console.log(await matrix.getTitle())
// returns ['Google', 'JSON']
```

## `@wdio/cli`

En lugar de llamar al comando `wdio` , también puede incluir el corredor de prueba como módulo y ejecutarlo en un entorno arbitrario. Para eso, necesitará el paquete `@wdio/cli` como módulo, de la siguiente manera:

<Tabs
  defaultValue="esm"
  values={[
    {label: 'EcmaScript Modules', value: 'esm'},
 {label: 'CommonJS', value: 'cjs'}
 ]
}>
<TabItem value="esm">

```js
import Launcher from '@wdio/cli'
```

</TabItem>
<TabItem value="cjs">

```js
const Launcher = require('@wdio/cli').default
```

</TabItem>
</Tabs>

Después de eso, cree una instancia del launcher, y ejecute la prueba.

#### `Launcher(configPath, opts)`

El constructor de clase `Launcher` espera la URL al archivo de configuración, y un objeto `opts` con ajustes que sobrescribirán los que están en la configuración.

##### Parámetros

- `configPath`: ruta al `wdio.conf.js` para ejecutar
- `opta`: argumentos ([`<RunCommandArguments>`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/types.ts#L51-L77)) para sobrescribir valores del archivo de configuración

##### Ejemplo

```js
const wdio = new Launcher(
    '/path/to/my/wdio.conf.js',
    { spec: '/path/to/a/single/spec.e2e.js' }
)

wdio.run().then((exitCode) => {
    process.exit(exitCode)
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace)
    process.exit(1)
})
```

El comando `run` devuelve una [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). Se resuelve si las pruebas se ejecutaron con éxito o fallaron, y se rechaza si el lanzador no pudo iniciar las pruebas.

## `@wdio/browser-runner`

Al ejecutar pruebas unitarias o de componentes utilizando WebdriverIO's [browser runner](/docs/runner#browser-runner) , puede importar utilidades de simulación para sus pruebas, por ejemplo:

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

Los siguientes eventos están disponibles:

#### `fn`

Función simulada, vea más en la documentación oficial de [Vitest](https://vitest.dev/api/mock.html#mock-functions).

#### `spyOn`

Función espía, vea más en la documentación oficial de [Vitest](https://vitest.dev/api/mock.html#mock-functions).

#### `mock`

Método para simular el archivo o módulo de dependencias.

##### Parámetros

- `moduleName`: una ruta relativa al archivo a ser simulado o un nombre de módulo.
- `factory`: función para devolver el valor simulado (opcional)

##### Ejemplo

```js
mock('../src/constants. s', () => ({
    SOME_DEFAULT: 'mocked out'
}))

mock('lodash', (origModuleFactory) => {
    const origModule = await origModuleFactory()
    return {
        . .origModule,
        pick: fn()
    }
})
```

#### `unmock`

Dependencia unmock definida dentro del directorio simulación manual (`__mocks__`).

##### Parámetros

- `moduleName`: nombre del módulo para ser desmontado.

##### Ejemplo

```js
unmock('lodash')
```
