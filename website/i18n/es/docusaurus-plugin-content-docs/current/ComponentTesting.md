---
id: component-testing
title: Prueba de Componentes
---

Con WebdriverIOs [Navegador Runner](/docs/runner#browser-runner) puede ejecutar pruebas dentro de un navegador de escritorio o móvil real mientras utiliza WebdriverIO y el protocolo WebDriver para automatizar e interactuar lo que se procesa en la página Este enfoque tiene [muchas ventajas](/docs/runner#browser-runner) en comparación con otros frameworks de prueba que sólo permiten probar contra [JSDOM](https://www.npmjs.com/package/jsdom). Este enfoque tiene [muchas ventajas](/docs/runner#browser-runner) en comparación con otros frameworks de prueba que sólo permiten probar contra [JSDOM](https://www.npmjs.com/package/jsdom).

## ¿Cómo funciona?

El navegador Runner utiliza [Vite](https://vitejs.dev/) para renderizar una página de prueba e inicializar un framework de pruebas para ejecutar sus pruebas en el navegador. Actualmente solo soporta Mocha, pero Jasmine y Cucumber están [en el mapa de ruta](https://github.com/orgs/webdriverio/projects/1). Esto permite probar cualquier tipo de componentes, incluso para proyectos que no usan Vite.

El servidor Vite es iniciado por el WebdriverIO testrunner y configurado para que pueda utilizar todos los reporteros y servicios como solía para las pruebas e2e normales. Además, inicializa una instancia de [`navegador`](/docs/api/browser) que le permite acceder a un subconjunto de la [API WebdriverIO](/docs/api) para interactuar con los elementos de la página. Similar a las pruebas e2e puede acceder a esa instancia a través de la variable `browser` conectada al ámbito global o importándola desde `@wdio/globals` dependiendo de cómo [`injectGlobals`](/docs/api/globals) se establezca.

WebdriverIO has built-in support for the following frameworks:

- [__Nuxt__](https://nuxt.com/): WebdriverIO's testrunner detects a Nuxt application and automatically sets up your project composables and helps mock out the Nuxt backend, read more in the [Nuxt docs](/docs/component-testing/vue#testing-vue-components-in-nuxt)
- [__TailwindCSS__](https://tailwindcss.com/): WebdriverIO's testrunner detects if you are using TailwindCSS and loads the environment properly into the test page

## Configuración

Para configurar WebdriverIO para pruebas unitarias o de componentes en el navegador, inicie un nuevo proyecto WebdriverIO a través de:

```bash
npm init wdio@latest ./
# or
yarn create wdio ./
```

Una vez que el asistente de configuración inicia, elija `navegador` para ejecutar pruebas unitarias y componentes y elija uno de los preajustes si lo desea ir con _"Otro"_ si sólo quiere ejecutar pruebas unitarias básicas. También puede configurar un Vite personalizado si utiliza Vite ya en su proyecto. Para más información, revise todas las [opciones de runners](/docs/runner#runner-options).

:::info

__Nota:__ WebdriverIO por defecto ejecutará las pruebas del navegador en CI remoto, p. ej. una variable de entorno `CI` está establecida a `'1'` o `'true'`. Puede configurar manualmente este comportamiento usando la opción [`remota`](/docs/runner#headless) para el ejecutor.

:::

Al final de este proceso debe encontrar un `wdio.conf.js` que contiene varias configuraciones WebdriverIO, incluyendo una `propiedad del runner` , p.ej.:

```ts reference useHTTPS runmeRepository="git@github.com:webdriverio/example-recipes.git" runmeFileToOpen="component-testing%2FREADME.md"
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/wdio.comp.conf.js
```

Definiendo diferentes [capacidades](/docs/configuration#capabilities) puede ejecutar sus pruebas en un navegador diferente, en paralelo si lo desea.

## Arnés de prueba

Depende totalmente de usted lo que quiera ejecutar en sus pruebas y cómo le guste renderizar los componentes. Sin embargo, recomendamos usar la [Biblioteca de Pruebas](https://testing-library.com/) como framework de utilidad ya que proporciona plugins para varios frameworks de componentes, como React, Preact, Svelte o Vue. Es muy útil para renderizar componentes en la página de prueba y limpia automáticamente estos componentes después de cada prueba.

Puede mezclar primitivos de la Biblioteca de Pruebas con comandos WebdriverIO como quiera, por ejemplo:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/component-testing/svelte-example.js
```

__Nota:__ Utilizar métodos de renderizado de la Biblioteca de Pruebas ayuda a eliminar componentes creados entre las pruebas. Si no usa Testing Library, asegúrese de conectar sus componentes de prueba a un contenedor que se limpia entre pruebas.

## Guiones de configuración

Puede configurar sus pruebas ejecutando scripts arbitrarios en Node.js o en el navegador, por ejemplo, inyectando estilos, burlándose de las API del navegador o conectándose a un servicio de terceros. WebdriverIO [hooks](/docs/configuration#hooks) se puede usar para ejecutar código en Node.js, mientras que [`mochaOpts.require`](/docs/frameworks#require) le permite importar scripts al navegador antes de que se carguen las pruebas, por ejemplo:

```js wdio.conf.js
export const config = {
    // ...
    mochaOpts: {
        ui: 'tdd',
        // provide a setup script to run in the browser
        require: './__fixtures__/setup.js'
    },
    before: () => {
        // set up test environment in Node.js
    }
    // ...
}
```

Por ejemplo, si desea simular todas las llamadas [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) en su prueba con el siguiente script de configuración:

```js ./fixtures/setup.js
import { fn } from '@wdio/browser-runner'

// run code before all tests are loaded
window.fetch = fn()

export const mochaGlobalSetup = () => {
    // run code after test file is loaded
}

export const mochaGlobalTeardown = () => {
    // run code after spec file was executed
}

```

Ahora en sus pruebas puede proporcionar valores de respuesta personalizados para todas las solicitudes del navegador. Lea más sobre accesorios globales en los documentos de [Mocha](https://mochajs.org/#global-fixtures).

## Ver los archivos de prueba y aplicación

Hay múltiples formas de depurar las pruebas de su navegador. La más fácil es iniciar el testrunner WebdriverIO con el indicador `--watch` , por ejemplo:

```sh
$ npx wdio run ./wdio.conf.js --watch
```

Esto se llevará a cabo a través de todas las pruebas inicialmente y se detendrá una vez que se ejecuten todos. A continuación, puede hacer cambios a archivos individuales que luego se ejecutarán de forma individual. Si configura un [`filesToWatch`](/docs/configuration#filestowatch) apuntando a los archivos de su aplicación, se ejecutarán de nuevo todas las pruebas cuando se realicen cambios en tu aplicación.

## Depuración (Debug)

Aunque (todavía) no es posible establecer puntos de interrupción en su IDE y que sean reconocidos por el navegador remoto, puedes usar el comando [`debug`](/docs/api/browser/debug) para detener la prueba en cualquier punto. Esto le permite abrir DevTools para luego depurar la prueba mediante la configuración de puntos de interrupción en la pestaña [fuentes](https://buddy.works/tutorials/debugging-javascript-efficiently-with-chrome-devtools).

Cuando se llama al comando `debug` , también obtendrá una interfaz repl de Node.js en su terminal, diciendo:

```
The execution has stopped!
You can now go into the browser or use the command line as REPL
(To exit, press ^C again or type .exit)
```

Pulsa `Ctrl` o `Comando` + `c` o entra `.exit` para continuar con la prueba.

## Ejemplos:

Puede encontrar varios ejemplos de componentes de prueba utilizando frameworks de componentes populares en nuestro [repositorio de ejemplo](https://github.com/webdriverio/component-testing-examples).
