---
id: testrunner
title: Testrunner
---

WebdriverIO viene con su propio corredor de pruebas para ayudarle a empezar a probar tan pronto como sea posible. Se supone que hacer todo el trabajo por usted, permite integrarse a servicios de terceros, y le ayuda a ejecutar sus pruebas de la manera más eficiente posible.

El testrunner de WebdriverIO está recopilado por separado en el paquete NPM `@wdio/cli`.

Instalar de esta manera:

```sh npm2yarn
npm install @wdio/cli
```

Para ver la ayuda de la interfaz de línea de comandos, escriba el siguiente comando en su terminal:

```sh
$ npx wdio --help

wdio <command>

Commands:
  wdio config                           Initialize WebdriverIO and setup configuration in
                                        your current project.
  wdio install <type> <name>            Add a `reporter`, `service`, or `framework` to
                                        your WebdriverIO project
  wdio repl <option> [capabilities]     Run WebDriver session in command line
  wdio run <configPath>                 Run your WDIO configuration file to initialize
                                        your tests.

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

¡Excelente! ¡Excelente! Ahora necesita definir un archivo de configuración donde se establezca toda la información sobre sus pruebas, capacidades y configuraciones. Cambie a la sección [Archivo de configuración](ConfigurationFile.md) para ver cómo debería ser ese archivo.

Con el helper de configuración de `wdio`, es muy fácil de generar el archivo de configuración. Sólo ejecutar:

```sh
$ npx wdio config
```

...y lanza la utilidad auxiliar.

Le hará preguntas y generará un archivo de configuración en menos de un minuto.

![Herramienta de configuración WDIO](/img/config-utility.gif)

Una vez que tenga el archivo de configuración configurado, puede iniciar sus pruebas ejecutando:

```sh
npx wdio run wdio.conf.js
```

También puede inicializar su ejecución de prueba sin el comando `run`:

```sh
npx wdio wdio.conf.js
```

¡Eso es todo! Ahora, puede acceder a la instancia de selenium a través de la variable global `browser`.

## Comandos

### `wdio config`

El comando `config` ejecuta el helper de configuración de WebdriverIO. Este ayudante le hará algunas preguntas sobre su proyecto WebdriverIO y creará un archivo `wdio.conf.js` basado en sus respuestas.

Ejemplo:

```sh
wdio config
```

Opciones:

```
--help            prints WebdriverIO help menu                                [boolean]
--npm             Wether to install the packages using NPM instead of yarn    [boolean]
```

### `wdio run`

> Este es el comando por defecto para ejecutar su configuración.

El comando `run` inicializa su archivo de configuración WebdriverIO y ejecuta sus pruebas.

Ejemplo:

```sh
wdio run ./wdio.conf.js --watch
```

Opciones:

```
--help                prints WebdriverIO help menu                   [boolean]
--version             prints WebdriverIO version                     [boolean]
--hostname, -h        automation driver host address                  [string]
--port, -p            automation driver port                          [number]
--user, -u            username if using a cloud service as automation backend
                                                                        [string]
--key, -k             corresponding access key to the user            [string]
--watch               watch specs for changes                        [boolean]
--logLevel, -l        level of logging verbosity
                            [choices: "trace", "debug", "info", "warn", "error", "silent"]
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
--multi-run           Run one or more specs x amount of times            [number]
--mochaOpts           Mocha options
--jasmineOpts         Jasmine options
--cucumberOpts        Cucumber options
```

> Nota: La autocompilación puede ser fácilmente controlada con las Varias ENV de la biblioteca apropiada. Vea también la funcionalidad de Compilación Automática de Test Runner documentada en las páginas [TypeScript (ts-node)](TypeScript.md) y [Babel (@babel/register)](Babel.md).

### `wdio install`
El comando `instalar` le permite añadir reporteros y servicios a sus proyectos WebdriverIO a través de la CLI.

Ejemplo:

```sh
wdio install service sauce # installs @wdio/sauce-service
wdio install reporter dot # installs @wdio/dot-reporter
wdio install framework mocha # installs @wdio/mocha-framework
```

Si desea instalar los paquetes usando `yarn` en su lugar, puede pasar la bandera `--yarn` al comando:

```sh
wdio install service sauce --yarn
```

También puede pasar una ruta de configuración personalizada si su archivo de configuración WDIO no está en la misma carpeta en la que está trabajando:

```sh
wdio install service sauce --config="./path/to/wdio.conf.js"
```

#### Lista de servicios compatibles

```
sauce
testingbot
firefox-profile
selenium-standalone
devtools
browserstack
appium
chromedriver
intercept
zafira-listener
reportportal
docker
wiremock
lambdatest
```

#### Lista de reporteros compatibles

```
dot
spec
junit
allure
sumologic
concise
reportportal
video
html
json
mochawesome
timeline
```

#### Lista de frameworks compatibles

```
mocha
jasmine
cucumber
```

### `wdio repl`

El comando repl permite iniciar una interfaz de línea de comandos interactiva para ejecutar comandos WebdriverIO. Se puede utilizar para pruebas o simplemente para girar rápidamente la sesión WebdriverIO.

Ejecutar pruebas en chrome:

```sh
wdio repl chrome
```

o ejecute pruebas en Sauce Labs:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

Puede aplicar los mismos argumentos que puede en el comando [ejecutar](#wdio-run).
