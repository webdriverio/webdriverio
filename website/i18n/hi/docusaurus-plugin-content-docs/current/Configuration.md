---
id: configuration
title: कॉन्फ़िगरेशन
---

[सेटअप प्रकार](/docs/setuptypes) के आधार पर (उदाहरण के लिए कच्चे प्रोटोकॉल बाइंडिंग का उपयोग करके, वेबड्राइवरियो स्टैंडअलोन पैकेज या WDIO टेस्टरनर के रूप में) पर्यावरण को नियंत्रित करने के लिए विकल्पों का एक अलग सेट उपलब्ध है।

## वेब ड्राइवर विकल्प

[`webdriver`](https://www.npmjs.com/package/webdriver) प्रोटोकॉल पैकेज का उपयोग करते समय निम्नलिखित विकल्पों को परिभाषित किया गया है:

### protocol

ड्राइवर सर्वर के साथ संचार करते समय उपयोग करने के लिए प्रोटोकॉल।

Type: `String`<br /> Default: `http`

### hostname

आपके ड्राइवर सर्वर का होस्ट।

Type: `String`<br /> Default: `0.0.0.0`

### port

पोर्ट आपका ड्राइवर सर्वर चालू है।

Type: `Number`<br /> Default: `undefined`

### path

ड्राइवर सर्वर समापन बिंदु का पथ।

Type: `String`<br /> Default: `/`

### queryParams

ड्राइवर सर्वर के लिए प्रचारित क्वेरी पैरामीटर।

Type: `Object`<br /> Default: `undefined`

### user

आपका क्लाउड सर्विस यूज़रनेम (केवल [सॉस लैब्स](https://saucelabs.com), [ब्राउज़रस्टैक](https://www.browserstack.com), [टेस्टिंगबॉट](https://testingbot.com) या [लैम्ब्डाटेस्ट](https://www.lambdatest.com) खातों के लिए काम करता है)। यदि सेट किया जाता है, तो WebdriverIO स्वचालित रूप से आपके लिए कनेक्शन विकल्प सेट कर देगा। यदि आप क्लाउड प्रदाता का उपयोग नहीं करते हैं तो इसका उपयोग किसी अन्य वेबड्राइवर बैकएंड को प्रमाणित करने के लिए किया जा सकता है।

Type: `String`<br /> Default: `undefined`

### key

आपका क्लाउड सर्विस यूज़रनेम (केवल [सॉस लैब्स](https://saucelabs.com), [ब्राउज़रस्टैक](https://www.browserstack.com), [टेस्टिंगबॉट](https://testingbot.com) या [लैम्ब्डाटेस्ट](https://www.lambdatest.com) खातों के लिए काम करता है)। यदि सेट किया जाता है, तो WebdriverIO स्वचालित रूप से आपके लिए कनेक्शन विकल्प सेट कर देगा। यदि आप क्लाउड प्रदाता का उपयोग नहीं करते हैं तो इसका उपयोग किसी अन्य वेबड्राइवर बैकएंड को प्रमाणित करने के लिए किया जा सकता है।

Type: `String`<br /> Default: `undefined`

### capabilities

उन क्षमताओं को परिभाषित करता है जिन्हें आप अपने वेबड्राइवर सत्र में चलाना चाहते हैं। अधिक विवरण के लिए [वेबड्राइवर प्रोटोकॉल](https://w3c.github.io/webdriver/#capabilities) देखें। यदि आप एक पुराना ड्राइवर चलाते हैं जो वेबड्राइवर प्रोटोकॉल का समर्थन नहीं करता है, तो आपको सत्र को सफलतापूर्वक चलाने के लिए [JSONWireProtocol क्षमताओं](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) का उपयोग करने की आवश्यकता होगी।

वेबड्राइवर आधारित क्षमताओं के आगे आप ब्राउज़र और विक्रेता विशिष्ट विकल्प लागू कर सकते हैं जो दूरस्थ ब्राउज़र या डिवाइस के लिए गहन कॉन्फ़िगरेशन की अनुमति देते हैं। ये संबंधित विक्रेता डॉक्स में प्रलेखित हैं, उदाहरण के लिए:

- `goog:chromeOptions`: for [Google Chrome](https://chromedriver.chromium.org/capabilities#h.p_ID_106)
- `moz:firefoxOptions`: for [Mozilla Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html)
- `ms:edgeOptions`: for [Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options#using-the-edgeoptions-class)
- `sauce:options`: for [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional)
- `bstack:options`: for [BrowserStack](https://www.browserstack.com/automate/capabilities?tag=selenium-4#)
- `selenoid:options`: for [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)

इसके अतिरिक्त, सॉस लैब्स [ऑटोमेटेड टेस्ट कॉन्फिगरेटर](https://docs.saucelabs.com/basics/platform-configurator/)एक उपयोगी उपयोगिता है, जो आपकी इच्छित क्षमताओं को एक साथ क्लिक करके इस ऑब्जेक्ट को बनाने में आपकी मदद करती है।

Type: `Object`<br /> Default: `null`

**उदाहरण:**

```js
{
    browserName: 'chrome', // options: `chrome`, `edge`, `firefox`, `safari`
    browserVersion: '27.0', // browser version
    platformName: 'Windows 10' // OS platform
}
```

यदि आप मोबाइल उपकरणों पर वेब या नेटिव परीक्षण चला रहे हैं, तो `capabilities` वेबड्राइवर प्रोटोकॉल से भिन्न है। See the [Appium Docs](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/) for more details.

### logLevel

लॉगिंग वेर्बोसिटी का स्तर।

Type: `String`<br /> Default: `info`<br /> Options: `trace` | `debug` | `info` | `warn` | `error` | `silent`

### outputDir

सभी परीक्षक लॉग फ़ाइलों को संग्रहीत करने के लिए निर्देशिका (रिपोर्टर लॉग और `wdio` लॉग सहित)। यदि सेट नहीं किया गया है, तो सभी लॉग `stdout`पर स्ट्रीम किए जाते हैं। चूंकि अधिकांश पत्रकारों को `stdout`पर लॉग इन करने के लिए बनाया जाता है, इसलिए केवल विशिष्ट पत्रकारों के लिए इस विकल्प का उपयोग करने की सिफारिश की जाती है, जहां रिपोर्ट को फ़ाइल में पुश करने के लिए अधिक समझ में आता है (जैसे `junit` रिपोर्टर, उदाहरण के लिए)।

स्टैंडअलोन मोड में चलने पर, WebdriverIO द्वारा उत्पन्न एकमात्र लॉग `wdio` लॉग होगा।

Type: `String`<br /> Default: `null`

### connectionRetryTimeout

ड्राइवर या ग्रिड के लिए किसी भी वेबड्राइवर अनुरोध के लिए टाइमआउट।

Type: `Number`<br /> Default: `120000`

### connectionRetryCount

अनुरोध की अधिकतम संख्या सेलेनियम सर्वर के लिए पुन: प्रयास करती है।

Type: `Number`<br /> Default: `3`

### agent

आपको कस्टम`http`/`https`/`http2` [एजेंट](https://www.npmjs.com/package/got#agent)अनुरोध करने के लिए इसका उपयोग करने की अनुमति देता है।

Type: `Object`<br /> Default:

```js
{
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
}
```

### headers

Specify custom `headers` to pass into every WebDriver request. If your Selenium Grid requires Basic Authentification we recommend to pass in an `Authorization` header through this option to authenticate your WebDriver requests, e.g.:

```ts wdio.conf.ts
import { Buffer } from 'buffer';
// Read the username and password from environment variables
const username = process.env.SELENIUM_GRID_USERNAME;
const password = process.env.SELENIUM_GRID_PASSWORD;

// Combine the username and password with a colon separator
const credentials = `${username}:${password}`;
// Encode the credentials using Base64
const encodedCredentials = Buffer.from(credentials).toString('base64');

export const config: WebdriverIO.Config = {
    // ...
    headers: {
        Authorization: `Basic ${encodedCredentials}`
    }
    // ...
}
```

Type: `Object`<br /> Default: `{}`

### transformRequest

Function intercepting [HTTP request options](https://github.com/sindresorhus/got#options) before a WebDriver request is made

Type: `(RequestOptions) => RequestOptions`<br /> Default: *none*

### transformResponse

Function intercepting HTTP response objects after a WebDriver response has arrived. The function is passed the original response object as the first and the corresponding `RequestOptions` as the second argument.

Type: `(Response, RequestOptions) => Response`<br /> Default: *none*

### strictSSL

Whether it does not require SSL certificate to be valid. It can be set via an environment variables as `STRICT_SSL` or `strict_ssl`.

Type: `Boolean`<br /> Default: `true`

### enableDirectConnect

Whether enable [Appium direct connection feature](https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments). It does nothing if the response did not have proper keys while the flag is enabled.

Type: `Boolean`<br /> Default: `true`

### cacheDir

The path to the root of the cache directory. This directory is used to store all drivers that are downloaded when attempting to start a session.

Type: `String`<br /> Default: `process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()`

---

## WebdriverIO

The following options (including the ones listed above) can be used with WebdriverIO in standalone:

### automationProtocol

Define the protocol you want to use for your browser automation. Currently only [`webdriver`](https://www.npmjs.com/package/webdriver) is supported, as it is the main browser automation technology WebdriverIO uses.

If you want to automate the browser using a different automation technology, make you set this property to a path that resolves to a module that adheres to the following interface:

```ts
import type { Capabilities } from '@wdio/types';
import type { Client, AttachOptions } from 'webdriver';

export default class YourAutomationLibrary {
    /**
     * Start a automation session and return a WebdriverIO [monad](https://github.com/webdriverio/webdriverio/blob/940cd30939864bdbdacb2e94ee6e8ada9b1cc74c/packages/wdio-utils/src/monad.ts)
     * with respective automation commands. See the [webdriver](https://www.npmjs.com/package/webdriver) package
     * as a reference implementation
     *
     * @param {Capabilities.RemoteConfig} options WebdriverIO options
     * @param {Function} hook that allows to modify the client before it gets released from the function
     * @param {PropertyDescriptorMap} userPrototype allows user to add custom protocol commands
     * @param {Function} customCommandWrapper allows to modify the command execution
     * @returns a WebdriverIO compatible client instance
     */
    static newSession(
        options: Capabilities.RemoteConfig,
        modifier?: (...args: any[]) => any,
        userPrototype?: PropertyDescriptorMap,
        customCommandWrapper?: (...args: any[]) => any
    ): Promise<Client>;

    /**
     * allows user to attach to existing sessions
     * @optional
     */
    static attachToSession(
        options?: AttachOptions,
        modifier?: (...args: any[]) => any, userPrototype?: {},
        commandWrapper?: (...args: any[]) => any
    ): Client;

    /**
     * Changes The instance session id and browser capabilities for the new session
     * directly into the passed in browser object
     *
     * @optional
     * @param   {object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
     */
    static reloadSession(
        instance: Client,
        newCapabilities?: WebdriverIO.Capabilitie
    ): Promise<string>;
}
```

Type: `String`<br /> Default: `webdriver`

### baseUrl

Shorten `url` command calls by setting a base URL.
- अगर आपका `url` पैरामीटर `/`से शुरू होता है, तो `baseUrl` पहले से जोड़ा जाता है ( `baseUrl` पथ को छोड़कर, अगर इसमें एक है).
- यदि आपका `url` पैरामीटर बिना किसी स्कीम या (`जैसे <code>some/path`) के बिना शुरू है, तो पूरा `baseUrl` सीधे प्रीपेंडेड हो जाता है।

Type: `String`<br /> Default: `null`

### waitforTimeout

Default timeout for all `waitFor*` commands. (Note the lowercase `f` in the option name.) This timeout __only__ affects commands starting with `waitFor*` and their default wait time.

To increase the timeout for a _test_, please see the framework docs.

Type: `Number`<br /> Default: `5000`

### waitforInterval

Default interval for all `waitFor*` commands to check if an expected state (e.g., visibility) has been changed.

Type: `Number`<br /> Default: `100`

### क्षेत्र

If running on Sauce Labs, you can choose to run tests between different data centers: US or EU. To change your region to EU, add `region: 'eu'` to your config.

__Note:__ This only has an effect if you provide `user` and `key` options that are connected to your Sauce Labs account.

Type: `String`<br /> Default: `us`

*(only for vm and or em/simulators)*

---

## Testrunner Options

The following options (including the ones listed above) are defined only for running WebdriverIO with the WDIO testrunner:

### specs

Define specs for test execution. You can either specify a glob pattern to match multiple files at once or wrap a glob or set of paths into an array to run them within a single worker process. All paths are seen as relative from the config file path.

Type: `(String | String[])[]`<br /> Default: `[]`

### exclude

Exclude specs from test execution. All paths are seen as relative from the config file path.

Type: `String[]`<br /> Default: `[]`

### suites

An object describing various of suites, which you can then specify with the `--suite` option on the `wdio` CLI.

Type: `Object`<br /> Default: `{}`

### capabilities

The same as the `capabilities` section described above, except with the option to specify either a [`multiremote`](/docs/multiremote) object, or multiple WebDriver sessions in an array for parallel execution.

You can apply the same vendor and browser specific capabilities as defined [above](/docs/configuration#capabilities).

Type: `Object`|`Object[]`<br /> Default: `[{ 'wdio:maxInstances': 5, browserName: 'firefox' }]`

### maxInstances

Maximum number of total parallel running workers.

__Note:__ that it may be a number as high as `100`, when the tests are being performed on some external vendors such as Sauce Labs's machines. There, the tests are not tested on a single machine, but rather, on multiple VMs. If the tests are to be run on a local development machine, use a number that is more reasonable, such as `3`, `4`, or `5`. Essentially, this is the number of browsers that will be concurrently started and running your tests at the same time, so it depends on how much RAM there is on your machine, and how many other apps are running on your machine.

You can also apply `maxInstances` within your capability objects using the `wdio:maxInstances` capability. This will limit the amount of parallel sessions for that particular capability.

Type: `Number`<br /> Default: `100`

### maxInstancesPerCapability

Maximum number of total parallel running workers per capability.

Type: `Number`<br /> Default: `100`

### injectGlobals

Inserts WebdriverIO's globals (e.g. `browser`, `$` and `$$`) into the global environment. If you set to `false`, you should import from `@wdio/globals`, e.g.:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

Note: WebdriverIO doesn't handle injection of test framework specific globals.

Type: `Boolean`<br /> Default: `true`

### bail

If you want your test run to stop after a specific number of test failures, use `bail`. (It defaults to `0`, which runs all tests no matter what.) **Note:** A test in this context are all tests within a single spec file (when using Mocha or Jasmine) or all steps within a feature file (when using Cucumber). If you want to control the bail behavior within tests of a single test file, take a look at the available [framework](frameworks) options.

Type: `Number`<br /> Default: `0` (don't bail; run all tests)

### specFileRetries

The number of times to retry an entire specfile when it fails as a whole.

Type: `Number`<br /> Default: `0`

### specFileRetriesDelay

Delay in seconds between the spec file retry attempts

Type: `Number`<br /> Default: `0`

### specFileRetriesDeferred

Whether or not retried spec files should be retried immediately or deferred to the end of the queue.

Type: `Boolean`<br />
Default: `true`

### groupLogsByTestSpec

Choose the log output view.

If set to `false` logs from different test files will be printed in real-time. Please note that this may result in the mixing of log outputs from different files when running in parallel.

If set to `true` log outputs will be grouped by Test Spec and printed only when the Test Spec is completed.

By default, it is set to `false` so logs are printed in real-time.

Type: `Boolean`<br />
Default: `false`

### groupLogsByTestSpec

Choose the log output view.

If set to `false` logs from different test files will be printed in real-time. Please note that this may result in the mixing of log outputs from different files when running in parallel.

If set to `true` log outputs will be grouped by Test Spec and printed only when the Test Spec is completed.

By default, it is set to `false` so logs are printed in real-time.

Type: `Boolean`<br /> Default: `false`

### services

Services take over a specific job you don't want to take care of. They enhance your test setup with almost no effort.

Type: `String[]|Object[]`<br /> Default: `[]`

### framework

Defines the test framework to be used by the WDIO testrunner.

Type: `String`<br /> Default: `mocha`<br /> Options: `mocha` | `jasmine`

### mochaOpts, jasmineOpts and cucumberOpts

Specific framework-related options. See the framework adapter documentation on which options are available. Read more on this in [Frameworks](frameworks).

Type: `Object`<br /> Default: `{ timeout: 10000 }`

### cucumberFeaturesWithLineNumbers

List of cucumber features with line numbers (when [using cucumber framework](./Frameworks.md#using-cucumber)).

Type: `String[]` Default: `[]`

### रिपोर्ट करने वाला

List of reporters to use. A reporter can be either a string, or an array of `['reporterName', { /* reporter options */}]` where the first element is a string with the reporter name and the second element an object with reporter options.

Type: `String[]|Object[]`<br /> Default: `[]`

Example:

```js
reporters: [
    'dot',
    'spec'
    ['junit', {
        outputDir: `${__dirname}/reports`,
        otherOption: 'foobar'
    }]
]
```

### reporterSyncInterval

Determines in which interval the reporter should check if they are synchronized if they report their logs asynchronously (e.g. if logs are streamed to a 3rd party vendor).

Type: `Number`<br /> Default: `100` (ms)

### reporterSyncTimeout

Determines the maximum time reporters have to finish uploading all their logs until an error is being thrown by the testrunner.

Type: `Number`<br /> Default: `5000` (ms)

### execArgv

Node arguments to specify when launching child processes.

Type: `String[]`<br /> Default: `null`

### filesToWatch

A list of glob supporting string patterns that tell the testrunner to have it additionally watch other files, e.g. application files, when running it with the `--watch` flag. By default the testrunner already watches all spec files.

Type: `String[]`<br /> Default: `[]`

### updateSnapshots

Set to true if you want to update your snapshots. Ideally used as part of a CLI parameter, e.g. `wdio run wdio.conf.js --s`.

Type: `'new' | 'all' | 'none'`<br /> Default: `none` if not provided and tests run in CI, `new` if not provided, otherwise what's been provided

### resolveSnapshotPath

Overrides default snapshot path. For example, to store snapshots next to test files.

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    resolveSnapshotPath: (testPath, snapExtension) => testPath + snapExtension,
}
```

Type: `(testPath: string, snapExtension: string) => string`<br /> Default: stores snapshot files in `__snapshots__` directory next to test file

### tsConfigPath

WDIO uses `tsx` to compile TypeScript files.  Your TSConfig is automatically detected from the current working directory but you can specify a custom path here or by setting the TSX_TSCONFIG_PATH environment variable.

See the `tsx` docs: https://tsx.is/dev-api/node-cli#custom-tsconfig-json-path

Type: `String`<br /> Default: `null`<br />

## Hooks

The WDIO testrunner allows you to set hooks to be triggered at specific times of the test lifecycle. This allows custom actions (e.g. take screenshot if a test fails).

Every hook has as parameter specific information about the lifecycle (e.g. information about the test suite or test). Read more about all hook properties in [our example config](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L183-L326).

**Note:** Some hooks (`onPrepare`, `onWorkerStart`, `onWorkerEnd` and `onComplete`) are executed in a different process and therefore can not share any global data with the other hooks that live in the worker process.

### onPrepare

Gets executed once before all workers get launched.

Parameters:

- `config` (`object`): WebdriverIO कॉन्फ़िगरेशन ऑब्जेक्ट
- `param` (`object[]`): क्षमताओं के विवरण की सूची

### onWorkerStart

Gets executed before a worker process is spawned and can be used to initialize specific service for that worker as well as modify runtime environments in an async fashion.

Parameters:

- `cid` (`string`): क्षमता आईडी (जैसे 0-0)
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो कार्यकर्ता में पैदा होंगी
- `specs` (`string[]`): कार्यकर्ता प्रक्रिया में चलने के लिए स्पेक्स
- `args` (`object`): ऑब्जेक्ट जो मुख्य कॉन्फ़िगरेशन के साथ मर्ज हो जाएगा, एक बार वर्कर इनिशियलाइज़ हो जाएगा
- `execArgv` (`string[]`): कार्यकर्ता प्रक्रिया को पारित स्ट्रिंग तर्कों की सूची

### onWorkerEnd

Gets executed just after a worker process has exited.

Parameters:

- `cid` (`string`): क्षमता आईडी (जैसे 0-0)
- `exitCode` (`number`): 0 - सफलता, 1 - असफल
- `specs` (`string[]`): कार्यकर्ता प्रक्रिया में चलने के लिए स्पेक्स
- `retries` (`number`): number of spec level retries used as defined in [_"Add retries on a per-specfile basis"_](./Retry.md#add-retries-on-a-per-specfile-basis)

### beforeSession

Gets executed just before initializing the webdriver session and test framework. It allows you to manipulate configurations depending on the capability or spec.

Parameters:

- `config` (`object`): WebdriverIO कॉन्फ़िगरेशन ऑब्जेक्ट
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो वर्कर में पैदा होंगी
- `specs` (`string[]`): वर्कर प्रक्रिया में चलने के लिए स्पेक्स

### before

Gets executed before test execution begins. At this point you can access to all global variables like `browser`. It is the perfect place to define custom commands.

Parameters:

- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process
- `browser` (`object`): बनाए गए ब्राउज़र/डिवाइस सत्र का उदाहरण

### beforeSuite

Hook that gets executed before the suite starts (in Mocha/Jasmine only)

Parameters:

- `suite` (`object`): सुइट विवरण

### beforeHook

Hook that gets executed *before* a hook within the suite starts (e.g. runs before calling beforeEach in Mocha)

Parameters:

- `suite` (`object`): सुइट विवरण
- `context` (`object`): परीक्षण संदर्भ (ककड़ी में विश्व वस्तु का प्रतिनिधित्व करता है)

### afterHook

Hook that gets executed *after* a hook within the suite ends (e.g. runs after calling afterEach in Mocha)

Parameters:

- `suite` (`object`): सुइट विवरण
- `context` (`object`): परीक्षण संदर्भ (कुकुम्बर में विश्व वस्तु का प्रतिनिधित्व करता है)
- `result` (`object`): हुक परिणाम ( `error`, `result`, `duration`, `passed`, `गुणों को पुनः प्राप्त` करता है)

### beforeTest

Function to be executed before a test (in Mocha/Jasmine only).

Parameters:

- `test` (`object`): test details
- `context` (`object`): स्कोप ऑब्जेक्ट परीक्षण के साथ निष्पादित किया गया था

### beforeCommand

Runs before a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): कमांड नाम
- `args` (`*`): तर्क जो कमांड प्राप्त करेंगे

### afterCommand

Runs after a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): कमांड नाम
- `args` (`*`): तर्क जो कमांड प्राप्त करेंगे
- `result` (`number`): 0 - कमांड सफलता, 1 - कमांड त्रुटि
- `error` (`error`): त्रुटि ऑब्जेक्ट यदि कोई हो

### afterTest

Function to be executed after a test (in Mocha/Jasmine) ends.

Parameters:

- `test` (`object`): परीक्षण विवरण
- `context` (`object`): स्कोप ऑब्जेक्ट परीक्षण के साथ निष्पादित किया गया था
- `result.error` (`Error`): परीक्षण विफल होने की स्थिति में त्रुटि वस्तु, अन्यथा `undefined`
- `result.result` (`Any`): परीक्षण फंक्शन की वापसी वस्तु
- `result.duration` (`Number`): मिलीसेकंड में परिदृश्य की अवधि
- `result.passed` (`Boolean`): यदि परिदृश्य पास हो गया है तो सच है
- `result.retries` (`Object`): information about single test related retries as defined for [Mocha and Jasmine](./Retry.md#rerun-single-tests-in-jasmine-or-mocha) as well as [Cucumber](./Retry.md#rerunning-in-cucumber), e.g. `{ attempts: 0, limit: 0 }`, see
- `result` (`object`): हुक परिणाम ( `error`, `result`, `duration`, `passed`, `retries` गुणों को करता है)

### afterSuite

Hook that gets executed after the suite has ended (in Mocha/Jasmine only)

Parameters:

- `suite` (`object`): सुइट विवरण

### after

Gets executed after all tests are done. You still have access to all global variables from the test.

Parameters:

- `exitCode` (`number`): 0 - टेस्ट सफलता, 1 - टेस्ट असफल
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो वर्कर में पैदा होंगी
- `specs` (`string[]`): वर्कर प्रक्रिया में चलने के लिए स्पेक्स

### afterSession

Gets executed right after terminating the webdriver session.

Parameters:

- `config` (`object`): WebdriverIO कॉन्फ़िगरेशन ऑब्जेक्ट
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### onComplete

Gets executed after all workers got shut down and the process is about to exit. An error thrown in the onComplete hook will result in the test run failing.

Parameters:

- `exitCode` (`number`): 0 - सफलता, 1 - असफल
- `config` (`object`): WebdriverIO कॉन्फ़िगरेशन ऑब्जेक्ट
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो वर्कर में पैदा होंगी
- `result` (`object`): परिणाम वस्तु जिसमें स्टेप परिणाम होते हैं

### onReload

Gets executed when a refresh happens.

Parameters:

- `oldSessionId` (`string`): पुराने सत्र की सत्र आईडी
- `newSessionId` (`string`): नए सत्र की सत्र आईडी

### beforeFeature

Runs before a Cucumber Feature.

Parameters:

- `uri` (`string`): फीचर फ़ाइल का पथ
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): कुकुम्बर फीचर ऑब्जेक्ट

### afterFeature

Runs after a Cucumber Feature.

Parameters:

- `uri` (`string`): फीचर फ़ाइल का पथ
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): कुकुम्बर फीचर ऑब्जेक्ट

### beforeScenario

Runs before a Cucumber Scenario.

Parameters:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): विश्व वस्तु जिसमें अचार और परीक्षण चरण की जानकारी है
- `context` (`object`): कुकुम्बर विश्व वस्तु

### afterScenario

Runs after a Cucumber Scenario.

Parameters:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): विश्व वस्तु जिसमें अचार और परीक्षण चरण की जानकारी है
- `result` (`object`): परिदृश्य परिणाम वाली परिणाम वस्तु शामिल
- `result.passed` (`बूलियन`): यदि परिदृश्य पास हो गया है तो सच है
- `esult.error` (`string`): परिदृश्य विफल होने पर त्रुटि ढेर
- `result.duration` (`number`): मिलीसेकंड में परिदृश्य की अवधि
- `context` (`object`): कुकुम्बर विश्व ऑब्जेक्ट

### beforeStep

Runs before a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): कुकुम्बर स्टेप ऑब्जेक्ट
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): कुकुम्बर परिदृश्य वस्तु
- `context` (`object`): Cucumber World object

### afterStep

Runs after a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber step object
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber scenario object
- `result` (`object`): परिणाम वस्तु जिसमें स्टेप परिणाम होते हैं
- `result.passed` (`boolean`): यदि परिदृश्य पास हो गया है तो सच है
- `esult.error` (`string`): परिदृश्य विफल होने पर त्रुटि स्टेक
- `result.duration` (`number`): मिलीसेकंड में परिदृश्य की अवधि
- `context` (`object`): कुकुम्बर विश्व ऑब्जेक्ट

### beforeAssertion

Hook that gets executed before a WebdriverIO assertion happens.

Parameters:

- `params`: assertion information
- `params.matcherName` (`string`): name of the matcher (e.g. `toHaveTitle`)
- `params.expectedValue`: value that is passed into the matcher
- `params.options`: assertion options

### afterAssertion

Hook that gets executed after a WebdriverIO assertion happened.

Parameters:

- `params`: assertion information
- `params.matcherName` (`string`): name of the matcher (e.g. `toHaveTitle`)
- `params.expectedValue`: value that is passed into the matcher
- `params.options`: assertion options
- `params.result`: assertion results
