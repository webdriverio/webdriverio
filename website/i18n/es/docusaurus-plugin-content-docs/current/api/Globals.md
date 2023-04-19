---
id: globals
title: Globales
---

En sus archivos de prueba, WebdriverIO coloca cada uno de estos métodos y objetos en el entorno global. No tiene que importar nada para utilizarlos. Sin embargo, si prefiere importaciones expresas, puede hacer `import { browser, $, $$, expect } de '@wdio/globals'` y establecer `injectGlobals: false` en su configuración de WDIO.

Los siguientes objetos globales son fijados si no se configuran de otra manera:

- `browser`: WebdriverIO [Objeto navegador](https://webdriver.io/docs/api/browser)
- `driver`: alias de `browser` (se utiliza al ejecutar pruebas móviles)
- `multiremotebrowser`: alias de `browser` o `driver` pero sólo se establece para sesiones [Multiremote](/docs/multiremote)
- `$`: comando para obtener un elemento (ver más en [API docs](/docs/api/browser/$))
- `$$`: comando para obtener elementos (ver más en [API docs](/docs/api/browser/$$))
- `expect`: marco de aserción para WebdriverIO (consulte [API docs](/docs/api/expect-webdriverio))

__Nota:__ WebdriverIO no tiene control sobre los marcos de trabajo utilizados (por ejemplo, Mocha o Jasmine) que establecen variables globales al arrancar su entorno.
