---
id: watcher
title: Ver archivos de prueba
---

Con el testrunner de WDIO, puedes monitorear los archivos mientras trabajabas en ellos. Se vuelven a ejecutar automáticamente si cambia algo en su aplicación o en sus archivos de prueba. Añadiendo una bandera `--watch` cuando se llame al comando `wdio` el testrunner esperará los cambios de archivo después de que ejecute todas las pruebas, p.ej.

```sh
wdio wdio.conf.js --watch
```

Por defecto, sólo observa cambios en sus `especificaciones` archivos. Sin embargo, configurando una propiedad `filesToWatch` en tu `wdio.conf. s` que contiene una lista de rutas de archivos (soportado por globping), también observará que estos ficheros se cambien para volver a ejecutar la suite completa. Esto es útil si desea volver a ejecutar automáticamente todas sus pruebas si ha cambiado el código de su aplicación, p.ej.

```js
// wdio.conf.js
export const config = {
    // ...
    filesToWatch: [
        // watch for all JS files in my app
        './src/app/**/*.js'
    ],
    // ...
}
```

:::info
Trate de ejecutar pruebas en paralelo lo más posible Las pruebas de E2E son, por naturaleza, lentas. Las pruebas de E2E son, por naturaleza, lentas. Volver a ejecutar pruebas sólo es útil si se puede mantener el tiempo de ejecución individual corto. Con el fin de ahorrar tiempo, el testrunner mantiene vivas las sesiones WebDriver mientras espera cambios en el archivo. Asegúrese de que su backend WebDriver puede ser modificado para que no cierre automáticamente la sesión si no se ejecutó ningún comando después de algún tiempo.
:::
