---
id: configuration
title: कॉन्फ़िगरेशन
---

[सेटअप प्रकार](./SetupTypes.md) के आधार पर (उदाहरण के लिए कच्चे प्रोटोकॉल बाइंडिंग का उपयोग करके, वेबड्राइवरियो स्टैंडअलोन पैकेज या WDIO टेस्टरनर के रूप में) पर्यावरण को नियंत्रित करने के लिए विकल्पों का एक अलग सेट उपलब्ध है।

## वेब ड्राइवर विकल्प

[`webdriver`](https://www.npmjs.com/package/webdriver) प्रोटोकॉल पैकेज का उपयोग करते समय निम्नलिखित विकल्पों को परिभाषित किया गया है:

### protocol

ड्राइवर सर्वर के साथ संचार करते समय उपयोग करने के लिए प्रोटोकॉल।

Type: `String`<br /> Default: `http`

### hostname

आपके ड्राइवर सर्वर का होस्ट।

Type: `String`<br /> Default: `localhost`

### port

पोर्ट आपका ड्राइवर सर्वर चालू है।

प्रकार: `Number`<br /> डिफ़ॉल्ट: `4444`

### path

ड्राइवर सर्वर समापन बिंदु का पथ।

Type: `String`<br /> Default: `/`

### queryParams

ड्राइवर सर्वर के लिए प्रचारित क्वेरी पैरामीटर।

Type: `Object`<br /> Default: `null`

### user

आपका क्लाउड सर्विस यूज़रनेम (केवल [सॉस लैब्स](https://saucelabs.com), [ब्राउज़रस्टैक](https://www.browserstack.com), [टेस्टिंगबॉट](https://testingbot.com), [क्रॉसब्रोसरटेस्टिंग](https://crossbrowsertesting.com) या [लैम्ब्डाटेस्ट](https://www.lambdatest.com) खातों के लिए काम करता है)। यदि सेट किया जाता है, तो WebdriverIO स्वचालित रूप से आपके लिए कनेक्शन विकल्प सेट कर देगा। यदि आप क्लाउड प्रदाता का उपयोग नहीं करते हैं तो इसका उपयोग किसी अन्य वेबड्राइवर बैकएंड को प्रमाणित करने के लिए किया जा सकता है।

Type: `String`<br /> Default: `null`

### key

आपका क्लाउड सर्विस यूज़रनेम (केवल [सॉस लैब्स](https://saucelabs.com), [ब्राउज़रस्टैक](https://www.browserstack.com), [टेस्टिंगबॉट](https://testingbot.com), [क्रॉसब्रोसरटेस्टिंग](https://crossbrowsertesting.com) या [लैम्ब्डाटेस्ट](https://www.lambdatest.com) खातों के लिए काम करता है)। यदि सेट किया जाता है, तो WebdriverIO स्वचालित रूप से आपके लिए कनेक्शन विकल्प सेट कर देगा। यदि आप क्लाउड प्रदाता का उपयोग नहीं करते हैं तो इसका उपयोग किसी अन्य वेबड्राइवर बैकएंड को प्रमाणित करने के लिए किया जा सकता है।

Type: `String`<br /> Default: `null`

### capabilities

उन क्षमताओं को परिभाषित करता है जिन्हें आप अपने वेबड्राइवर सत्र में चलाना चाहते हैं। अधिक विवरण के लिए [वेबड्राइवर प्रोटोकॉल](https://w3c.github.io/webdriver/#capabilities) देखें। यदि आप एक पुराना ड्राइवर चलाते हैं जो वेबड्राइवर प्रोटोकॉल का समर्थन नहीं करता है, तो आपको सत्र को सफलतापूर्वक चलाने के लिए [JSONWireProtocol क्षमताओं](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) का उपयोग करने की आवश्यकता होगी।

वेबड्राइवर आधारित क्षमताओं के आगे आप ब्राउज़र और विक्रेता विशिष्ट विकल्प लागू कर सकते हैं जो दूरस्थ ब्राउज़र या डिवाइस के लिए गहन कॉन्फ़िगरेशन की अनुमति देते हैं। ये संबंधित विक्रेता डॉक्स में प्रलेखित हैं, उदाहरण के लिए:

- `goog:chromeOptions`: for [Google Chrome](https://chromedriver.chromium.org/capabilities#h.p_ID_106)
- `moz:firefoxOptions`: for [Mozilla Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html)
- `ms:edgeOptions`: for [Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options#using-the-edgeoptions-class)
- `sauce:options`: for [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional)
- `bstack:options`: for [BrowserStack](https://www.browserstack.com/automate/capabilities?tag=selenium-4#)
- `selenoid:options`: for [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)

इसके अतिरिक्त, सॉस लैब्स [ऑटोमेटेड टेस्ट कॉन्फिगरेटर](https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/)एक उपयोगी उपयोगिता है, जो आपकी इच्छित क्षमताओं को एक साथ क्लिक करके इस ऑब्जेक्ट को बनाने में आपकी मदद करती है।

Type: `Object`<br /> Default: `null`

**उदाहरण:**

```js
{
    browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
    browserVersion: '27.0', // browser version
    platformName: 'Windows 10' // OS platform
}
```

यदि आप मोबाइल उपकरणों पर वेब या नेटिव परीक्षण चला रहे हैं, तो `capabilities` वेबड्राइवर प्रोटोकॉल से भिन्न है। अधिक विवरण के लिए [एपियम डॉक्स](http://appium.io/docs/en/writing-running-appium/caps/) देखें।

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

हर वेबड्राइवर अनुरोध में पास होने के लिए और सीडीपी प्रोटोकॉल का उपयोग करके पपटियर के माध्यम से ब्राउज़र से कनेक्ट करने के लिए कस्टम `headers` निर्दिष्ट करें।

:::caution

ये शीर्षलेख __ब्राउज़र अनुरोध में__ पास नहीं हुए हैं। यदि आप ब्राउज़र अनुरोधों के अनुरोध शीर्षलेखों को संशोधित करना चाहते हैं, तो कृपया [#6361](https://github.com/webdriverio/webdriverio/issues/6361)में शामिल हों!

:::

Type: `Object`<br /> Default: `{}`

### transformRequest

वेबड्राइवर अनुरोध किए जाने से पहले फ़ंक्शन इंटरसेप्टिंग [HTTP अनुरोध विकल्प](https://github.com/sindresorhus/got#options)

Type: `(RequestOptions) => RequestOptions`<br /> Default: *none*

### transformResponse

WebDriver प्रतिक्रिया आने के बाद फ़ंक्शन इंटरसेप्टिंग HTTP प्रतिक्रिया ऑब्जेक्ट। फ़ंक्शन को मूल प्रतिक्रिया ऑब्जेक्ट को पहले और संबंधित `RequestOptions` दूसरे तर्क के रूप में पास किया गया है।

Type: `(Response, RequestOptions) => Response`<br /> Default: *none*

### strictSSL

क्या इसे वैध होने के लिए एसएसएल प्रमाणपत्र की आवश्यकता नहीं है। इसे पर्यावरण वेरिएबल के माध्यम से `STRICT_SSL` या `STRICT_SSL`के रूप में सेट किया जा सकता है।

Type: `Boolean`<br /> Default: `true`

### enableDirectConnect

चाहे [Appium डायरेक्ट कनेक्शन सुविधा](https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments) सक्षम करें। फ्लेग सक्षम होने पर प्रतिक्रिया में उचित कुंजी नहीं होने पर यह कुछ भी नहीं करता है।

Type: `Boolean`<br /> Default: `true`

---

## WebdriverIO

निम्नलिखित विकल्पों (ऊपर सूचीबद्ध वाले सहित) का उपयोग स्टैंडअलोन में WebdriverIO के साथ किया जा सकता है:

### automationProtocol

उस प्रोटोकॉल को परिभाषित करें जिसे आप अपने ब्राउज़र स्वचालन के लिए उपयोग करना चाहते हैं। वर्तमान में केवल [`webdriver`](https://www.npmjs.com/package/webdriver) और [`devtools`](https://www.npmjs.com/package/devtools) समर्थित हैं, क्योंकि ये मुख्य ब्राउज़र स्वचालन तकनीकें उपलब्ध हैं।

यदि आप `devtools`का उपयोग करके ब्राउज़र को स्वचालित करना चाहते हैं, तो सुनिश्चित करें कि आपके पास NPM पैकेज इंस्टाल है (`$ npm install --save-dev devtools`)।

Type: `String`<br /> Default: `webdriver`

### baseUrl

बेस URL सेट करके `url` कमांड कॉल को छोटा करें।
- अगर आपका `url` पैरामीटर `/`से शुरू होता है, तो `baseUrl` पहले से जोड़ा जाता है ( `baseUrl` पथ को छोड़कर, अगर इसमें एक है).
- यदि आपका `url` पैरामीटर बिना किसी स्कीम या `(जैसे <code>some/path`) के बिना शुरू</code>है, तो पूरा `baseUrl` सीधे प्रीपेंडेड हो जाता है।

Type: `String`<br /> Default: `null`

### waitforTimeout

सभी `WaitFor*` कमांड के लिए डिफ़ॉल्ट टाइमआउट। (विकल्प नाम में लोअरकेस `f` नोट करें।) यह टाइमआउट __केवल__ `waitFor*` से शुरू होने वाले कमांड और उनके डिफ़ॉल्ट प्रतीक्षा समय को प्रभावित करता है।

_टेस्ट_के लिए टाइमआउट बढ़ाने के लिए, कृपया फ्रेमवर्क डॉक्स देखें।

Type: `Number`<br /> Default: `3000`

### waitforInterval

सभी `WaitFor*` कमांड के लिए डिफ़ॉल्ट अंतराल यह जांचने के लिए कि क्या एक अपेक्षित स्थिति (जैसे, दृश्यता) बदल दी गई है।

Type: `Number`<br /> Default: `500`

### क्षेत्र

यदि सॉस लैब्स पर चल रहा है, तो आप विभिन्न डेटासेंटरों के बीच परीक्षण चलाना चुन सकते हैं: यूएस या ईयू। अपने क्षेत्र को ईयू में बदलने के लिए, `region: 'eu''` अपने कॉन्फ़िगरेशन में।

__नोट:__ इसका प्रभाव तभी होता है जब आप `user` और `key` विकल्प प्रदान करते हैं जो आपके सॉस लैब्स खाते से जुड़े होते हैं।

Type: `String`<br /> Default: `us`

*(केवल वीएम और या ईएम/सिमुलेटर के लिए)*

---

## Testrunner Options

निम्नलिखित विकल्पों (ऊपर सूचीबद्ध वाले सहित) को केवल WDIO टेस्टरनर के साथ WebdriverIO चलाने के लिए परिभाषित किया गया है:

### specs

परीक्षण निष्पादन के लिए विशिष्टताओं को परिभाषित करें। आप या तो एक बार में एक से अधिक फ़ाइलों से मिलान करने के लिए एक ग्लोब पैटर्न निर्दिष्ट कर सकते हैं या एक ग्लोब या पथों के सेट को एक एकल वर्कर प्रक्रिया में चलाने के लिए सरणी में व्रेप कर सकते हैं। सभी पथ कॉन्फ़िग फ़ाइल पथ से संबंधित के रूप में देखे जाते हैं।

Type: `(String | String[])[]`<br /> Default: `[]`

### exclude

परीक्षण निष्पादन से विशिष्टताओं को बाहर करें। सभी पथ कॉन्फ़िग फ़ाइल पथ से संबंधित के रूप में देखे जाते हैं।

Type: `String[]`<br /> Default: `[]`

### suites

विभिन्न सुइट्स का वर्णन करने वाला एक ऑब्जेक्ट, जिसे आप `wdio` CLI पर `--suite` विकल्प के साथ निर्दिष्ट कर सकते हैं।

Type: `Object`<br /> Default: `{}`

### capabilities

समानांतर निष्पादन के लिए एक सरणी में या तो [`multiremote`](Multiremote.md) ऑब्जेक्ट, या एकाधिक वेबड्राइवर सत्र निर्दिष्ट करने के विकल्प को छोड़कर ऊपर वर्णित `capabilities` अनुभाग के समान।

आप वही विक्रेता और ब्राउज़र विशिष्ट क्षमताओं को लागू कर सकते हैं जैसा कि</a>के ऊपर
परिभाषित किया गया है।</p> 

Type: `Object`|`Object[]`<br /> Default: `[{ maxInstances: 5, browserName: 'firefox' }]`



### maxInstances

कुल समानांतर चलने वाले श्रमिकों की अधिकतम संख्या।

__Note:__ that it may be a number as high as `100`, when the tests are being performed on some external vendors such as Sauce Labs's machines. There, the tests are not tested on a single machine, but rather, on multiple VMs. If the tests are to be run on a local development machine, use a number that is more reasonable, such as `3`, `4`, or `5`. Essentially, this is the number of browsers that will be concurrently started and running your tests at the same time, so it depends on how much RAM there is on your machine, and how many other apps are running on your machine.

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

If you want your test run to stop after a specific number of test failures, use `bail`. (It defaults to `0`, which runs all tests no matter what.) **Note:** Please be aware that when using a third party test runner (such as Mocha), additional configuration might be required.

Type: `Number`<br /> Default: `0` (don't bail; run all tests)



### specFileRetries

The number of times to retry an entire specfile when it fails as a whole.

Type: `Number`<br /> Default: `0`



### specFileRetriesDelay

Delay in seconds between the spec file retry attempts

Type: `Number`<br /> Default: `0`



### specFileRetriesDeferred

Whether or not retried specfiles should be retried immediately or deferred to the end of the queue.

Type: `Boolean`<br /> Default: `true`



### services

Services take over a specific job you don't want to take care of. They enhance your test setup with almost no effort.

Type: `String[]|Object[]`<br /> Default: `[]`



### framework

Defines the test framework to be used by the WDIO testrunner.

Type: `String`<br /> Default: `mocha`<br /> Options: `mocha` | `jasmine`



### mochaOpts, jasmineOpts and cucumberOpts

Specific framework-related options. See the framework adapter documentation on which options are available. Read more on this in [Frameworks](./Frameworks.md).

Type: `Object`<br /> Default: `{ timeout: 10000 }`



### cucumberFeaturesWithLineNumbers

List of cucumber features with line numbers (when [using cucumber framework](./Frameworks.md#using-cucumber)).

Type: `String[]` Default: `[]`



### reporters

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



### autoCompileOpts

Compiler options when using WebdriverIO with TypeScript or Babel.



#### autoCompileOpts.autoCompile

If set to `true` the WDIO testrunner will automatically try to transpile the spec files.

Type: `Boolean` Default: `true`



#### autoCompileOpts.tsNodeOpts

Configure how [`ts-node`](https://www.npmjs.com/package/ts-node) is suppose to transpile the files.

Type: `Object` Default: `{ transpileOnly: true }`



#### autoCompileOpts.babelOpts

Configure how [@babel/register](https://www.npmjs.com/package/@babel/register) is suppose to transpile the files.

Type: `Object` Default: `{}`



## Hooks

The WDIO testrunner allows you to set hooks to be triggered at specific times of the test lifecycle. यह कस्टम क्रियाओं की अनुमति देता है (उदाहरण के लिए यदि परीक्षण विफल हो जाता है तो स्क्रीनशॉट लें)।

प्रत्येक हुक में जीवनचक्र के बारे में पैरामीटर विशिष्ट जानकारी होती है (उदाहरण के लिए परीक्षण सूट या परीक्षण के बारे में जानकारी)। हमारे उदाहरण कॉन्फ़िगरेशन [ में सभी हुक गुणों के बारे में और पढ़ें।](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L183-L326).

**नोट:** कुछ हुक (`onPrepare`, `onWorkerStart`, `onWorkerEnd` और `onComplete`) एक अलग प्रक्रिया में निष्पादित होते हैं और इसलिए वर्कर प्रक्रिया में रहने वाले अन्य हुक के साथ कोई वैश्विक डेटा साझा नहीं कर सकते हैं।



### onPrepare

सभी श्रमिकों के लॉन्च होने से पहले एक बार निष्पादित हो जाता है।

पैरामीटर:

- `config` (`object`): WebdriverIO कॉन्फ़िगरेशन ऑब्जेक्ट
- `param` (`object[]`): क्षमताओं के विवरण की सूची



### onWorkerStart

एक वर्कर प्रक्रिया शुरू होने से पहले निष्पादित हो जाती है और उस वर्कर के लिए विशिष्ट सेवा को आरंभ करने के साथ-साथ एक async फैशन में रनटाइम वातावरण को संशोधित करने के लिए उपयोग किया जा सकता है।

पैरामीटर:

- `cid` (`string`): क्षमता आईडी (जैसे 0-0)
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो कार्यकर्ता में पैदा होंगी
- `specs` (`string[]`): कार्यकर्ता प्रक्रिया में चलने के लिए स्पेक्स
- `args` (`object`): ऑब्जेक्ट जो मुख्य कॉन्फ़िगरेशन के साथ मर्ज हो जाएगा, एक बार वर्कर इनिशियलाइज़ हो जाएगा
- `execArgv` (`string[]`): कार्यकर्ता प्रक्रिया को पारित स्ट्रिंग तर्कों की सूची



### onWorkerEnd

वर्कर प्रक्रिया से बाहर निकलने के ठीक बाद निष्पादित हो जाता है।

पैरामीटर:

- `cid` (`string`): क्षमता आईडी (जैसे 0-0)
- `exitCode` (`number`): 0 - सफलता, 1 - असफल
- `specs` (`string[]`): कार्यकर्ता प्रक्रिया में चलने के लिए स्पेक्स
- `retries` (`number`): प्रयुक्त पुनर्प्रयासों की संख्या



### beforeSession

वेबड्राइवर सत्र और परीक्षण ढांचे को प्रारंभ करने से ठीक पहले निष्पादित किया जाता है। यह आपको क्षमता या विशिष्टता के आधार पर कॉन्फ़िगरेशन में हेरफेर करने की अनुमति देता है।

पैरामीटर:

- `config` (`object`): WebdriverIO कॉन्फ़िगरेशन ऑब्जेक्ट
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो वर्कर में पैदा होंगी
- `specs` (`string[]`): वर्कर प्रक्रिया में चलने के लिए स्पेक्स



### before

परीक्षण निष्पादन शुरू होने से पहले निष्पादित हो जाता है। इस बिंदु पर आप `browser`जैसे सभी वैश्विक वेरिएबल तक पहुंच सकते हैं। कस्टम कमांड को परिभाषित करने के लिए यह सही जगह है।

पैरामीटर:

- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो वर्कर में पैदा होंगी
- `specs` (`string[]`): वर्कर प्रक्रिया में चलने के लिए स्पेक्स
- `browser` (`object`): बनाए गए ब्राउज़र/डिवाइस सत्र का उदाहरण



### beforeSuite

हुक जो सुइट शुरू होने से पहले निष्पादित हो जाता है

पैरामीटर:

- `suite` (`object`): सुइट विवरण



### beforeHook

हुक जो सूट के भीतर *से पहले* निष्पादित हो जाता है, सूट शुरू होता है (उदाहरण के लिए मोचा में पहले कॉल करने से पहले चलता है)

पैरामीटर:

- `suite` (`object`): सुइट विवरण
- `context` (`object`): परीक्षण संदर्भ (ककड़ी में विश्व वस्तु का प्रतिनिधित्व करता है)



### afterHook

हुक जो सूट के भीतर *से पहले* निष्पादित हो जाता है, सूट शुरू होता है (उदाहरण के लिए मोचा में पहले कॉल करने से पहले चलता है)

पैरामीटर:

- `suite` (`object`): सुइट विवरण
- `context` (`object`): परीक्षण संदर्भ (कुकुम्बर में विश्व वस्तु का प्रतिनिधित्व करता है)
- `result` (`object`): हुक परिणाम ( `error`, `result`, `duration`, `passed`, `गुणों को पुनः प्राप्त ` करता है)



### beforeTest

परीक्षण से पहले क्रियान्वित किया जाने वाला कार्य (केवल मोचा/जेसमीन में)।

पैरामीटर:

- `suite` (`object`): सुइट विवरण
- `context` (`object`): स्कोप ऑब्जेक्ट परीक्षण के साथ निष्पादित किया गया था



### beforeCommand

Runs before a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): command name
- `args` (`*`): arguments that command would receive



### afterCommand

Runs after a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): command name
- `args` (`*`): arguments that command would receive
- `result` (`number`): 0 - command success, 1 - command error
- `error` (`Error`): error object if any



### afterTest

Function to be executed after a test (in Mocha/Jasmine) ends.

Parameters:

- `test` (`object`): test details
- `context` (`object`): scope object the test was executed with
- `result.error` (`Error`): परीक्षण विफल होने की स्थिति में त्रुटि वस्तु, अन्यथा `undefined`
- `result.result` (`Any`): परीक्षण फंक्शन की वापसी वस्तु
- `result.duration` (`Number`): मिलीसेकंड में परिदृश्य की अवधि
- `result.passed` (`Boolean`): यदि परिदृश्य पास हो गया है तो सच है
- `result.retries` (`Object`): विशिष्ट संबंधित पुनर्प्रयासों के लिए सूचना, उदाहरण के लिए `{ attempts: 0, limit: 0 }`
- `result` (`object`): hook result (contains `error`, `result`, `duration`, `passed`, `retries` properties)



### afterSuite

Hook that gets executed after the suite has ended

Parameters:

- `suite` (`object`): suite details



### after

Gets executed after all tests are done. You still have access to all global variables from the test.

Parameters:

- `result` (`number`): 0 - test pass, 1 - test fail
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process



### afterSession

Gets executed right after terminating the webdriver session.

Parameters:

- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process



### onComplete

Gets executed after all workers got shut down and the process is about to exit. An error thrown in the onComplete hook will result in the test run failing.

Parameters:

- `exitCode` (`number`): 0 - success, 1 - fail
- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `result` (`object`): results object containing test results



### onReload

Gets executed when a refresh happens.

Parameters:

- `oldSessionId` (`string`): session ID of the old session
- `newSessionId` (`string`): session ID of the new session



### beforeFeature

Runs before a Cucumber Feature.

Parameters:

- `uri` (`string`): path to feature file
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber feature object



### afterFeature

Runs after a Cucumber Feature.

पैरामीटर:

- `uri` (`string`): फीचर फ़ाइल का पथ
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): कुकुम्बर फीचर ऑब्जेक्ट



### beforeScenario

कुकुम्बर परिदृश्य से पहले चलता है।

पैरामीटर:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): विश्व वस्तु जिसमें अचार और परीक्षण चरण की जानकारी है
- `context` (`object`): कुकुम्बर विश्व वस्तु



### afterScenario

कुकुम्बर परिदृश्य से पहले चलता है।

पैरामीटर:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): विश्व वस्तु जिसमें अचार और परीक्षण चरण की जानकारी है
- `result` (`object`): परिदृश्य परिणाम वाली परिणाम वस्तु शामिल
- `result.passed` (`बूलियन`): यदि परिदृश्य पास हो गया है तो सच है
- `esult.error` (`string`): परिदृश्य विफल होने पर त्रुटि ढेर
- `result.duration` (`number`): मिलीसेकंड में परिदृश्य की अवधि
- `context` (`object`): कुकुम्बर विश्व वस्तु



### beforeStep

कुकुम्बर परिदृश्य से पहले चलता है।

पैरामीटर:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): कुकुम्बर स्टेप ऑब्जेक्ट
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): कुकुम्बर परिदृश्य वस्तु
- `context` (`object`): कुकुम्बर विश्व ऑब्जेक्ट



### afterStep

कुकुम्बर स्टेप से बाद में रन करता है।

पैरामीटर:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): कुकुम्बर स्टेप ऑब्जेक्ट
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): कुकुम्बर परिदृश्य वस्तु
- `result` (`object`): परिणाम वस्तु जिसमें स्टेप परिणाम होते हैं
- `result.passed` (`boolean`): यदि परिदृश्य पास हो गया है तो सच है
- `esult.error` (`string`): परिदृश्य विफल होने पर त्रुटि स्टेक
- `result.duration` (`number`): मिलीसेकंड में परिदृश्य की अवधि
- `context` (`object`): कुकुम्बर विश्व ऑब्जेक्ट
