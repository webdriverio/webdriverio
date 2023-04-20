---
id: v6-migration
title: De v5 a v6
---

Este tutorial es para personas que todavía están usando `v5` de WebdriverIO y quieren migrar a `v6` o a la última versión de WebdriverIO. Como se mencionó en nuestra [publicación del blog](https://webdriver.io/blog/2020/03/26/webdriverio-v6-released) los cambios para esta actualización de versión pueden resumirse de la siguiente manera:

- consolidamos los parámetros para algunos comandos (p. ej. `nueva Ventana`, `react$`, `react$$`, `esperar a`, `dragAndDrop`, `moveTo`, `waitForDisplayed`, `waitForEnabled`, `waitForExist`) y movió todos los parámetros opcionales a un solo objeto, p. ej.

    ```js
    // v5
    browser.newWindow(
        'https://webdriver.io',
        'WebdriverIO window',
        'width=420,height=230,resizable,scrollbars=yes,status=1'
    )
    // v6
    browser.newWindow('https://webdriver.io', {
        windowName: 'WebdriverIO window',
        windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1'
    })
    ```

- configuraciones para servicios movidos a la lista de servicios, p. ej.

    ```js
    // v5
    exports.config = {
        services: ['sauce'],
        sauceConnect: true,
        sauceConnectOpts: { foo: 'bar' },
    }
    // v6
    exports.config = {
        services: [['sauce', {
            sauceConnect: true,
            sauceConnectOpts: { foo: 'bar' }
        }]],
    }
    ```

- algunas opciones de servicio fueron renombradas para propósitos de simplificación
- renombramos el comando `launchApp` a `launchChromeApp` para sesiones de Chrome WebDriver

:::info

Si está utilizando WebdriverIO `v4` o menos, por favor actualice a `v5` primero.

:::

Si bien nos encantaría tener un proceso completamente automatizado para esto, la realidad es diferente. Todos tienen una configuración diferente. Cada paso debe ser visto como guía y menos como una instrucción paso a paso. Si tienes problemas con la migración, no dudes en [contactarnos](https://github.com/webdriverio/codemod/discussions/new).

## Configuración

Similar a otras migraciones que podemos usar el código [WebdriverIO](https://github.com/webdriverio/codemod). Para instalar el códemod, ejecute:

```sh
npm install jscodeshift @wdio/codemod
```

## Actualizar dependencias de WebdriverIO

Dado que todas las versiones WebdriverIO están ajustadas entre sí, es lo mejor para siempre actualizar a una etiqueta específica, e.. `6.12.0`. Si decide actualizar de `v5` directamente a `v7` puede dejar fuera la etiqueta e instalar las últimas versiones de todos los paquetes. Para ello, copiamos todas las dependencias relacionadas con WebdriverIO de nuestro `package.json` y las reinstalamos a través de:

```sh
npm i --save-dev @wdio/allure-reporter@6 @wdio/cli@6 @wdio/cucumber-framework@6 @wdio/local-runner@6 @wdio/spec-reporter@6 @wdio/sync@6 wdio-chromedriver-service@6 webdriverio@6
```

Por lo general, las dependencias WebdriverIO son parte de las dependencias de desarrollo, dependiendo de su proyecto, esto puede variar de todas maneras. Después de esto, su `package.json` y `package-lock.json` deberían ser actualizados. __Nota:__ estas son dependencias de ejemplo, las suyas pueden diferir. Asegúrese de encontrar la última versión v6 llamando, por ejemplo.:

```sh
npm show webdriverio versions
```

Intente instalar la última versión 6 disponible para todos los paquetes del núcleo WebdriverIO. Para los paquetes comunitarios esto puede diferir de un paquete a otro. Aquí recomendamos comprobar el registro de cambios para obtener información sobre qué versión es compatible con v6.

## Transformar Archivo de Configuración

Un buen primer paso es iniciar con el archivo de configuración. Todos los cambios de ruptura pueden resolverse utilizando el código completo automáticamente:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./wdio.conf.js
```

:::caution

El código todavía no soporta proyectos de TypeScript. Ver [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10). Estamos trabajando para poner en práctica pronto el apoyo para ello. Si está utilizando TypeScript ¡aproveche la oportunidad!

:::

## Actualizar archivos de Spec y objetos de página

Para actualizar todos los cambios de comandos, ejecute el codemod en todos sus archivos e2e que contienen comandos WebdriverIO, por ejemplo.:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./e2e/*
```

Eso es todo! No hay más cambios necesarios 🎉

## Conclusión

Esperamos que este tutorial le guíe un poco a través del proceso de migración a WebdriverIO `v6`. Recomendamos encarecidamente continuar actualizando a la última versión, dado que actualizar a `v7` es trivial debido a casi ningún cambio de ruptura. Por favor, compruebe la guía de migración [para actualizar a v7](v7-migration).

La comunidad continúa mejorando el canon mientras lo prueba con varios equipos en diversas organizaciones. No dudes en [plantear un problema](https://github.com/webdriverio/codemod/issues/new) si tienes comentarios o [empieza una discusión](https://github.com/webdriverio/codemod/discussions/new) si luchas durante el proceso de migración.
