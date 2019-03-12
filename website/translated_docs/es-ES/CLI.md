---
id: clioptions
title: Opciones de CLI de WDIO
---
WebdriverIO viene con su propio 'testrunner' para ayudarle a comenzar con las pruebas de integración lo antes posible. Todo el trasteo alrededor de utilizar WebdriverIO con un marco de pruebas pertenece al pasado. El corredor WebdriverIO hace todo el trabajo para usted y le ayuda a ejecutar sus pruebas de la forma más eficiente posible.

A partir de v5 de WebdriverIO el testrunner será incluido como un paquete aparte en NPM: `@wdio/cli`. Para ver la ayuda del CLI solo escriba el siguiente comando en su terminal:

```sh
$ npm install @wdio/cli
$ ./node_modules/.bin/wdio --help

WebdriverIO CLI runner

Usage: wdio [options] [configFile]
Usage: wdio config
Usage: wdio repl <browserName>

config file defaults to wdio.conf.js
The [options] object will override values from the config file.
An optional list of spec files can be piped to wdio that will override
configured specs

Commands:
  wdio.js repl <browserName>  Run WebDriver session in command line

Options:
  --help                prints WebdriverIO help menu                   [boolean]
  --version             prints WebdriverIO version                     [boolean]
  --host, -h            automation driver host address                  [string]
  --port, -p            automation driver port                          [number]
  --user, -u            username if using a cloud service as automation backend
                                                                        [string]
  --key, -k             corresponding access key to the user            [string]
  --watch               watch specs for changes                        [boolean]
  --logLevel, -l        level of logging verbosity
                            [choices: "trace", "debug", "info", "warn", "error"]
  --bail                stop test runner after specific amount of tests have
                        failed                                          [number]
  --baseUrl             shorten url command calls by setting a base url [string]
  --waitforTimeout, -w  timeout for all waitForXXX commands             [number]
  --framework, -f       defines the framework (Mocha, Jasmine or Cucumber) to
                        run the specs                                   [string]
  --reporters, -r       reporters to print out the results on stdout     [array]
  --suite               overwrites the specs attribute and runs the defined
                        suite                                            [array]
  --spec                run only a certain spec file - overrides specs piped
                        from stdin                                       [array]
  --exclude             exclude spec file(s) from a run - overrides specs piped
                        from stdin                                       [array]
  --mochaOpts           Mocha options
  --jasmineOpts         Jasmine options
  --cucumberOpts        Cucumber options
```

¡Genial! Ahora necesita definir un archivo de configuración donde se establece toda la información sobre sus pruebas, capacidades y ajustes. Cambia a la sección [Archivo de configuración](ConfigurationFile.md) para averiguar cómo debe aparecer ese archivo. Con el asistente de configuración de `wdio` es fácil generar su archivo de configuración. Basta con ejecutar:

```sh
$ ./node_modules/.bin/wdio config
```

y lanza la utilidad de ayuda. Le hará preguntas dependiendo de las respuestas que dé. De esta manera puede generar su archivo de configuración en menos de un minuto.

![WDIO configuration utility](/img/config-utility.gif)

Una vez que tenga su configuración de archivo listo, puede iniciar sus pruebas de integración llamando:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

¡Eso es todo! Ahora, puedes acceder a la instancia de Selenium a través de la variable global `browser`.

## Ejectuar el 'testrunner' programaticamente

Instead of calling the wdio command you can also include the test runner as module and run in within any arbitrary environment. For that you need to require the `@wdio/cli` package as module the following way:

```js
import Launcher from '@wdio/cli';
```

After that you create an instance of the launcher and run the test. The Launcher class expects as parameter the url to the config file and parameters that will overwrite the value in the config.

```js
const wdio = new Launcher('/path/to/my/wdio.conf.js', opts);
wdio.run().then((code) => {
    process.exit(code);
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace);
    process.exit(1);
});
```

The run command returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that gets resolved if the test ran successful or failed or gets rejected if the launcher was not able to start run the tests.