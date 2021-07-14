---
id: observador
title: Observa los Archivos de Pruebas
---

Con el testrunner de WDIO, puedes monitorear los archivos mientras trabajabas en ellos. Se ejecutan automáticamente ante cambios en la app o en los archivos de pruebas. Agregando la opción `--watch` all llamar al comando `wdio`, el testrunner va a monitorear el archivo en busca de cambios luego de que todos los tests son ejecutados. Por ejemplo.

```sh
$ wdio wdio.conf.js --watch
```

Por defecto, solo monitorea cambio en tus archivos `specs`. Sin embargo al setear la propiedad `filesToWatch` en tu archivo `wdio.conf.js` el cual contiene la lista de las rutas a los archivos (globbing soportado). También observará esos archivos en busca de cambios y re-ejecutara la suite completa. Esto es útil si deseas que tus tests sean ejecutados automáticamente, ante cualquier cambio en el código de tu app. Por ejemplo.

```js
// wdio.conf.js
export.config = {
    // ...
    filesToWatch: [
        // Monitorear todos los archivos JS en mí app
        './src/app/**/*.js'
    ],
    // ...
}
```

**Nota:** asegúrese de ejecutar la mayor cantidad de tests en paralelo como le sea posible. Los test E2E son por naturaleza lentos y re-ejecutarlos es útil únicamente si puedes mantener el tiempo total de ejecución lo suficientemente corto. Para ahorrar tiempo el testrunner mantiene las sesiones de WebDriver activas mientras se monitorea cualquier cambio en los archivos. Asegúrese que el backend de WebDriver puede ser modificado para que la sesión no sea cerrada automáticamente, luego de cierto tiempo sin que ningún comando haya sido ejecutado.