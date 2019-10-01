---
id: configurationfile
title: Configuración de Testrunner
---

El archivo de configuración contiene toda la información necesaria para ejecutar su suite de pruebas. Es un módulo de Node que exporta un JSON. Aquí hay una configuración de ejemplo con todas las propiedades soportadas e información adicional:

```js
exports.config = {

    // =====================
    // Configuraciones del servidor
    // =====================
    // Dirección del servidor que corre Selenium. Esta información usualmente no se necesita 
    // ya que WebdriverIO se conecta automaticamente al localhost. También si usas uno de
    / soportan servicios de nube como salsa Labs, Browserstack o Bot prueba también no
    / / necesario para definir información de host y puerto porque puede WebdriverIO figura que fuera
    / / según la información de su usuario y clave. Sin embargo, si está usando un Selenium privado
    // backend debe definir la dirección de host, puerto y ruta aquí.
    //
    host: '0.0.0.0',
    port: 4444,
    path: '/wd/hub',
    //
    // =================
    // Proveedores de Servicios
    // =================
    // WebdriverIO soporta Sauce Labs, Browserstack y Testing Bot (otros proveedores Cloud
    // también deberían funcionar). Estos servicios definen usuario y clave específicos (o clave de acceso)
    // Cuyos valores se necesitan especificar aquí para conectarse a estos servicios.
    //
    user: 'webdriverio',
    key:  'xxxxxxxxxxxxxxxx-xxxxxx-xxxxx-xxxxxxxxx',
    //
    // Si ejecutas tus pruebas en SauceLabs puedes especificar la región que quieres ejecutar tus pruebas
    // en la propiedad `region`. Las abreviaturas para regiones disponibles son:
    // us: us-west-1 (default)
    // eu: eu-central-1
    region: 'us',
    //
    // ==================
    // Especifica los Archivos de Pruebas
    // ==================
    // Define cuales specs de pruebas deben ejecutarse. El patrón es relativo al directorio
    // desde donde se llamó a `wdio`. Notese que, si está llamando `wdio` desde un script
    // NPM (vea https://docs.npmjs.com/cli/run-script) entonces el actual directorio
    // de trabajo es donde reside su package.json, así que `wdio` será llamado desde allí.
    //
    specs: [
        'test/spec/**'
    ],
    // Patrones a excluir.
    exclude: [
        'test/spec/multibrowser/**',
        'test/spec/mobile/**'
    ],
    //
    // ============
    // Capacidades
    // ============
    // Defina las capacidades aqui. WebdriverIO puede ejecutar múltiples capacidades al mismo
    // tiempo. Dependiendo del número de capacidades, WebdriverIO lanza varias sesiones de
    // pruebas. Dentro de sus capacidades puede sobreescribir la especificación y excluir la opción 
    // para agrupar  determinados Specs a una capacidad específica.
    //
    //
    // Primero puede definir cuántas instancias deben iniciarse al mismo tiempo. Digamos que
    // tienes 3 capacidades diferentes (Chrome, Firefox y Safari) y tienes
    // set maxInstances  en 1, wdio generará 3 procesos. De este modo, si tienes 10 archivos
    // spec y configuras maxInstances a 10, todos los archivos spec se probarán al mismo tiempo
    // y 30 procesos serán generados. La propiedad básicamente maneja cuántas capacidades
    // de la misma prueba deberían ejecutarse.
    //
    maxInstances: 10,
    //
    // O establezca un límite para ejecutar pruebas con una capacidad específica.
    maxInstancesPerCapability: 10,
    //
    // Si tienes problemas para hacer funcionar las capacidades más importantes, revisa 
    // Sauce Labs platform configurator - un excelente utilidad para configurar las capacidades:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: [{
        browserName: 'chrome',
        chromeOptions: {
        // para ejecutar Chrome en modo headless las siguientes banderas son necesarias
        // (visita https://developers.google.com/web/updates/2017/04/headless-chrome)
        // args: ['--headless', '--disable-gpu'],
        }
    }, {
        // maxInstances se puede sobreescribir por cada capacidad definida. Así que si tienes una solucion Selenium Grid
        // con soporte para sólo 5 instancias de firefox disponible, puedes asegurarte de que no más de
        // 5 instancias se inician a la vez.
        maxInstances: 5,
        browserName: 'firefox',
        specs: [
            'test/ffOnly/*'
        ],
        "moz:firefoxOptions": {
          // Bandera para activar  Firefox en modo headless (visita https://github.com/mozilla/geckodriver/blob/master/README.md#firefox-capabilities para más información sobre  moz:firefoxOptions)
          // args: ['-headless']
        }
    }],
    //
    // Lista adicional de argumentos node a usar cuando se inician los procesos hijos
    execArgv: [],
    //
    // =======================
    // Configuraciones de Pruebas
    // =======================
    // Define todas las opciones relevantes para la instancia de WebDriverIO aqui
    //
    // Nivel de verbosidad de los logs: trace | debug | info | warn | error
    logLevel: 'info',
    //
    // Si unicamente quieres ejecutar tus pruebas hasta que cierta cantidad de ellas falle, usa
    // bail(salir) ( (el valor por defecto es 0 - por ende todos los tests seran ejecutados).
    bail: 0,
    //
    // Establecer una URL base para acortar llamadas de comandos de url. Si el parámetro `url` comienza
    // con `/`, la url base se antepondrá, no incluyendo la porción de ruta de tu urlBase.
    // Si el parámetro `url` comienza sin un esquema o `/` (como `alguna/ruta`), la url base
    // se antepondrá directamente.
    baseUrl: 'http://localhost:8080',
    //
    // Tiempo de espera predeterminado para todos los comandos waitForXXX.
    waitforTimeout: 1000,
    //
    // Puedes añadir archivos para que sean monitoreados (por ejemplo, código de aplicación o objetos de página) al ejecutar el comando `wdio`
    // con la bandera `--watch` (globbing es compatible).
    filesToWatch: [
        // ej. re-ejecutar pruebas si cambio mi código de aplicación
        // './app/**/*.js'
    ],
    //
    // Framework con el que quieres ejecutar tus especificaciones(specs).
    // Los siguientes son soportados: mocha, jasmine y cucumber
    // ver también: http://webdriver.io/docs/frameworks.html
    //
    // Asegúrese de que tiene el paquete adaptador wdio para el framework específico instalado antes de ejecutar cualquier prueba.
    framework: 'mocha',
    //
    // Reportador de pruebas para stdout.
    // El único soportado por defecto es 'dot'
    // ver también: http://webdriver.io/docs/dot-reporter.html y haga clic en "Reporters" en la columna izquierda
    reporters: [
        'dot',
        ['allure', {
            //
            // Si está usando el reportero "Allure" debe definir el directorio donde
            // WebdriverIO debe guardar todos los informes de Allure.
            outputDir: './'
        }]
    ],
    //
    // Opciones a pasar a Mocha.
    // Ver la lista completa en http://mochajs.org/
    mochaOpts: {
        ui: 'bdd'
    },
    //
    // Opciones a pasar a Jasmine.
    // Vea también: https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-jasmine-framework#jasminenodeopts-options
    jasmineNodeOpts: {
        //
        // Tiempo de espera por default para Jasmine 
        defaultTimeoutInterval: 5000,
        //
        // El Framework Jasmine permite interceptar cada comprobación(assertion) para poder obtener logs  
        // del estado de la aplicación o website dependiendo del resultado de la misma. Por ejemplo, es muy práctico tomar una captura de pantalla cada vez que
        // falla una comprobación.
        expectationResultHandler: function(passed, assertion) {
            // hacer algo
        },
        //
        // Usa la funcionalidad específica de Jasmine para grep
        grep: null,
        invertGrep: null
    },
    //
    // Si estas usando Cucumber necesitas especificar donde estan ubicados tus definiciones de pasos.
    // See also: https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-cucumber-framework#cucumberopts-options
    cucumberOpts: {
        require: [],        // <string[]> (file/dir) require files before executing features
        backtrace: false,   // <boolean> show full backtrace for errors
        compiler: [],       // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
        dryRun: false,      // <boolean> invoke formatters without executing steps
        failFast: false,    // <boolean> abort the run on first failure
        format: ['pretty'], // <string[]> (type[:path]) specify the output format, optionally supply PATH to redirect formatter output (repeatable)
        colors: true,       // <boolean> disable colors in formatter output
        snippets: true,     // <boolean> hide step definition snippets for pending steps
        source: true,       // <boolean> hide source URIs
        profile: [],        // <string[]> (name) specify the profile to use
        strict: false,      // <boolean> fail if there are any undefined or pending steps
        tags: [],           // <string[]> (expression) only execute the features or scenarios with tags matching the expression
        timeout: 20000,      // <number> timeout for step definitions
        ignoreUndefinedDefinitions: false, // <boolean> Enable this config to treat undefined definitions as warnings.
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides a several hooks you can use to interfere the test process in order to enhance
    // it and build services around it. You can either apply a single function to it or an array of
    // methods. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    //

    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    onPrepare: function (config, capabilities) {
    },
    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    beforeSession: function (config, capabilities, specs) {
    },
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    before: function (capabilities, specs) {
    },
    /**
     * Hook that gets executed before the suite starts
     * @param {Object} suite suite details
     */
    beforeSuite: function (suite) {
    },
    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha)
     */
    beforeHook: function () {
    },
    /**
     * Hook that gets executed _after_ a hook within the suite ends (e.g. runs after calling
     * afterEach in Mocha)
     */
    afterHook: function () {
    },
    /**
     * Function to be executed before a test (in Mocha/Jasmine) or a step (in Cucumber) starts.
     * @param {Object} test test details
     */
    beforeTest: function (test) {
    },
    /**
     * Runs before a WebdriverIO command gets executed.
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     */
    beforeCommand: function (commandName, args) {
    },
    /**
     * Runs after a WebdriverIO command gets executed
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     * @param {Number} result 0 - command success, 1 - command error
     * @param {Object} error error object if any
     */
    afterCommand: function (commandName, args, result, error) {
    },
    /**
     * Function to be executed after a test (in Mocha/Jasmine) or a step (in Cucumber) ends.
     * @param {Object} test test details
     */
    afterTest: function (test) {
    },
    /**
     * Hook that gets executed after the suite has ended
     * @param {Object} suite suite details
     */
    afterSuite: function (suite) {
    },
    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param {Number} result 0 - test pass, 1 - test fail
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    after: function (result, capabilities, specs) {
    },
    /**
     * Gets executed right after terminating the webdriver session.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    afterSession: function (config, capabilities, specs) {
    },
    /**
     * Gets executed after all workers got shut down and the process is about to exit.
     * @param {Object} exitCode 0 - success, 1 - fail
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {<Object>} results object containing test results
     */
    onComplete: function (exitCode, config, capabilities, results) {
    },
    /**
    * Gets executed when an error happens, good place to take a screenshot
    * @ {String} error message
    */
    onError: function(message) {
    }
    /**
     * Cucumber specific hooks
     */
    beforeFeature: function (feature) {
    },
    beforeScenario: function (scenario) {
    },
    beforeStep: function (step) {
    },
    afterStep: function (stepResult) {
    },
    afterScenario: function (scenario) {
    },
    afterFeature: function (feature) {
    }
};
```

You can also find that file with all possible options and variations in the [example folder](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js).