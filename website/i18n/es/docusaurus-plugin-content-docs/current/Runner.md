---
id: runner
title: Nodo
---

import CodeBlock from '@theme/CodeBlock';

Un corredor en WebdriverIO orchestrates cómo y dónde se están ejecutando las pruebas cuando se utiliza el testrunner. WebdriverIO soporta actualmente dos tipos diferentes de ejecutores: local y corredor del navegador.

## Ejecutador local

El [Runner Local](https://www.npmjs.com/package/@wdio/local-runner) inicia su framework (p. ej. Mocha, Jasmine o Cucumber) dentro del worker un proceso y ejecuta todos sus archivos de prueba dentro de su entorno Node.js. Cada archivo de prueba está siendo ejecutado en un proceso de trabajo separado por cada capacidad permitiendo la máxima concurrencia. Cada proceso de worker utiliza una única instancia del navegador y, por lo tanto, ejecuta su propia sesión de navegador permitiendo el máximo aislamiento.

Dado que cada prueba se ejecuta en su propio proceso aislado, no es posible compartir datos a través de archivos de prueba. Hay dos maneras de trabajar en torno a esto:

- use [`@wdio/shared-store-service`](https://www.npmjs.com/package/@wdio/shared-store-service) para compartir datos a través de todos los trabajadores
- archivos de especificaciones de grupo (lea más en [Organización de prueba](https://webdriver.io/docs/organizingsuites#grouping-test-specs-to-run-sequentially))

Si nada más se define en el `wdio.conf.js`, el Ejecutador Local es el runner predeterminado en WebdriverIO.

### Instalación

Para utilizar el Ejecutador Local puedes instalarlo a través de:

```sh
npm install --save-dev @wdio/local-runner
```

### Configuración

El Runner Local es el runner predeterminado en WebdriverIO, así que no hay necesidad de definirlo dentro de su `wdio.conf.js`. Si desea establecerlo explícitamente, puede definirlo de la siguiente manera:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'local',
    // ...
}
```

## Ejecutador del navegador

A diferencia del [ejecutador local](https://www.npmjs.com/package/@wdio/local-runner) el [ejecutador navegador](https://www.npmjs.com/package/@wdio/browser-runner) inicia y ejecuta el framework dentro del navegador. Esto le permite ejecutar pruebas unitarias o pruebas de componentes en un navegador real en lugar de en un JSDOM como muchos otros frameworks de pruebas.

Mientras que [JSDOM](https://www.npmjs.com/package/jsdom) es ampliamente utilizado para fines de prueba, al final no es un navegador real ni puedes emular entornos móviles con él. Con este runner WebdriverIO le permite ejecutar fácilmente sus pruebas en el navegador y utilizar comandos WebDriver para interactuar con elementos renderizados en la página.

Aquí hay un resumen de las pruebas en ejecución en JSDOM vs. WebdriverIOs Browser Runner

|    | JSDOM                                                                                                                                                                     | Ejecutador Navegador WebdriverIO                                                                         |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1. | Ejecuta tus pruebas dentro de Node.js utilizando una nueva implementación de estándares web, en particular los estándares WHATWG DOM y HTML Standards                     | Ejecuta tu prueba en un navegador real y ejecuta el código en un entorno que tus usuarios utilizan       |
| 2. | Las interacciones con los componentes sólo se pueden imitar a través de JavaScript                                                                                        | Puede utilizar la [API WebdriverIO](api) para interactuar con elementos a través del protocolo WebDriver |
| 3. | El soporte para lienzo requiere [dependencias adicionales](https://www.npmjs.com/package/canvas) y [tiene limitaciones](https://github.com/Automattic/node-canvas/issues) | Tienes acceso al [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) real          |
| 4. | JSDOM tiene algunas [advertencias](https://github.com/jsdom/jsdom#caveats) y API web no soportadas                                                                        | Todas las API Web son soportadas como pruebas ejecutadas en un navegador actual                          |
| 5. | Imposible de detectar errores a través del navegador                                                                                                                      | Soporte para todos los navegadores, incluyendo navegador móvil                                           |
| 6. | No se puede ____ probar los pseudoestados del elemento                                                                                                                    | Soporte para pseudoestados como `:hover` o `:active`                                                     |

Este corredor utiliza [Vite](https://vitejs.dev/) para compilar su código de prueba y cargarlo en el navegador. Viene con preajustes para los siguientes frameworks:

- React
- Preact
- Vue.js
- Svelte
- SolidJS

Cada archivo de prueba / grupo de archivos de prueba se ejecuta dentro de una sola página, lo que significa que entre cada prueba la página se está recargando para garantizar el aislamiento entre pruebas.

### Instalación

Para utilizar el Ejecutador del Navegador puede instalarlo a través de:

```sh
npm install --save-dev @wdio/browser-runner
```

### Configuración

Para usar el corredor del navegador, debe definir una propiedad `corredor` dentro de su archivo `wdio.conf.js`, por ejemplo.:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'browser',
    // ...
}
```

### Opciones de Ejecutador

El corredor del navegador permite las siguientes configuraciones:

#### `preset`

Si prueba componentes usando uno de los frameworks mencionados arriba, puede definir un preset que asegura que todo está configurado de nuevo. Esta opción no se puede usar junto con `viteConfig`.

__Type:__ `vue` | `svelte` | `solid` | `react` | `preact`<br /> __Example:__

```js title="wdio.conf.js"
export const {
    // ...
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
}
```

#### `viteConfig`

Defina su propia configuración de [Vite](https://vitejs.dev/config/). Puede pasar un objeto personalizado o importar un archivo `vite.conf.ts` existente si utiliza Vite.js para el desarrollo. Tenga en cuenta que WebdriverIO mantiene configuraciones personalizadas de Vite para configurar el arnés de prueba.

__Type:__ `string` or [`UserConfig`](https://github.com/vitejs/vite/blob/52e64eb43287d241f3fd547c332e16bd9e301e95/packages/vite/src/node/config.ts#L119-L272) or `(env: ConfigEnv) => UserConfig | Promise<UserConfig>`<br /> __Example:__

```js title="wdio.conf.ts"
import viteConfig from '../vite.config.ts'

export const {
    // ...
    runner: ['browser', { viteConfig }],
    // or just:
    runner: ['browser', { viteConfig: '../vites.config.ts' }],
    // or use a function if your vite config contains a lot of plugins
    // which you only want to resolve when value is read
    runner: ['browser', {
        viteConfig: () => ({
            // ...
        })
    }],
    // ...
}
```

#### `headless`

Si se establece en `verdadero` el corredor actualizará las capacidades para ejecutar pruebas sin encabezado. Por defecto, esto está habilitado dentro de entornos CI donde una variable de entorno `CI` se establece en `'1'` o `'true'`.

__Type:__ `boolean`<br /> __Default:__ `false`, set to `true` if `CI` environment variable is set

#### `rootDir`

Directorio raíz del proyecto.

__Type:__ `string`<br /> __Default:__ `process.cwd()`

#### `coverage`

WebdriverIO soporta reportes de cobertura de prueba a través de [`istanbul`](https://istanbul.js.org/). Consulte [Opciones de cobertura](#coverage-options) para más detalles.

__Type:__ `object`<br /> __Default:__ `undefined`

### Opciones de cobertura

Las siguientes opciones permiten configurar el reporte de cobertura.

#### `enabled`

Permite recolección de cobertura.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `include`

Lista de archivos incluidos en la cobertura como patrones glob.

__Type:__ `string[]`<br /> __Default:__ `[**]`

#### `exclude`

Lista de archivos excluidos en cobertura como patrones glob.

__Type:__ `string[]`<br /> __Default:__

```
[
  'coverage/**',
  'dist/**',
  'packages/*/test{,s}/**',
  '**/*.d.ts',
  'cypress/**',
  'test{,s}/**',
  'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
  '**/__tests__/**',
  '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
  '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
]
```

#### `extension`

Lista de extensiones de archivo que el reporte debe incluir.

__Type:__ `string | string[]`<br /> __Default:__ `['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte']`

#### `reportsDirectory`

Directorio en el que escribir el informe de cobertura.

__Type:__ `string`<br /> __Default:__ `./coverage`

#### `reporter`

Cobertura de reporteros a utilizar. Vea la documentación de [istanbul](https://istanbul.js.org/docs/advanced/alternative-reporters/) para una lista detallada de todos los reporteros.

__Type:__ `string[]`<br /> __Default:__ `['text', 'html', 'clover', 'json-summary']`

#### `perFile`

Comprobar umbrales por archivo. Ver `líneas`, `funciones`, `ramas` y `sentencias` para los umbrales reales.

__Type:__ `boolean`<br /> __Default:__ `false`

#### `clean`

Resultados de cobertura limpia antes de ejecutar las pruebas.

__Type:__ `boolean`<br /> __Default:__ `true`

#### `lines`

Umbral para líneas.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `functions`

Umbral para funciones.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `branches`

Umbral para líneas.

__Type:__ `number`<br /> __Default:__ `undefined`

#### `statements`

Umbral para declaraciones.

__Type:__ `number`<br /> __Default:__ `undefined`

### Limitaciones

Al usar el corredor del navegador WebdriverIO, es importante tener en cuenta que el hilo que bloquea diálogos como `alerta` o `confirmar` no se puede usar de forma nativa. Esto se debe a que bloquean la página web, lo que significa que WebdriverIO no puede continuar comunicándose con la página, causando que la ejecución se cuelgue.

En tales situaciones, WebdriverIO proporciona simulaciones por defecto con valores devueltos por defecto para estas APIs. Esto asegura que si el usuario utiliza accidentalmente APIs web emergentes sincrónicas, la ejecución no se colgaría. Sin embargo, todavía es recomendable que el usuario simule estas API web para una mejor experiencia. Leer más en [Mocking](/docs/component-testing/mocking).

### Ejemplos

Asegúrese de consultar los documentos sobre [pruebas de componentes](https://webdriver.io/docs/component-testing) y eche un vistazo al repositorio de [ejemplos](https://github.com/webdriverio/component-testing-examples) para ver ejemplos que usan estos y otros marcos.

