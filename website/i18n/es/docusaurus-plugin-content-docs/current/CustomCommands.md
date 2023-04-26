---
id: customcommands
title: Comandos personalizados
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Si quieres extender la instancia de `browser` con tu propio conjunto de comandos, el método navegador  `addCommand` está aquí para usted. Puede escribir su comando de una forma asíncrona, al igual que en sus especificaciones.

## Parámetros

### Nombre del comando

Un nombre que define el comando y se adjuntará al navegador o al ámbito del elemento.

Tipo: `String`

### Función personalizada

Una función que se está ejecutando cuando el comando es activado. El `este` ámbito es [`WebdriverIO.Browser`](/docs/api/browser) o [`WebdriverIO. lement`](/docs/api/element) dependiendo de si el comando se adjunta al navegador o al ámbito del elemento.

Tipo: `String`

### Objetivo

Marque para decidir si desea adjuntar el comando al navegador o al ámbito del elemento. Si se establece a `true`, el comando será un comando de elemento.

Tipo: `String`<br /> Predeterminado: `localhost`

## Ejemplo

Este ejemplo muestra cómo agregar un nuevo comando que devuelve la URL actual y el título como resultado. El ámbito (`this`) es un objeto [`WebdriverIO.Browser`](/docs/api/browser).

```js
browser.addCommand('getUrlAndTitle', async function (customVar) {
    // `this` refers to the `browser` scope
    return {
        url: await this.getUrl(),
        title: await this.getTitle(),
        customVar: customVar
    }
})
```

Además, puede extender la instancia del elemento con su propio conjunto de comandos, pasando `true` como argumento final. El ámbito (`this`) es un objeto [`WebdriverIO.Browser`](/docs/api/element).

```js
browser.addCommand("waitAndClick", async function () {
    // `this` is return value of $(selector)
    await this.waitForDisplayed()
    await this.click()
}, true)
```

Los comandos personalizados le dan la oportunidad de agrupar una secuencia específica de comandos que se utilizan frecuentemente en una única llamada de comando. Puedes definir comandos personalizados en cualquier momento de tu suite de pruebas; tan solo asegúrese de que el comando está definido *antes de* su primer uso. ( `before` hook en tu `wdio.conf.js` es un buen lugar para crearlos.)

Una vez definido, puede utilizarlos de la siguiente manera:

```js
it('should use my custom command', async () => {
    await browser.url('http://www.github.com')
    const result = await browser.getUrlAndTitle('foobar')

    assert.strictEqual(result.url, 'https://github.com/')
    assert.strictEqual(result.title, 'GitHub · Where software is built')
    assert.strictEqual(result.customVar, 'foobar')
})
```

__Nota:__ Si registra un comando personalizado en el ámbito `browser`, el comando no será accesible para elementos. De la misma manera, si registras un comando en el ámbito del elemento, no será accesible en el ámbito del `browser`:

```js
browser.addCommand("myCustomBrowserCommand", () => { return 1 })
const elem = await $('body')
console.log(typeof browser.myCustomBrowserCommand) // outputs "function"
console.log(typeof elem.myCustomBrowserCommand()) // outputs "undefined"

browser.addCommand("myCustomElementCommand", () => { return 1 }, true)
const elem2 = await $('body')
console.log(typeof browser.myCustomElementCommand) // outputs "undefined"
console.log(await elem2.myCustomElementCommand('foobar')) // outputs "1"

const elem3 = await $('body')
elem3.addCommand("myCustomElementCommand2", () => { return 2 })
console.log(typeof browser.myCustomElementCommand2) // outputs "undefined"
console.log(await elem3.myCustomElementCommand2('foobar')) // outputs "2"
```

__Nota:__ Si necesitas encadenar un comando personalizado, el comando debe terminar con `$`,

```js
browser.addCommand("user$", (locator) => { return ele })
browser.addCommand("user$", (locator) => { return ele }, true)
await browser.user$('foo').user$('bar').click()
```

Tenga cuidado de no sobrecargar el ámbito del navegador `` con demasiados comandos personalizados.

Recomendamos definir lógica personalizada en [objetos de página](pageobjects), así que están vinculados a una página específica.

## Definiciones de Tipo de Contenido

Con TypeScript, es fácil ampliar las interfaces WebdriverIO. Añade tipos a tus comandos personalizados como este:

1. Crear un tipo de archivo de definición (por ejemplo, `./src/types/wdio.d.ts`)
2. a. Si se utiliza un archivo de definición de tipo de módulo (usando import/export y `declare global WebdriverIO` en el archivo de definición de tipo) asegúrese de incluir la ruta del archivo en la configuración `tsconfig. json` `include`property.

   b.  Si se usan archivos de definición de estilo ambiente (no importar/exportar en archivos de definición de tipo y `declarar el espacio de nombres WebdriverIO` para comandos personalizados), asegúrese de que el `tsconfig. son` *no* contenga ninguna sección `include`, ya que esto causará que todos los archivos de definición de tipo que no aparecen en la sección `include` no sean reconocidos por typescript.

<Tabs
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
 {label: 'Ambient Type Definitions (no tsconfig include)', value: 'ambient'},
 ]
}>
<TabItem value="modules">

```json title="tsconfig.json"
{
    "compilerOptions": { ... },
    "include": [
        "./test/**/*.ts",
        "./src/types/**/*.ts"
    ]
}
```

</TabItem>
<TabItem value="ambient">

```json title="tsconfig.json"
{
    "compilerOptions": { ... }
}
```

</TabItem>
</Tabs>

3. Añade definiciones para tus comandos de acuerdo con el modo de ejecución.

