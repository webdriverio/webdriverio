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
    // =============
    // Test Reporter
    // =============
    // WebdriverIO bietet verschiedenste Reporter an, die es Ihnen ermöglicht Informationen über
    // Tests einzusehen. Reporter können folgendermaßen definiert werden:
    reporters: [
        'dot',
        ['allure', {
            //
            // Wenn Sie den Allure Reporter verwenden, sollten Sie den Ordner definieren, wo alle
            // Testreports abgelegt werden sollen.
            outputDir: './'
        }]
    ],
    //
    // Optionen die dem Mocha Framework übergeben werden.
    // Sie finden die komplette Liste von möglichen Optionen auf http://mochajs.org/
    mochaOpts: {
        ui: 'bdd'
    },
    //
    // Optionen, die dem Jasmine Framework übergeben werden.
    // Die ganze Liste mit Optionen finden Sie auf: https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-jasmine-framework#jasminenodeopts-options
    jasmineNodeOpts: {
        //
        // Standard Timeout für Jasmine Tests
        defaultTimeoutInterval: 5000,
        //
        // Das Jasmine Framework erlaubt es jede Test Assertion abzufangen und dessen Ergebnis
        // beliebig zu verändern. Zum Beispiel ist es ziemlich praktisch, jedes Mal einen
        // Screenshot zu nehmen, wenn eine Behauptung fehlschlägt.
        expectationResultHandler: function(passed, assertion) {
            // nehme einen Screenshort, wenn die Behauptung falsch ist (passed === false)
        },
        //
        // Nutze die Jasmine spezifische filter Funktion
        grep: null,
        invertGrep: null
    },
    //
    // WebdriverIO unterstützt derzeit noch nicht das Cucumber Framework. Daran wird allerdings
    // gearbeitet und steht Ihnen bald zur Verfügung. Für dieses Framework stehen Ihnen dann
    // die folgenden Optionen zu Verfügung:
    // Sehen Sie auch: https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-cucumber-framework#cucumberopts-options
    cucumberOpts: {
        require: [],        // <string[]> (file/dir) Dateien vor der Ausführung von Feature Test ausführen
        backtrace: false,   // <boolean> den ganzen Backtrace der Fehler zeigen
        compiler: [],       // <string[]> ("extension:module") lädt eine Datei gegeben seiner Dateiendung
        dryRun: false,      // <boolean> Ausführung von "formatters" ohne die Steps ausgeführt zu haben
        failFast: false,    // <boolean> Abbrechen der Tests nach dem ersten Fehler
        colors: true,       // <boolean> Anzeige von Farben
        snippets: true,     // <boolean> Zeige keine Schrittdefinition von ausstehenden Schritten an
        source: true,       // <boolean> Datei Pfade URIs anzeigen
        profile: [],        // <string[]> (name) Spezifikation des Test Profils
        strict: false,      // <boolean> Schlag fehl, sobald ein Schritt nicht definiert ist oder austehend ist
        timeout: 20000,      // <number> Timeout für Schritt Definierung
        ignoreUndefinedDefinitions: false, // <boolean> Aktivieren Sie diese Option, wenn Sie nicht definierte Definitionen nur als Warnungen anzeigen wollen
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO ermöglicht es verschiedene Hooks zu nutzen, um in den Testausführungsprozess
    // einzugreifen und verschiedenste Add-Ons bereitzustellen. Sie können entweder eine einzelne
    // oder eine List von Funktionen ausführen. Sobald eine der Funktionen ein Promise zurückgibt,
    // wird WebdriverIO mit der Ausführung des Tests warten, bis dieses aufgelöst wird.
    //

    /**
     * Wird ausgeführt bevor alle Sub-Prozesse gestartet werden
     * @param {Object} config wdio Konfigurations Objekt
     * @param {Array.<Object>} capabilities Liste der definierten Browser
     */
    onPrepare: function (config, capabilities) {
    },
    /**
     * Wird ausgeführt, bevor der Browser gestartet wird. Es ermöglicht, die Browser Definition
     * nochmal dynamisch zu variieren.
     * @param {Object} config wdio Konfigurations Objekt
     * @param {Array.<Object>} capabilities Liste der definierten Browser
     * @param {Array.<String>} specs Liste der Test-Dateien
     */
    beforeSession: function (config, capabilities, specs) {
    },
    /**
     * Wird ausgeführt bevor der Test gestartet wird. Hier haben Sie bereits Zugriff auf die
     * globalen Variablen, die im Test ebenfalls zur Verfügung stehen (z.B. `browser`). Es
     * ist eine geeignete Stelle, benutzerdefinierte Befehle zu definieren.
     * @param {Array.<Object>} capabilities Liste der definierten Browser
     * @param {Array.<String>} specs Liste der Test-Dateien
     */
    before: function (capabilities, specs) {
    },
    /**
     * Wird ausgeführt bevor die Test Suite gestartet wird.
     * @param {Object} suite Suite Eigenschaften
     */
    beforeSuite: function (suite) {
    },
    /**
     * Wird ausgeführt bevor eine Hook im Test ausgeführt wird (z.B. wird ausgeführt vor der
     * "beforeEach" Hook in Mocha)
     */
    beforeHook: function () {
    },
    /**
     * @param {Object} test Test Eigenschaften
     */
    beforeTest: function (test) {
    },
    /**
     * Wird ausgeführt bevor ein Befehl in WebdriverIO ausgeführt wird.
     * @param {String} commandName Name des Befehls
     * @param {Array} args Argumente, die der Befehl erhalten hat
     */
    beforeCommand: function (commandName, args) {
    },
    /**
     * Wird ausgeführt, nachdem ein Befehl in WebdriverIO ausgeführt wurde.
     * @param {String} commandName Name des Befehls
     * @param {Array} args Argumente, die der Befehl erhalten hat
     * @param {Number} result 0 - Befehl war erfolgreich, 1 - Befehl hatte einen Fehler
     * @param {Object} error Fehler Objekt (falls existierend)
     */
    afterCommand: function (commandName, args, result, error) {
    },
    /**
     * Wird ausgeführt nachdem ein Test (in Mocha/Jasmine) oder ein Schritt (in Cucumber) ausgeführt wurde.
     * @param {Object} test Test Eigenschaften
     */
    afterTest: function (test) {
    },
    /**
     * Wird ausgeführt, sobald eine Test Suite ausgeführt wurde
     * @param {Object} suite Suite Eigenschaften
     */
    afterSuite: function (suite) {
    },
    /**
     * Wird ausgeführt, sobald alle Tests ausgeführt wurden. Hier haben Sie immernoch Zugriff auf
     * die Browser Instanz.
     * @param {Number} result 0 - test pass, 1 - test fail
     * @param {Array.<Object>} capabilities Liste der definierten Browser
     * @param {Array.<String>} specs Liste der Test Dateien
     */
    after: function (result, capabilities, specs) {
    },
    /**
     * Wird ausgeführt, sobald der Browser geschlossen wurde.
     * @param {Object} config wdio Konfigurations Objekt
     * @param {Array.<Object>} capabilities Liste der definierten Browser
     * @param {Array.<String>} specs Liste der Test Dateien
     */
    afterSession: function (config, capabilities, specs) {
    },
    /**
     * Wird ausgeführt, sobald alle Test Prozesse geschlossen wurden.
     * @param {Object} exitCode 0 - Erfolg, 1 - Fehlschlag
     * @param {Object} config wdio Konfigurations Objekt
     * @param {Array.<Object>} capabilities Liste der definierten Browser
     * @param {<Object>} results Objekt mit den Test Resultaten
     */
    onComplete: function (exitCode, config, capabilities, results) {
    },
    /**
     * Cucumber spezifische Hooks
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

Sie finden ebenfalls nochmal eine Konfigurationsdatei mit allen möglichen Werten im [Beispiel Verzeichnis](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js).