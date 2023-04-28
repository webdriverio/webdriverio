---
id: v7-migration
title: De v5 a v6
---

Este tutorial es para personas que todavía están usando `v6` de WebdriverIO y quieren migrar a `v7`. Como se mencionó en nuestra publicación del blog [](https://webdriver.io/blog/2021/02/09/webdriverio-v7-released) los cambios están principalmente bajo la capa y la actualización debe ser un proceso de avance simple.

:::info

Si está utilizando WebdriverIO `v4` o menos, por favor actualice a `v5` primero. Consulte nuestra guía de migración [v6](v6-migration).

:::

Si bien nos encantaría tener un proceso completamente automatizado para esto, la realidad es diferente. Todos tienen una configuración diferente. Cada paso debe ser visto como guía y menos como una instrucción paso a paso. Si tienes problemas con la migración, no dudes en [contactarnos](https://github.com/webdriverio/codemod/discussions/new).

## Setup

Similar a otras migraciones que podemos usar el código [WebdriverIO](https://github.com/webdriverio/codemod). Para este tutorial utilizamos un [proyecto de boilerplate](https://github.com/WarleyGabriel/demo-webdriverio-cucumber) enviado por un miembro de la comunidad y completamente migrado de `v6` a `v7`.

Para instalar el códemod, ejecute:

```sh
npm install jscodeshift @wdio/codemod
```

#### Commits:

- _install codemod deps_ [[6ec9e52]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/6ec9e52038f7e8cb1221753b67040b0f23a8f61a)

## Actualizar dependencias de WebdriverIO

Dado que todas las versiones WebdriverIO están ajustadas entre sí, es lo mejor para siempre actualizar a una etiqueta específica, e.. Para ello, copiamos todas las dependencias relacionadas con WebdriverIO de nuestro `package.json` y las reinstalamos a través de:

```sh
npm i --save-dev @wdio/allure-reporter@7 @wdio/cli@7 @wdio/cucumber-framework@7 @wdio/local-runner@7 @wdio/spec-reporter@7 @wdio/sync@7 wdio-chromedriver-service@7 wdio-timeline-reporter@7 webdriverio@7
```

Por lo general, las dependencias WebdriverIO son parte de las dependencias de desarrollo, dependiendo de su proyecto, esto puede variar de todas maneras. Después de esto, su `package.json` y `package-lock.json` deberían ser actualizados. __Nota:__ estas son las dependencias utilizadas por el [proyecto de ejemplo](https://github.com/WarleyGabriel/demo-webdriverio-cucumber), el suyo puede diferir.

#### Commits:

- _dependencias actualizadas_ [[7097ab6]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/7097ab6297ef9f37ead0a9c2ce9fce8d0765458d)

## Transformar Archivo de Configuración

Un buen primer paso es iniciar con el archivo de configuración. En WebdriverIO `v7` ya no necesitamos registrar manualmente ninguno de los compiladores. De hecho, es necesario eliminarlos. Esto se puede hacer con el código completo automáticamente:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./wdio.conf.js
```

:::caution

El código todavía no soporta proyectos de TypeScript. Ver [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10). Estamos trabajando para poner en práctica pronto el apoyo para ello. Si está utilizando TypeScript ¡aproveche la oportunidad!

:::

#### Commits:

- _archivo de configuración de transpile_ [[6015534]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/60155346a386380d8a77ae6d1107483043a43994)

## Actualizar definiciones de pasos

Si está usando Jasmine o Mocha, aquí está listo. El último paso es actualizar las importaciones de Cucumber.js de `pepino` a `@cumber/pepino`. Esto se puede hacer con el código completo automáticamente:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./src/e2e/*
```

¡Eso es todo! No hay más cambios necesarios 🎉

#### Commits:

- _transpila definiciones de pasos_ [[8c97b90]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/8c97b90a8b9197c62dffe4e2954f7dad814753cc)

## Conclusión

Esperamos que este tutorial le guíe un poco a través del proceso de migración a WebdriverIO `v6`. La comunidad continúa mejorando el canon mientras lo prueba con varios equipos en diversas organizaciones. No dudes en [plantear un problema](https://github.com/webdriverio/codemod/issues/new) si tienes comentarios o [empieza una discusión](https://github.com/webdriverio/codemod/discussions/new) si luchas durante el proceso de migración.
