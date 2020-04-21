exports.config = {
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    //
    specs: [__dirname + '/specs/dynamic.spec.js'],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude option in
    // order to group specific specs to a specific capability.
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
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
    outputDir: __dirname,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'http://the-internet.herokuapp.com',
    //
    // Default timeout for all waitForXXX commands.
    waitforTimeout: 150000,
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
    // your test setup with almost no self effort. Unlike plugins they don't add new
    // commands but hook themself up into the test process.
    // services: [],//
    // Framework you want to run your specs with.
    // The following are supported: mocha, jasmine and cucumber
    // see also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'mocha',
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter.html
    reporters: ['spec'],

    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: 30000,
        require: ['@babel/register']
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides a several hooks you can use to intefere the test process in order to enhance
    // it and build services around it. You can either apply a single function to it or an array of
    // methods. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    //
    // Gets executed once before all workers get launched.
    // onPrepare: function (config, capabilities) {
    // },
    //
    // Gets executed before a worker process is spawned and can be used to initialise specific service
    // for that worker as well as modify runtime environments in an async fashion.
    // onWorkerStart: function (cid, caps, specs, args, execArgv) {
    // },
    //
    // Gets executed before test execution begins. At this point you can access to all global
    // variables like `browser`. It is the perfect place to define custom commands.
    // before: function (capabilities, specs) {
    // },
    //
    // Hook that gets executed before the suite starts
    // beforeSuite: function (suite) {
    // },
    //
    // Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
    // beforeEach in Mocha)
    // stepData and world are Cucumber framework specific
    // beforeHook: function (test, context, stepData, world) {
    // },
    //
    // Hook that gets executed _after_ a hook within the suite ends (e.g. runs after calling
    // afterEach in Mocha)
    // stepData and world are Cucumber framework specific
    // afterHook: function (test, context, { error, result, duration, passed, retries }, stepData, world) {
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
    // Runs before a Cucumber Feature
    // beforeFeature: function (uri, feature, scenarios) {
    // },
    //
    // Runs after a Cucumber Feature
    // afterFeature: function (uri, feature, scenarios) {
    // }
    //
    // Runs before a Cucumber Scenario
    // beforeScenario: function (uri, feature, scenario, sourceLocation) {
    // },
    //
    // Runs after a Cucumber Scenario
    // afterScenario: function (uri, feature, scenario, result, sourceLocation) {
    // },
    //
    // Runs before a Cucumber Step
    // beforeStep: function ({ uri, feature, step }, context) {
    // },
    //
    // Runs after a Cucumber Step
    // afterStep: function ({ uri, feature, step }, context, { error, result, duration, passed, retries }) {
    // },
    //
    // Gets executed after all tests are done. You still have access to all global variables from
    // the test.
    // after: function (result, capabilities, specs) {
    // },
    //
    // Gets executed after all workers got shut down and the process is about to exit. An error
    // thrown in the onComplete hook will result in the test run failing.
    // onComplete: function(exitCode, config, capabilities, results) {
    // }
}
