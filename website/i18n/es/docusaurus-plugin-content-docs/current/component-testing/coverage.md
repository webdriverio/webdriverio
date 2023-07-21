---
id: coverage
title: Cobertura
---

El corredor de navegador de WebdriverIO soporta informes de cobertura de código usando [`istanbul`](https://istanbul.js.org/). El testrunner automáticamente instrumentará su código y la cobertura de código para usted.

## Configuración

Para habilitar el reporte de cobertura de código, habilítelo a través de la configuración del gestor del navegador WebdriverIO, por ejemplo.:

```js title=wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: process.env.WDIO_PRESET,
        coverage: {
            enabled: true
        }
    }],
    // ...
}
```

Compruebe todas las [opciones de cobertura](/docs/runner#coverage-options), para aprender a configurarlo correctamente.

## Ignorando Código

Puede haber algunas secciones de su código base que desea excluir intencionalmente del seguimiento de la cobertura, para poder utilizar las siguientes sugerencias de análisis:

- `/* istanbul ignore if */`: ignorar la siguiente sentencia.
- `/* istanbul ignore else */`: ignore la otra porción de una sentencia si.
- `/* istanbul ignore next */`: ignorar lo siguiente en el código fuente ( funciones, si declaraciones, clases, lo nombras).
- `/* istanbul ignore file */`: ignorar un archivo fuente completo (esto debería colocarse en la parte superior del archivo).

:::info

Se recomienda excluir sus archivos de prueba del reporte de cobertura ya que podría causar errores.. al llamar a `ejecutar comandos` o `executeAsync`. Si quiere mantenerlos en su informe, asegúrese de que los excluyan a través de:

```ts
await browser.execute(/* istanbul ignore next */() => {
    // ...
})
```

:::
