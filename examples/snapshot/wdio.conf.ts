import type { Options } from '@wdio/types'

export const config: Options.Testrunner = {
    //
    // ====================
    // Runner Configuration
    // ====================
    // WebdriverIO supports running e2e tests as well as unit and component tests.
    runner: 'local',
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            project: './tsconfig.json',
            transpileOnly: true
        }
    },
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
        './test/specs/**/*.ts'
    ],
    // Patterns to exclude.
    exclude: [
        // 'path/to/excluded/files'
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
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: 2,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://saucelabs.com/platform/platform-configurator
    //
    capabilities: [{
        browserName: 'chrome'
    }],

    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'trace',
    //
    // Set specific log levels per logger
    // loggers:
    // - webdriver, webdriverio
    // - @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
    // - @wdio/mocha-framework, @wdio/jasmine-framework
    // - @wdio/local-runner
    // - @wdio/sumologic-reporter
    // - @wdio/cli, @wdio/config, @wdio/utils
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    // logLevels: {
    //     webdriver: 'info',
    //     '@wdio/appium-service': 'info'
    // },
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'http://localhost',
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 10000,
    //
    // Default timeout in milliseconds for request
    // if browser driver or grid doesn't send response
    connectionRetryTimeout: 120000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    //
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.
    // services: ["devtools"],
    //
    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'mocha',
    //
    // The number of times to retry the entire specfile when it fails as a whole
    // specFileRetries: 1,
    //
    // Delay in seconds between the spec file retry attempts
    // specFileRetriesDelay: 0,
    //
    // Whether or not retried spec files should be retried immediately or deferred to the end of the queue
    // specFileRetriesDeferred: false,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter
    reporters: [['spec', { realtimeReporting: true }]],
    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: 6000000
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
    // Gets executed once before all workers get launched.
    // onPrepare: function (config, capabilities) {
    // },
    //
    // Gets executed before a worker process is spawned and can be used to initialize specific service
    // for that worker as well as modify runtime environments in an async fashion.
    // onWorkerStart: function (cid, caps, specs, args, execArgv) {
    // },
    //
    // Gets executed just after a worker process has exited.
    // onWorkerEnd: function (cid, exitCode, specs, retries) {
    // },
    //
    // Gets executed before test execution begins. At this point you can access to all global
    // variables like `browser`. It is the perfect place to define custom commands.
    // before: function (capabilities, specs, browser) {
    // },
    //
    // Hook that gets executed before the suite starts
    // beforeSuite: function (suite) {
    // },
    //
    // Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
    // beforeEach in Mocha). In Cucumber `context` is the World object.
    // beforeHook: function (test, context, hookName) {
    // },
    //
    // Hook that gets executed _after_ a hook within the suite ends (e.g. runs after calling
    // afterEach in Mocha). In Cucumber `context` is the World object.
    // afterHook: function (test, context, { error, result, duration, passed, retries }, hookName) {
    // },
    //
    // Function to be executed before a test (in Mocha/Jasmine) starts.
    // beforeTest: function (test, context) {
    // },
    //
    // Runs before a WebdriverIO command gets executed.
    // beforeCommand: function (commandName, args) {
    // },
    //
    // Runs after a WebdriverIO command gets executed
    // afterCommand: function (commandName, args, result, error) {
    // },
    //
    // Function to be executed after a test (in Mocha/Jasmine) ends.
    // afterTest: function (test, context, { error, result, duration, passed, retries }) {
    // },
    //
    // Hook that gets executed after the suite has ended
    // afterSuite: function (suite) {
    // },
    //
    // Cucumber Hooks
    //
    // Runs before a Cucumber Feature.
    // @param {String}                   uri      path to feature file
    // @param {GherkinDocument.IFeature} feature  Cucumber feature object
    //
    // beforeFeature: function (uri, feature) {
    // },
    //
    //
    // Runs before a Cucumber Scenario.
    // @param {ITestCaseHookParameter} world    world object containing information on pickle and test step
    // @param {object}                 context  Cucumber World object
    //
    // beforeScenario: function (world, context) {
    // },
    //
    //
    // Runs before a Cucumber Step.
    // @param {Pickle.IPickleStep} step     step data
    // @param {IPickle}            scenario scenario pickle
    // @param {object}             context  Cucumber World object
    //
    // beforeStep: function (step, scenario, context) {
    // },
    //
    //
    // Runs after a Cucumber Step.
    // @param {Pickle.IPickleStep} step     step data
    // @param {IPickle}            scenario scenario pickle
    // @param {object}             result   results object containing scenario results
    // @param {boolean}            result.passed   true if scenario has passed
    // @param {string}             result.error    error stack if scenario failed
    // @param {number}             result.duration duration of scenario in milliseconds
    // @param {object}             context  Cucumber World object
    //
    // afterStep: function (step, scenario, result, context) {
    // },
    //
    //
    // Runs after a Cucumber Scenario.
    // @param {ITestCaseHookParameter} world  world object containing information on pickle and test step
    // @param {object}                 result results object containing scenario results
    // @param {boolean}                result.passed   true if scenario has passed
    // @param {string}                 result.error    error stack if scenario failed
    // @param {number}                 result.duration duration of scenario in milliseconds
    // @param {object}                 context  Cucumber World object
    //
    // afterScenario: function (world, result) {
    // },
    //
    //
    // Runs after a Cucumber Feature.
    // @param {String}                   uri      path to feature file
    // @param {GherkinDocument.IFeature} feature  Cucumber feature object
    //
    // afterFeature: function (uri, feature) {
    // }
}
