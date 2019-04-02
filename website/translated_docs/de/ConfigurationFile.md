---
id: configurationfile
title: Testrunner Konfiguration
---
Die Konfigurationsdatei enthält alle notwendigen Informationen, um Ihre Testsuite auszuführen. Es ist ein einfaches Node.js Modul, welches ein JSON Objekt exportiert. Hier ist eine Beispielkonfiguration mit allen unterstützten Eigenschaften und zusätzlichen Informationen:

```js
exports.config = {

    // ====================
    // Server Konfiguration
    // ====================
    // Host Adresse des laufenden Browser Drivers. Diese Informationen sind nur dann wichtig, wenn
    // sich mit einem Driver verbinden wollen, der nicht auf Ihrem System läuft. Wenn Sie unterstützte Cloud Dienste,
    // wie z.B. Sauce Labs, Browserstack oder Testingbot, nutzen ist es ebenfalls nicht nötig die
    // Adresse dieser Dienste anzugeben, da WebdriverIO dies anhand ihres Access Keys herausfinden
    // kann. Wenn Sie allerdings Ihr eigenes Selenium Grid betreuen, ist es von Nöten, die Adresse
    // vom Grid anzugeben.
    //
    host: '0.0.0.0',
    port: 4444,
    path: '/wd/hub',
    //
    // =================
    // Service Providers
    // =================
    // WebdriverIO unterstützt Sauce Labs, Browserstack und Testing Bot (andere Cloud Dienste können
    // ebenfalls genutzt werden, benötigen allerdings weiter Einstellungen. Diese Dienste erfordern eine
    // Autorisierung über ein User Namen und Key (Access Key), um sich mit diesen zu verbinden.
    //
    user: 'webdriverio',
    key:  'xxxxxxxxxxxxxxxx-xxxxxx-xxxxx-xxxxxxxxx',
    //
    // Wenn Sie Ihre Tests auf der Sauce Labs Platform ausführen, können Sie auch die Region des
    // Datencenters angeben, wo der Test ausgeführt werden soll. Verfügbar sind die folgenden Regionen:
    // us: us-west-1 (default)
    // eu: eu-central-1
    region: 'us',
    //
    // ========================
    // Test Datei Spezifikation
    // ========================
    //  Die Dateien können relativ vom Ordner spezifiziert werden, von dem der WDIO Befehl ausgeführt
    // wird. Beachten Sie, wenn Sie den `wdio` Befehl uüber einem NPM-Skript aufrufen (siehe
    // https://docs.npmjs.com/cli/run-script), dann liegt das aktuelle Arbeitsverzeichnis
    // dort, wo auch die package.json liegt.
    //
    specs: [
        'test/spec/***'
    ],
    // Muster zum Ausschließen.
    exclude: [
        'test/spec/multibrowser/**',
        'test/spec/mobile/**'
    ],
    //
    // ============
    // Capabilities
    // ============
    // Definieren Sie Ihre Browser Spezifikationen hier. WebdriverIO kann mehrer Browser zur
    // selber Zeit testen. Abhängig von der Anzahl der spezifizierten Browser started WebdriverIO
    // mehrere Test Sessions zur selben Zeit. Innerhalb der Browser Spezifikation (Capabilities)
    // können bestimmte Optionen, wie z.B. "specs", "exclude" oder host, überschreiben, um so
    // nur bestimmte Test mit bestimmten Browsern zu testen.
    //
    //
    // Sie können ebenfalls festlegen, wie viele Browser Instanzen gleichzeitig gestartet werden
    // sollen. Angenommen Sie definieren 3 verschiedene Browser (Chrome, Firefox und Safari)
    // und setzen die maxInstances Option auf 1, so wird WebdriverIO 3 Sessions gleichzeitig
    // starten. Wenn Sie nun 10 Test Dateien in Ihrer Suite haben, so werden insgesamt 30 Tests
    // parallel gestartet werden. Die maxInstances Einstellung regelt daher, wie viele Tests
    // insgesamt gleichzeitig laufen sollen.
    //
    maxInstances: 10,
    //
    // Oder setzen Sie ein Limit für die maximale Anzahl von spezifischen Browsern:
    maxInstancesPerCapability: 10,
    //
    // Wenn Sie nicht wissen, wie die einzelnen Werte, die den Browser spezifizieren, zusammen
    // gesetzt werden, besuchen Sie den Sauce Labs Platform Konfigurator:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: [{
        browserName: 'chrome',
        chromeOptions: {
        // um Chrome im Headless Mode laufen zu lassen, fügen Sie diese Optionen hinzu:
        // (siehe auch https://developers.google.com/web/updates/2017/04/headless-chrome)
        // args: ['--headless', '--disable-gpu'],
        }
    }, {
        // maxInstances kann auf für einen bestimmten Browser spezifiziert werden Wenn Sie ein
        // Selenium Grid benutzen und dieses z.B. nur maximal 5 Firefox Browser registriert hat,
        // können Sie so festlegen, dass nicht mehr als 5 Firefox Browser gleichzeitig laufen.
        maxInstances: 5,
        browserName: 'firefox',
        specs: [
            'test/ffOnly/*'
        ],
        "moz:firefoxOptions": {
          // Option, um Firefox im Headless Mode zu starten
          // (siehe auch https://github.com/mozilla/geckodriver/blob/master/README.md#firefox-capabilities for more details about moz:firefoxOptions)
          // args: ['-headless']
        }
    }],
    //
    // Zusätzliche Node.JS Ausführungs Optionen, die dem Sub-Prozess übergeben werden
    execArgv: [],
    //
    // ====================
    // Test Konfigurationen
    // ====================
    // Definieren Sie hier alle Optionen, die relevant für das Ausführen von WebdriverIO ist.
    //
    // Level der Anzahl und Geschwätzigkeit der Log Nachrichten: trace | debug | info | warn | error
    logLevel: 'info',
    //
    // Wenn Sie die Tests ab einer bestimmen Anzahl von Fehlern beenden wollen, nutzen Sie
    // bail (Standardwert ist 0 - bedeutet: nicht vorzeitig beenden und alle Tests ausführen).
    bail: 0,
    //
    // Setzen Sie hier die Basis URL für alle "url" Befehle. Sobald Ihr "url" Parameter mit "/"
    // beginnt, fügt WebdriverIO die Basis URL an.
    // Wenn der `url` Parameter ohne Schema oder mit `/` (wie `some/path`) beginnt, wird die Basisurl
    // direkt vorangestellt.
    baseUrl: 'http://localhost:8080',
    //
    // Standardwert für den Timeout von allen waitForXXX Befehlen.
    waitforTimeout: 1000,
    //
    // Fügen Sie hier Dateien hinzu, die Sie zusätzlich beobachten wollen, wenn Sie das Watch
    // Feature von WebdriverIO über den `--watch` Parameter benuzten.
    filesToWatch: [
        // e.g. wiederholen Sie all Tests, wenn ich mein Applikationscode ändere
        // './app/**/*.js'
    ],
    //
    // Framework in dem Sie die Tests laufen lassen wollen.
    // Die folgenden Frameworks sind unterstützt: mocha und jasmine
    // sehen Sie auch: http://webdriver.io/docs/frameworks.html
    //
    // Vergewissern Sie sich, dass Sie das zusätzliche Framework Package installiert haben bevor
    // Sie die tests starten.
    framework: 'mocha',
    //
    // The only one supported by default is 'dot'
    // see also: http://webdriver.io/docs/dot-reporter.html and click on "Reporters" in left column
    reporters: [
        'dot',
        ['allure', {
            //
            // If you are using the "allure" reporter you should define the directory where
            // WebdriverIO should save all allure reports.
            outputDir: './'
        }]
    ],
    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd'
    },
    //
    // Options to be passed to Jasmine.
    // See also: https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-jasmine-framework#jasminenodeopts-options
    jasmineNodeOpts: {
        //
        // Jasmine default timeout
        defaultTimeoutInterval: 5000,
        //
        // The Jasmine framework allows it to intercept each assertion in order to log the state of the application
        // or website depending on the result. For example it is pretty handy to take a screenshot every time
        // an assertion fails.
        expectationResultHandler: function(passed, assertion) {
            // do something
        },
        //
        // Make use of Jasmine-specific grep functionality
        grep: null,
        invertGrep: null
    },
    //
    // If you are using Cucumber you need to specify where your step definitions are located.
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