<Tabs
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
 {label: 'Ambient Type Definitions', value: 'ambient'},
 ]
}>
<TabItem value="modules">

```typescript
declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface MultiRemoteBrowser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface Element {
            elementCustomCommand: (arg: any) => Promise<number>
        }
    }
}
```

</TabItem>
<TabItem value="ambient">

```typescript
declare namespace WebdriverIO {
    interface Browser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface MultiRemoteBrowser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface Element {
        elementCustomCommand: (arg: any) => Promise<number>
    }
}
```

</TabItem>
</Tabs>

## Integrar bibliotecas de terceros

Si utiliza bibliotecas externas (por ejemplo, para hacer llamadas de base de datos) que soportan promesas, un enfoque para integrarlas fácilmente es envolver ciertos métodos API dentro de un comando personalizado.

Al devolver la promesa, WebdriverIO se asegura de que no continúe con el siguiente comando hasta que se resuelva la promesa. Si la promesa es rechazada, el comando arrojará un error.

```js
import got from 'got'

browser.addCommand('makeRequest', async (url) => {
    return got(url).json()
})
```

Luego, simplemente úsalo en tus especificaciones de prueba WDIO:

```js
it('execute external library in a sync way', async () => {
    await browser.url('...')
    const body = await browser.makeRequest('http://...')
    console.log(body) // returns response body
})
```

**Nota:** El resultado de su comando personalizado es el resultado de la promesa que regresas.

## Sobrescribir comandos

También puede sobreescribir comandos nativos con `overwriteCommand`.

No se recomienda hacer esto, ¡porque puede llevar a un comportamiento impredecible del framework!

El enfoque general es similar al `addCommand`, la única diferencia es que el primer argumento de la función de comando es la función original que está a punto de sobrescribir. Por favor vea algunos ejemplos a continuación.

### Sobrescribir comandos del navegador

```js
/**
 * print milliseconds before pause and return its value.
 */
// 'pause'            - name of command to be overwritten
// origPauseFunction  - original pause function
browser.overwriteCommand('pause', async (origPauseFunction, ms) => {
    console.log(`sleeping for ${ms}`)
    await origPauseFunction(ms)
    return ms
})

// then use it as before
console.log(`was sleeping for ${await browser.pause(1000)}`)
```

### Comandos de sobreescritura del elemento

La sobreescritura de comandos en el nivel de elementos es casi la misma. Simplemente pase `true` como tercer argumento a `overwriteCommand`:

```js
/**
 * Attempt to scroll to element if it is not clickable.
 * Pass { force: true } to click with JS even if element is not visible or clickable.
 */
// 'click'            - name of command to be overwritten
// origClickFunction  - original click function
browser.overwriteCommand('click', async function (origClickFunction, { force = false } = {}) {
    if (!force) {
        try {
            // attempt to click
            await origClickFunction()
            return null
        } catch (err) {
            if (err.message.includes('not clickable at point')) {
                console.warn('WARN: Element', this.selector, 'is not clickable.',
                    'Scrolling to it before clicking again.')

                // scroll to element and click again
                await this.scrollIntoView()
                return origClickFunction()
            }
            throw err
        }
    }

    // clicking with js
    console.warn('WARN: Using force click for', this.selector)
    await browser.execute((el) => {
        el.click()
    }, this)
}, true) // don't forget to pass `true` as 3rd argument

// then use it as before
const elem = await $('body')
await elem.click()

// or pass params
await elem.click({ force: true })
```

## Agregar más comandos WebDriver

Si está utilizando el protocolo WebDriver y ejecuta pruebas en una plataforma que soporta comandos adicionales no definidos por cualquiera de las definiciones de protocolo en [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) puede añadirlos manualmente a través de la interfaz `addCommand`. El paquete `webdriver` ofrece un contenedor de comandos que permite registrar estos nuevos endpoints de la misma manera que otros comandos, proporcionando la misma comprobación de parámetros y manejo de errores. Para registrar este nuevo endpoint importar el comando envoltorio y registrar un nuevo comando con él de la siguiente manera:

```js
import { command } from 'webdriver'

browser.addCommand('myNewCommand', command('POST', '/session/:sessionId/foobar/:someId', {
    command: 'myNewCommand',
    description: 'a new WebDriver command',
    ref: 'https://vendor.com/commands/#myNewCommand',
    variables: [{
        name: 'someId',
        description: 'some id to something'
    }],
    parameters: [{
        name: 'foo',
        type: 'string',
        description: 'a valid parameter',
        required: true
    }]
}))
```

Llamar a este comando con parámetros no válidos resulta en la misma gestión de errores que los comandos de protocolo predefinidos, por ejemplo.:

```js
// call command without required url parameter and payload
await browser.myNewCommand()

/**
 * results in the following error:
 * Error: Wrong parameters applied for myNewCommand
 * Usage: myNewCommand(someId, foo)
 *
 * Property Description:
 *   "someId" (string): some id to something
 *   "foo" (string): a valid parameter
 *
 * For more info see https://my-api.com
 *    at Browser.protocolCommand (...)
 *    ...
 */
```

Llamando el comando correctamente, p. ej., `browser.myNewCommand('foo', 'bar')`, realiza correctamente una solicitud de WebDriver a p.e. `http://localhost:4444/session/7bae3c4c55c3bf82f54894ddc83c5f31/foobar/foo` con una carga como `{ foo: 'bar' }`.

:::note
El parámetro de url `:sessionId` será sustituido automáticamente por el id de sesión de la sesión WebDriver sesión. Se puede aplicar otro parámetro de url, pero debe definirse dentro de `variables`.
:::

Vea ejemplos de cómo se pueden definir comandos de protocolo en el paquete [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols).
