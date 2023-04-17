---
id: debugging
title: Depuración (Debug)
---

La depuración es significativamente más difícil cuando varios procesos generan docenas de pruebas en varios navegadores.

<iframe width="560" height="315" src="https://www.youtube.com/embed/_bw_VWn5IzU" frameborder="0" allowFullScreen></iframe>

Para empezar, es muy útil limitar el paralelismo estableciendo `maxInstances` a `1`, y sólo apuntar a aquellas especificaciones y navegadores que necesitan ser depurados.

En `wdio.conf`:

```js
export const config = {
    // ...
    maxInstances: 1,
    specs: [
        '**/myspec.spec.js'
    ],
    capabilities: [{
        browserName: 'firefox'
    }],
    // ...
}
```

## Comando Debug

En muchos casos, puede utilizar [`browser.debug()`](/docs/api/browser/debug) para pausar su prueba e inspeccionar el navegador.

La interfaz de línea de comandos también cambiará al modo REPL. Este modo te permite acercarte con comandos y elementos en la página. En modo REPL, puedes acceder al objeto `navegador`&mdash;o `$` y `$$` funciones&mdash;como puedes en tus pruebas.

Al usar el navegador `. ebug()`, es probable que necesite aumentar el tiempo de espera del corredor de pruebas para evitar que el corredor de pruebas falle la prueba durante un largo tiempo.  Ejemplo:

In `wdio.conf`:

```js
jasmineOpts: {
    defaultTimeoutInterval: (24 * 60 * 60 * 1000)
}
```

Vea [tiempos de espera](Timeouts.md) para más información sobre cómo hacer eso utilizando otros frameworks.

Para continuar con las pruebas después de la depuración, en el intérprete de comandos, utilice el acceso directo `^C` o el comando `.exit`.
## Configuración dinámica

Tenga en cuenta que `wdio.conf.js` puede contener Javascript. Dado que probablemente no desea cambiar permanentemente su valor de tiempo de espera a 1 día, puede ser útil cambiar estos ajustes desde la línea de comandos usando una variable de entorno.

Utilizando esta técnica, puede cambiar dinámicamente la configuración:

```js
const debug = process.env.DEBUG
const defaultCapabilities = ...
const defaultTimeoutInterval = ...
const defaultSpecs = ...

export const config = {
    // ...
    maxInstances: debug ? 1 : 100,
    capabilities: debug ? [{ browserName: 'chrome' }] : defaultCapabilities,
    execArgv: debug ? ['--inspect'] : [],
    jasmineOpts: {
      defaultTimeoutInterval: debug ? (24 * 60 * 60 * 1000) : defaultTimeoutInterval
    }
    // ...
}
```

A continuación, puede prefijar el comando `wdio` con la bandera `debug`:

```
$ DEBUG=true npx wdio wdio.conf.js --spec ./tests/e2e/myspec.test.js
```

...y depurar tu archivo de especificaciones con las DevTools!

## Depurando con Visual Studio Code (VSCode)

Si desea depurar sus pruebas con puntos de interrupción en el último VSCode, tienes que instalar y habilitar la [versión nightly del debugger JavaScript](https://marketplace.visualstudio.com/items?itemName=ms-vscode.js-debug-nightly).

> de acuerdo a https://github.com/microsoft/vscode/issues/82523#issuecomment-609934308, esto sólo es necesario para windows y linux. mac os x está funcionando sin la versión nocturna.

Información adicional: https://code.visualstudio.com/docs/nodejs/nodejs-debugging

Es posible ejecutar todo o especificaciones seleccionadas. Las configuraciones de depuración tienen que ser añadidas a `.vscode/launch.json`, para depurar las especificaciones seleccionadas, añadir la siguiente configuración:
```
{
    "name": "run select spec",
    "type": "node",
    "request": "launch",
    "args": ["wdio.conf.js", "--spec", "${file}"],
    "cwd": "${workspaceFolder}",
    "autoAttachChildProcesses": true,
    "program": "${workspaceRoot}/node_modules/@wdio/cli/bin/wdio.js",
    "console": "integratedTerminal",
    "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "${workspaceFolder}/lib/**/*.js",
        "<node_internals>/**/*.js"
    ]
},
```

Para ejecutar todos los archivos de especificaciones, elimina `"--spec", "${file}"` de `"args"`

Ejemplo: [.vscode/launch.json](https://github.com/mgrybyk/webdriverio-devtools/blob/master/.vscode/launch.json)

## Repl Dinámico con Atom

Si eres un hacker [Atom](https://atom.io/) puedes probar [`wdio-repl`](https://github.com/kurtharriger/wdio-repl) por [@kurtharriger](https://github.com/kurtharriger) que es un repl dinámico que te permite ejecutar líneas de código único en Atom. Mira [este](https://www.youtube.com/watch?v=kdM05ChhLQE) vídeo de YouTube para ver una demo.

## Depuración con WebStorm / Intellij
Puede crear un node.js configuración de depuración así: ![Screenshot from 2021-05-29 17-33-33](https://user-images.githubusercontent.com/18728354/120088460-81844c00-c0a5-11eb-916b-50f21c8472a8.png) Mira este [YouTube Video](https://www.youtube.com/watch?v=Qcqnmle6Wu8) para más información sobre cómo hacer una configuración.
