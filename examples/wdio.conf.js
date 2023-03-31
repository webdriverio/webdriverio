/* eslint-disable no-unused-vars */

exports.config = {
    // =====================
    // Server Configurations
    // =====================
    // Host address of the running Selenium server. This information is usually obsolete as
    // WebdriverIO automatically connects to localhost. Also, if you are using one of the
    // supported cloud services like Sauce Labs, Browserstack, or Testing Bot you don't
    // need to define host and port information because WebdriverIO can figure that out
    // according to your user and key information. However, if you are using a private Selenium
    // backend you should define the host address, port, and path here.
    //
    hostname: 'localhost',
    port: 4444,
    path: '/',
    // Protocol: http | https
    // protocol: 'http',
    //
    // =================
    // Service Providers
    // =================
    // WebdriverIO supports Sauce Labs, Browserstack, and Testing Bot (other cloud providers
    // should work too though). These services define specific user and key (or access key)
    // values you need to put in here in order to connect to these services.
    //
    user: 'webdriverio',
    key:  'xxxxxxxxxxxxxxxx-xxxxxx-xxxxx-xxxxxxxxx',
    //
    // If you run your tests on Sauce Labs you can specify the region you want to run your tests
    // in via the `region` property. Available short handles for regions are:
    // us: us-west-1 (default)
    // eu: eu-central-1
    region: 'us',
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // of the configuration file being run.
    //
    // The specs are defined as an array of spec files (optionally using wildcards
    // that will be expanded). The test for each spec file will be run in a separate
    // worker process. In order to have a group of spec files run in the same worker
    // process simply enclose them in an array within the specs array.
    //
    // If you are calling `wdio` from an NPM script (see https://docs.npmjs.com/cli/run-script),
    // then the current working directory is where your `package.json` resides, so `wdio`
    // will be called from there.
    //
    specs: [
        'test/spec/**'
    ],
    // Patterns to exclude.
    exclude: [
        'test/spec/multibrowser/**',
        'test/spec/mobile/**'
    ],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1, wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10; all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    maxInstances: 10,
    //
    // Or set a limit to run tests with a specific capability.
    maxInstancesPerCapability: 10,
    //
    // Inserts WebdriverIO's globals (e.g. `browser`, `$` and `$$`) into the global environment.
    // If you set to `false`, you should import from `@wdio/globals`. Note: WebdriverIO doesn't
    // handle injection of test framework specific globals.
    //
    injectGlobals: true,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://saucelabs.com/platform/platform-configurator
    //
    capabilities: [{
        browserName: 'chrome'
    }, {
        // maxInstances can get overwritten per capability. So if you have an in-house Selenium
        // grid with only 5 firefox instances available you can make sure that not more than
        // 5 instances get started at a time.
        maxInstances: 5,
        browserName: 'firefox',
        specs: [
            'test/ffOnly/*'
        ]
    }],
    //
    //
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'info',
    //
    // Set directory to store all logs into
    outputDir: __dirname,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'http://localhost:8080',
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 1000,
    //
    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework
    // installed before running any tests.
    framework: 'mocha',
    //
    // The number of times to retry the entire specfile when it fails as a whole
    specFileRetries: 1,
    //
    // Delay in seconds between the spec file retry attempts
    specFileRetriesDelay: 0,
    //
    // Retried specfiles are inserted at the beginning of the queue and retried immediately
    specFileRetriesDeferred: false,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter.html
    reporters: [
        'dot',
        ['allure', {
            //
            // If you are using the "allure" reporter you should define the directory where
            // WebdriverIO should save all allure reports.
            outputDir: './allureReports'
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
    // See also: https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-jasmine-framework#jasmineopts-options
    jasmineOpts: {
        //
        // Jasmine default timeout
        defaultTimeoutInterval: 5000,
        //
        // The Jasmine framework allows interception of each assertion in order to log the state of the application
        // or website depending on the result. For example, it is pretty handy to take a screenshot every time
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
    // If you are using Cucumber you need to specify the location of your step definitions.
    // See also: https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options
    cucumberOpts: {
        require: [],        // <string[]> (file/dir) require files before executing features
        backtrace: false,   // <boolean> show full backtrace for errors
        requireModule: [],  // <string[]> ("module") require MODULE files (repeatable)
        dryRun: false,      // <boolean> invoke formatters without executing steps
        failFast: false,    // <boolean> abort the run on first failure
        snippets: true,     // <boolean> hide step definition snippets for pending steps
        source: true,       // <boolean> hide source uris
        strict: false,      // <boolean> fail if there are any undefined or pending steps
        tagExpression: '',  // <string> (expression) only execute the features or scenarios with tags matching the expression
        timeout: 20000,     // <number> timeout for step definitions
        ignoreUndefinedDefinitions: false, // <boolean> Enable this config to treat undefined definitions as warnings.
    },
    //
    // Auto-compilation configuration
    autoCompileOpts: {
        // Enable/disable auto-compilation (enabled by default)
        autoCompile: true,

        // Configure how ts-node is automatically included when present
        tsNodeOpts: {
            transpileOnly: true,
            project: './path/to/tsconfig.json'
        },

        // If you have tsconfig-paths installed and provide a tsConfigPathsOpts
        // option, it will be automatically registered during bootstrap.
        tsConfigPathsOpts: {
            baseUrl: './'
        },

        // Configure how @babel/register is automatically included when present (and ts-node isn't)
        babelOpts: {}
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
    // it and to build services around it. You can either apply a single function or an array of
    // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
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
     * Gets executed before a worker process is spawned and can be used to initialise specific service
     * for that worker as well as modify runtime environments in an async fashion.
     * @param  {String}   cid      capability id (e.g 0-0)
     * @param  {[type]}   caps     object containing capabilities for session that will be spawn in the worker
     * @param  {String[]} specs    specs to be run in the worker process
     * @param  {[type]}   args     object that will be merged with the main configuration once worker is initialised
     * @param  {[type]}   execArgv list of string arguments passed to the worker process
     */
    onWorkerStart: function (cid, caps, specs, args, execArgv) {
    },
    /**
     * Gets executed just after a worker process has exited.
     * @param  {String}   cid      capability id (e.g 0-0)
     * @param  {Number}   exitCode exit code returned from worker process
     * @param  {String[]} specs    specs to be run in the worker process
     * @param  {Number}   retries  number of retries used
     */
    onWorkerEnd: function (cid, exitCode, specs, retries) {
    },
    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     * @param {String} cid worker id (e.g. 0-0)
     */
    beforeSession: function (config, capabilities, specs, cid) {
    },
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs        List of spec file paths that are to be run
     * @param {Object}         browser      instance of created browser/device session
     */
    before: function (capabilities, specs, browser) {
    },
    /**
     * Hook that gets executed before the suite starts
     * @param {Object} suite suite details
     */
    beforeSuite: function (suite) {
    },
    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha). In Cucumber `context` is the World object.
     */
    beforeHook: function (test, context) {
    },
    /**
     * Hook that gets executed _after_ a hook within the suite ends (e.g. runs after calling
     * afterEach in Mocha). In Cucumber `context` is the World object.
     */
    afterHook: function (test, context, { error, result, duration, passed, retries }) {
    },
    /**
     * Function to be executed before a test (in Mocha/Jasmine only)
     * @param {Object} test    test object
     * @param {Object} context scope object the test was executed with
     */
    beforeTest: function (test, context) {
    },
    //
    /**
     * Runs before a WebdriverIO command gets executed.
     * @param {String} commandName command name
     * @param {Array} args arguments that command would receive
     */
    beforeCommand: function (commandName, args) {
    },
    /**
     * Runs after a WebdriverIO command gets executed.
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     * @param {Number} result 0 - command success, 1 - command error
     * @param {Object} error error object if any
     */
    afterCommand: function (commandName, args, result, error) {
    },
    /**
     * Function to be executed after a test (in Mocha/Jasmine only)
     * @param {Object}  test             test object
     * @param {Object}  context          scope object the test was executed with
     * @param {Error}   result.error     error object in case the test fails, otherwise `undefined`
     * @param {Any}     result.result    return object of test function
     * @param {Number}  result.duration  duration of test
     * @param {Boolean} result.passed    true if test has passed, otherwise false
     * @param {Object}  result.retries   informations to spec related retries, e.g. `{ attempts: 0, limit: 0 }`
     */
    afterTest: function (test, context, { error, result, duration, passed, retries }) {
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
     * Gets executed after all workers got shut down and the process is about to exit. An error
     * thrown in the onComplete hook will result in the test run failing.
     * @param {Object} exitCode 0 - success, 1 - fail
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {<Object>} results object containing test results
     */
    onComplete: function (exitCode, config, capabilities, results) {
    },
    /**
    * Gets executed when a refresh happens.
    * @param {String} oldSessionId session ID of the old session
    * @param {String} newSessionId session ID of the new session
    */
    onReload: function(oldSessionId, newSessionId) {
    },
    /**
     * Cucumber Hooks
     *
     * Runs before a Cucumber Feature.
     * @param {String}                   uri      path to feature file
     * @param {GherkinDocument.IFeature} feature  Cucumber feature object
     */
    beforeFeature: function (uri, feature) {
    },
    /**
     *
     * Runs before a Cucumber Scenario.
     * @param {ITestCaseHookParameter} world    world object containing information on pickle and test step
     * @param {Object}                 context  Cucumber World object
     */
    beforeScenario: function (world, context) {
    },
    /**
     *
     * Runs before a Cucumber Step.
     * @param {Pickle.IPickleStep} step     step data
     * @param {IPickle}            scenario scenario pickle
     * @param {Object}             context  Cucumber World object
     */
    beforeStep: function (step, scenario, context) {
    },
    /**
     *
     * Runs after a Cucumber Step.
     * @param {Pickle.IPickleStep} step     step data
     * @param {IPickle}            scenario scenario pickle
     * @param {Object}             result   results object containing scenario results
     * @param {boolean}            result.passed   true if scenario has passed
     * @param {string}             result.error    error stack if scenario failed
     * @param {number}             result.duration duration of scenario in milliseconds
     * @param {Object}             context Cucumber World object
     */
    afterStep: function (step, scenario, result, context) {
    },
    /**
     *
     * Runs after a Cucumber Scenario.
     * @param {ITestCaseHookParameter} world  world object containing information on pickle and test step
     * @param {Object}                 result results object containing scenario results
     * @param {boolean}                result.passed   true if scenario has passed
     * @param {string}                 result.error    error stack if scenario failed
     * @param {number}                 result.duration duration of scenario in milliseconds
     * @param {Object}                 context Cucumber World object
     */
    afterScenario: function (world, result, context) {
    },
    /**
     *
     * Runs after a Cucumber Feature.
     * @param {String}                   uri      path to feature file
     * @param {GherkinDocument.IFeature} feature  Cucumber feature object
     */
    afterFeature: function (uri, feature) {
    }
}
