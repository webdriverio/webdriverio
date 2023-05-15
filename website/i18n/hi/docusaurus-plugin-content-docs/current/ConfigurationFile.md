---
id: configurationfile
title: कॉन्फ़िगरेशन फाइल
---

कॉन्फ़िगरेशन फ़ाइल में आपके परीक्षण सूट को चलाने के लिए सभी आवश्यक जानकारी होती है। यह एक NodeJS मॉड्यूल है जो JSON एक्सपोर्ट करता है।

यहां सभी समर्थित गुणों और अतिरिक्त जानकारी के साथ एक उदाहरण कॉन्फ़िगरेशन दिया गया है:

```js
export const config = {

    // ==================================
    // Where should your test be launched
    // ==================================
    //
    runner: 'local',
    //
    // =====================
    // Server Configurations
    // =====================
    // Host address of the running Selenium server. This information is usually obsolete, as
    // WebdriverIO automatically connects to localhost. Also if you are using one of the
    // supported cloud services like Sauce Labs, Browserstack, Testing Bot or LambdaTest, you also don't
    // need to define host and port information (because WebdriverIO can figure that out
    // from your user and key information). However, if you are using a private Selenium
    // backend, you should define the `hostname`, `port`, and `path` here.
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
    // WebdriverIO supports Sauce Labs, Browserstack, Testing Bot and LambdaTest. (Other cloud providers
    // should work, too.) These services define specific `user` and `key` (or access key)
    // values you must put here, in order to connect to these services.
    //
    user: 'webdriverio',
    key:  'xxxxxxxxxxxxxxxx-xxxxxx-xxxxx-xxxxxxxxx',

    // If you run your tests on Sauce Labs you can specify the region you want to run your tests
    // in via the `region` property. Available short handles for regions are `us` (default) and `eu`.
    // These regions are used for the Sauce Labs VM cloud and the Sauce Labs Real Device Cloud.
    // If you don't provide the region, it defaults to `us`.
    region: 'us',
    //
    // Sauce Labs provides a [headless offering](https://saucelabs.com/products/web-testing/sauce-headless-testing)
    // that allows you to run Chrome and Firefox tests headless.
    //
    headless: false,
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
    // process enclose them in an array within the specs array.
    //
    // If you are calling `wdio` from an NPM script (see https://docs.npmjs.com/cli/run-script),
    // then the current working directory is where your `package.json` resides, so `wdio`
    // will be called from there.
    //
    specs: [
        'test/spec/**',
        ['group/spec/**']
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
    // sessions. Within your `capabilities`, you can overwrite the `spec` and `exclude`
    // options in order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set `maxInstances` to 1. wdio will spawn 3 processes.
    //
    // Therefore, if you have 10 spec files and you set `maxInstances` to 10, all spec files
    // will be tested at the same time and 30 processes will be spawned.
    //
    // The property handles how many capabilities from the same test should run tests.
    //
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
    // https://docs.saucelabs.com/basics/platform-configurator
    //
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
        // to run chrome headless the following flags are required
        // (see https://developers.google.com/web/updates/2017/04/headless-chrome)
        // args: ['--headless', '--disable-gpu'],
        }
        //
        // Parameter to ignore some or all default flags
        // - if value is true: ignore all DevTools 'default flags' and Puppeteer 'default arguments'
        // - if value is an array: DevTools filters given default arguments
        // 'wdio:devtoolsOptions': {
        //    ignoreDefaultArgs: true,
        //    ignoreDefaultArgs: ['--disable-sync', '--disable-extensions'],
        // }
    }, {
        // maxInstances can get overwritten per capability. So if you have an in house Selenium
        // grid with only 5 firefox instance available you can make sure that not more than
        // 5 instance gets started at a time.
        maxInstances: 5,
        browserName: 'firefox',
        specs: [
            'test/ffOnly/*'
        ],
        'moz:firefoxOptions': {
          // flag to activate Firefox headless mode (see https://github.com/mozilla/geckodriver/blob/master/README.md#firefox-capabilities for more details about moz:firefoxOptions)
          // args: ['-headless']
        },
        // If outputDir is provided WebdriverIO can capture driver session logs
        // it is possible to configure which logTypes to exclude.
        // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
        excludeDriverLogs: ['bugreport', 'server'],
        //
        // Parameter to ignore some or all Puppeteer default arguments
        // ignoreDefaultArgs: ['-foreground'], // set value to true to ignore all default arguments
    }],
    //
    // Additional list of node arguments to use when starting child processes
    execArgv: [],
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'info',
    //
    // Set specific log levels per logger
    // use 'silent' level to disable logger
    logLevels: {
        webdriver: 'info',
        '@wdio/appium-service': 'info'
    },
    //
    // Set directory to store all logs into
    outputDir: __dirname,
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Set a base URL in order to shorten `url()` command calls. If your `url` parameter starts
    // with `/`, the `baseUrl` is prepended, not including the path portion of `baseUrl`.
    //
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the `baseUrl`
    // gets prepended directly.
    baseUrl: 'http://localhost:8080',
    //
    // Default timeout for all waitForXXX commands.
    waitforTimeout: 1000,
    //
    // Add files to watch (e.g. application code or page objects) when running `wdio` command
    // with `--watch` flag. Globbing is supported.
    filesToWatch: [
        // e.g. rerun tests if I change my application code
        // './app/**/*.js'
    ],
    //
    // Framework you want to run your specs with.
    // The following are supported: 'mocha', 'jasmine', and 'cucumber'
    // See also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed before running any tests.
    framework: 'mocha',
    //
    // The number of times to retry the entire specfile when it fails as a whole
    specFileRetries: 1,
    // Delay in seconds between the spec file retry attempts
    specFileRetriesDelay: 0,
    // Whether or not retried spec files should be retried immediately or deferred to the end of the queue
    specFileRetriesDeferred: false,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // See also: https://webdriver.io/docs/dot-reporter.html , and click on "Reporters" in left column
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
    // See the full list at: http://mochajs.org
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
        // The Jasmine framework allows it to intercept each assertion in order to log the state of the application
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
    // If you are using Cucumber you need to specify where your step definitions are located.
    // See also: https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options
    cucumberOpts: {
        require: [],        // <string[]> (file/dir) require files before executing features
        backtrace: false,   // <boolean> show full backtrace for errors
        compiler: [],       // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
        dryRun: false,      // <boolean> invoke formatters without executing steps
        failFast: false,    // <boolean> abort the run on first failure
        snippets: true,     // <boolean> hide step definition snippets for pending steps
        source: true,       // <boolean> hide source URIs
        strict: false,      // <boolean> fail if there are any undefined or pending steps
        tagExpression: '',  // <string> (expression) only execute the features or scenarios with tags matching the expression
        timeout: 20000,     // <number> timeout for step definitions
        ignoreUndefinedDefinitions: false, // <boolean> Enable this config to treat undefined definitions as warnings.
        scenarioLevelReporter: false // Enable this to make webdriver.io behave as if scenarios and not steps were the tests.
    },
    // For convenience, if ts-node or @babel/register modules are detected
    // they are automatically loaded for config parsing so that TypeScript and
    // future ES features can be used in wdio configs, and are also
    // automatically loaded for test running so that tests can be written
    // using TypeScript and future ES features.
    // Because this may not be ideal in every situation, the following options
    // may be used to customize the loading for test running, incase it has
    // other requirements.
    autoCompileOpts: {
        //
        // To disable auto-loading entirely set this to false.
        autoCompile: true, // <boolean> Disable this to turn off autoloading. Note: When disabling, you will need to handle calling any such libraries yourself.
        //
        // If you have ts-node installed, you can customize how options are passed to it here:
        // Any valid ts-node config option is allowed. Alternatively the ENV Vars could also be used instead of this.
        // See also: https://github.com/TypeStrong/ts-node#cli-and-programmatic-options
        // See also RegisterOptions in https://github.com/TypeStrong/ts-node/blob/master/src/index.ts
        tsNodeOpts: {
            transpileOnly: true,
            project: 'tsconfig.json'
        },
        // If @babel/register is installed, you can customize how options are passed to it here:
        // Any valid @babel/register config option is allowed.
        // https://babeljs.io/docs/en/babel-register#specifying-options
        babelOpts: {
            ignore: []
        },
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides a several hooks you can use to interfere the test process in order to enhance
    // it and build services around it. You can either apply a single function to it or an array of
    // methods. If one of them returns with a promise, WebdriverIO will wait until that promise is
    // resolved to continue.
    //
    /**
     * Gets executed once before all workers get launched.
     * @param {object} config wdio कॉन्फ़िगरेशन ऑब्जेक्ट
     * @param {Array.<Object>}क्षमताओं की क्षमताओं की सूची विवरण
     */
    onPrepare: फ़ंक्शन (कॉन्फ़िगरेशन, क्षमताएं) {
    },
    /**
     * वर्कर प्रक्रिया शुरू होने से पहले निष्पादित हो जाती है और विशिष्ट सेवा को प्रारंभ करने के लिए उपयोग की जा सकती है
      * उस वर्कर के लिए और साथ ही एक async फैशन में रनटाइम वातावरण को संशोधित करें।
     * @param  {string} सीआईडी   क्षमता आईडी (जैसे 0-0)
      * @param {object}} कैप्स   ऑब्जेक्ट जिसमें सत्र के लिए क्षमताएं होती हैं जो कार्यकर्ता में उत्पन्न होंगी
      * @param {{object} स्पेक्स   कार्यकर्ता प्रक्रिया में चलाने के लिए
      * @param {object} आर्ग्स   ऑब्जेक्ट जो एक बार वर्कर इनिशियलाइज़ होने के बाद मुख्य कॉन्फ़िगरेशन के साथ मर्ज हो जाएगा
      * @param {object} execArgv   कार्यकर्ता प्रक्रिया को पारित स्ट्रिंग तर्कों की सूची
      */
     ऑनवर्करस्टार्ट: फ़ंक्शन (सीआईडी, कैप्स, चश्मा, तर्क, निष्पादनअर्गव) {
     },
     /**
      * कार्यकर्ता प्रक्रिया से बाहर निकलने के बाद निष्पादित किया जाता है।
     * @param  {string} cid क्षमता आईडी (उदाहरण के लिए 0-0)
     * @param  {number} एक्ज़िटकोड 0 - सफलता, 1 - विफल
     * @param  {object} स्पेसिफिकेशंस वर्कर प्रोसेस में चलाए जाने के लिए
     * @param  {number} रिट्रीट की गई रिट्रीट की संख्या
     */
    onWorkerEnd: फ़ंक्शन (सीआईडी, एग्जिटकोड, चश्मा, पुनर्प्रयास) {
    },
    /**
     * वेबड्राइवर सत्र और परीक्षण ढांचे को प्रारंभ करने से पहले निष्पादित हो जाता है। It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {{object}} config wdio कॉन्फ़िगरेशन ऑब्जेक्ट
      * @param Array.<Object>}  क्षमताओं के विवरण की क्षमताएं सूची
      * @param {Array.<String>} विनिर्देश चलाने के लिए विशिष्ट फ़ाइल पथों की सूची
      */
     सत्र से पहले: फ़ंक्शन (कॉन्फ़िगरेशन, क्षमताएं, स्पेक्स) {
     },
     /**
      * परीक्षण निष्पादन शुरू होने से पहले निष्पादित हो जाता है। At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>}क्षमताओं के विवरण की क्षमताएं सूची
      * @param {Array.<String>} स्पेक्स   चलाने के लिए स्पेक्स फ़ाइल पथों की सूची
      * @param {object} ब्राउज़र   बनाए गए ब्राउज़र/डिवाइस सत्र का उदाहरण
      */
     पहले: फ़ंक्शन (क्षमताएं, स्पेक्स, ब्राउज़र) {
     },
     /**
      * सूट शुरू होने से पहले निष्पादित हो जाता है।
     * @param {object} सुइट सुइट विवरण
      */
     पहले सुइट: फ़ंक्शन (सूट) {
     },
     /**
      * सूट के भीतर हर हुक शुरू होने से पहले इस हुक_को_निष्पादित किया जाता है।
     * (For example, this runs before calling `before`, `beforeEach`, `after`, `afterEach` in Mocha.). In Cucumber `context` is the World object.
     *
     */
    beforeHook: function (test, context) {
    },
    /**
     * Hook that gets executed _after_ every hook within the suite ends.
     * (For example, this runs after calling `before`, `beforeEach`, `after`, `afterEach` in Mocha.). In Cucumber `context` is the World object.
     */
     आफ्टरहुक: फ़ंक्शन (परीक्षण, संदर्भ, {त्रुटि, परिणाम, अवधि, उत्तीर्ण, पुनर्प्रयास}) {
     },
     /**
      * परीक्षण से पहले क्रियान्वित होने वाला कार्य (केवल मोचा/जेसमीन में)
      * @ param {object} टेस्ट टेस्ट ऑब्जेक्ट
      * @param {object} संदर्भ स्कोप ऑब्जेक्ट परीक्षण के साथ निष्पादित किया गया था
      */
     पहले टेस्ट: फ़ंक्शन (परीक्षण, संदर्भ) {
     },
     /**
      * WebdriverIO कमांड निष्पादित होने से पहले चलता है।
     * @ param {string} कमांडनाम हुक कमांड नाम
      * @param {Array} तर्क देता है कि कमांड प्राप्त होगा
      */
     कमांड से पहले: फ़ंक्शन (कमांडनाम, तर्क) {
     },
     /**
      * WebdriverIO कमांड निष्पादित होने के बाद चलता है
      * @ param {string} कमांडनाम हुक कमांड नाम
      * @param {Array} उन तर्कों का तर्क देता है जो कमांड प्राप्त करेंगे
      * @ param {number} परिणाम 0 - कमांड सफलता, 1 - कमांड त्रुटि
      * @param {object} एरर एरर ऑब्जेक्ट, यदि कोई हो
      */
     afterCommand: फ़ंक्शन (कमांडनाम, तर्क, परिणाम, त्रुटि) {
     },
     /**
      * एक परीक्षण के बाद निष्पादित किया जाने वाला कार्य (केवल मोचा/जेसमीन में)
      * @ param {{object}} टेस्ट टेस्ट ऑब्जेक्ट
      * @param {object} संदर्भ स्कोप ऑब्जेक्ट परीक्षण के साथ निष्पादित किया गया था
      * @param {Error} परिणाम। परीक्षण विफल होने की स्थिति में त्रुटि त्रुटि वस्तु, अन्यथा `अपरिभाषित`
      * @param {*} result.result टेस्ट फंक्शन का रिटर्न ऑब्जेक्ट
      * @param {number} परिणाम। परीक्षण की अवधि
      * @param {boolean} परिणाम। यदि परीक्षण पास हो गया है तो सही है, अन्यथा गलत है
      * @param {object} result.विशेष संबंधित पुनर्प्रयासों के लिए सूचनाओं का पुनः प्रयास करता है, उदा। `{प्रयास: 0, सीमा: 0}`
      */
     afterTest: फ़ंक्शन (परीक्षण, संदर्भ, {त्रुटि, परिणाम, अवधि, उत्तीर्ण, पुनर्प्रयास}) {
     },
     /**
      * हुक जो सूट समाप्त होने के बाद निष्पादित हो जाता है।
     * @param {object} सुइट सुइट विवरण
      */
     afterSuite: फ़ंक्शन (सूट) {
     },
     /**
      * सभी परीक्षण किए जाने के बाद निष्पादित हो जाता है। You still have access to all global variables from
     * the test.
     * @param {number} परिणाम 0 - परीक्षा पास, 1 - परीक्षा असफल
      * @param  {Array.<Object>}  क्षमताओं के विवरण की क्षमताएं सूची
      * @param {Array.<String>} स्पेक्स चलाए गए स्पेक्स फ़ाइल पथों की सूची
      */
     इसके बाद: फ़ंक्शन (परिणाम, क्षमताएं, स्पेक्स) {
     },
     /**
      * वेबड्राइवर सत्र समाप्त करने के ठीक बाद निष्पादित हो जाता है।
     * @param {object} कॉन्फ़िगरेशन wdio कॉन्फ़िगरेशन ऑब्जेक्ट
      * @param {Array.<Object>} क्षमताओं के विवरण की क्षमताएं सूची
      * @param {Array.<String>} स्पेक्स चलाए गए स्पेक्स फ़ाइल पथों की सूची
      */
     afterSession: फ़ंक्शन (कॉन्फ़िगरेशन, क्षमताएं, स्पेक्स) {
     },
     /**
      * सभी कर्मचारियों के बंद होने के बाद निष्पादित किया जाता है और प्रक्रिया समाप्त होने वाली है।
     * An error thrown in the `onComplete` hook will result in the test run failing.
     * @param {object} एग्जिटकोड 0 - सफलता, 1 - असफल
      * @param {object} कॉन्फ़िगरेशन wdio कॉन्फ़िगरेशन ऑब्जेक्ट
      * @param {Array.<Object>}क्षमताओं के विवरण की क्षमताएं सूची
      * @param {<Object>}परिणाम ऑब्जेक्ट जिसमें परीक्षा परिणाम होते हैं
      */
     onComplete: फ़ंक्शन (निकास कोड, कॉन्फ़िगरेशन, क्षमताएं, परिणाम) {
     },
     /**
     * रिफ्रेश होने पर निष्पादित हो जाता है।
    * @param {string} oldSessionId पुराने सत्र की सत्र आईडी
     * @param {string} नए सत्र की newSessionId सत्र आईडी
     */
     onReload: फ़ंक्शन (पुराना सत्र आईडी, नया सत्र आईडी) {
     },
     /**
      * कुकुम्बर हुक
      *
      * कुकुम्बर फीचर से पहले चलता है।
     * @param {string}     यूरी    पाथ टू फीचर फाइल
      * @param {GherkinDocument.IFeature} फीचर कुकुम्बर फीचर ऑब्जेक्ट
      */
     पहले फ़ीचर: फ़ंक्शन (यूरी, फ़ीचर) {
     },
     /**
      *
      * एक कुकुम्बर परिदृश्य से पहले चलता है।
     * @param {ITestCaseHookParameter}    विश्व    विश्व ऑब्जेक्ट जिसमें अचार और टेस्ट स्टेप की जानकारी है
      * @param {{object}}     संदर्भ कुकुम्बर विश्व वस्तु
      */
     परिदृश्य से पहले: फ़ंक्शन (दुनिया, संदर्भ) {
     },
     /**
      *
      * कुकुम्बर स्टेप से पहले रन करता है।
     * @param {Pickle.IPickleStep}    स्टेप    स्टेप डेटा
      * @param {IPickle}    परिदृश्य    परिदृश्य पिकल
      * @param {{object}}   संदर्भ   कुकुम्बर विश्व वस्तु
      */
     स्टेप से पहले: फ़ंक्शन (चरण, परिदृश्य, संदर्भ) {
     },
     /**
      *
      * कुकुम्बर स्टेप के बाद रन करता है।
     * @param {Pickle.IPickleStep} स्टेप     स्टेप डेटा
      * @param {IPickle} परिदृश्य           परिदृश्य पिकल
      * @param {object}    परिणाम          परिणाम ऑब्जेक्ट जिसमें परिदृश्य परिणाम होते हैं
      * @param {boolean}   परिणाम।       यदि परिदृश्य पारित हो गया है तो परिणाम सही है
      * @param {string} result.error        एरर स्टैक यदि परिदृश्य विफल हुआ
      * @param  {number}   परिणाम।       मिलीसेकंड में परिदृश्य की अवधि अवधि
      * @param {object}    संदर्भ               कुकुम्बर विश्व वस्तु
      */
     afterStep: फ़ंक्शन (चरण, परिदृश्य, परिणाम, संदर्भ) {
     },
     /**
      *
      * एक कुकुम्बर परिदृश्य के बाद चलता है।
     * @param {ITestCaseHookParameter} विश्व   विश्व वस्तु जिसमें पिकल और टेस्ट स्टेप की जानकारी है
      * @param {{object}}   परिणाम   परिणाम वस्तु जिसमें परिदृश्य परिणाम होते हैं ``{passed: boolean, error: string, duration: number}`
      * @param {{boolean}} परिणाम। यदि परिदृश्य पारित हो गया है तो परिणाम सही है
      * @param {string} result.error एरर स्टैक यदि परिदृश्य विफल हुआ
      * @param {{number}} परिणाम।मिलीसेकंड में परिदृश्य की अवधि अवधि
      * @param {{object}} संदर्भ कुकुम्बर विश्व वस्तु
      */
     आफ्टरसेनारियो: फ़ंक्शन (दुनिया, परिणाम, संदर्भ) {
     },
     /**
      *
      * कुकुम्बर की विशेषता के बाद चलता है।
     * @param {string}   यूरी   पाथ टू फीचर फाइल
      * @param {GherkinDocument.IFeature} फीचर    कुकुम्बर फीचर ऑब्जेक्ट
      */
     afterFeature: फ़ंक्शन (यूरी, फ़ीचर) {
     }
}
```

आप [उदाहरण फ़ोल्डर](https://github.com/webdriverio/webdriverio/blob/main/examples/wdio.conf.js)में सभी संभावित विकल्पों और विविधताओं वाली फ़ाइल भी ढूंढ सकते हैं।
