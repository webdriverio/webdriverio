---
id: configuration
title: कॉन्फ़िगरेशन
---

[सेटअप प्रकार](setuptypes) के आधार पर (उदाहरण के लिए कच्चे प्रोटोकॉल बाइंडिंग का उपयोग करके, वेबड्राइवरियो स्टैंडअलोन पैकेज या WDIO टेस्टरनर के रूप में) पर्यावरण को नियंत्रित करने के लिए विकल्पों का एक अलग सेट उपलब्ध है।

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
- यदि आपका `url` पैरामीटर बिना किसी स्कीम या (`जैसे <code>some/path`) के बिना शुरू है, तो पूरा `baseUrl` सीधे प्रीपेंडेड हो जाता है।

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

समानांतर निष्पादन के लिए एक सरणी में या तो [`multiremote`](multiremote) ऑब्जेक्ट, या एकाधिक वेबड्राइवर सत्र निर्दिष्ट करने के विकल्प को छोड़कर ऊपर वर्णित `capabilities` अनुभाग के समान।

आप वही विक्रेता और ब्राउज़र विशिष्ट क्षमताओं को लागू कर सकते हैं जैसा कि के ऊपर परिभाषित किया गया है।

Type: `Object`|`Object[]`<br /> Default: `[{ maxInstances: 5, browserName: 'firefox' }]`

### maxInstances

कुल समानांतर चलने वाले श्रमिकों की अधिकतम संख्या।

__नोट:__ कि यह `100`तक की संख्या हो सकती है, जब कुछ बाहरी विक्रेताओं जैसे सॉस लैब्स की मशीनों पर परीक्षण किए जा रहे हों। वहां, परीक्षणों का परीक्षण एक मशीन पर नहीं, बल्कि कई वीएम पर किया जाता है। यदि परीक्षण स्थानीय विकास मशीन पर चलाना है, तो ऐसी संख्या का उपयोग करें जो अधिक उचित हो, जैसे `3`, `4`, या `5`। अनिवार्य रूप से, यह उन ब्राउज़रों की संख्या है जो समवर्ती रूप से शुरू होंगे और एक ही समय में आपके परीक्षण चलाएंगे, इसलिए यह इस बात पर निर्भर करता है कि आपकी मशीन पर कितनी रैम है, और आपकी मशीन पर कितने अन्य ऐप्स चल रहे हैं।

Type: `Number`<br /> Default: `100`

### maxInstancesPerCapability

कुल समानांतर चलने वाले श्रमिकों की अधिकतम संख्या।

Type: `Number`<br /> Default: `100`

### injectGlobals

वैश्विक परिवेश में WebdriverIO के ग्लोबल्स (जैसे `browser`, `$` और `$$`) सम्मिलित करता है। यदि आप `false`पर सेट हैं, तो आपको `@wdio/globals`से आयात करना चाहिए, उदाहरण के लिए:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

नोट: WebdriverIO टेस्ट फ्रेमवर्क विशिष्ट ग्लोबल्स के इंजेक्शन को हैंडल नहीं करता है।

Type: `Boolean`<br /> Default: `true`

### bail

यदि आप चाहते हैं कि परीक्षण विफलताओं की एक विशिष्ट संख्या के बाद आपका परीक्षण बंद हो जाए, तो `bail`का उपयोग करें। (यह `0`के लिए डिफ़ॉल्ट है, जो सभी परीक्षणों को चलाता है चाहे कुछ भी हो।) **नोट:** कृपया ध्यान रखें कि तीसरे पक्ष के टेस्ट रनर (जैसे मोचा) का उपयोग करते समय, अतिरिक्त कॉन्फ़िगरेशन की आवश्यकता हो सकती है।

Type: `Number`<br /> Default: `0` (don't bail; run all tests)

### specFileRetries

किसी संपूर्ण स्पेकफाइल के पूर्ण रूप से विफल होने पर पुनः प्रयास करने की संख्या।

Type: `Number`<br /> Default: `0`

### specFileRetriesDelay

विशिष्ट फ़ाइल पुनर्प्रयास प्रयासों के बीच सेकंड में विलंब

Type: `Number`<br /> Default: `0`

### specFileRetriesDeferred

Whether or not retried spec files should be retried immediately or deferred to the end of the queue.

Type: `Boolean`<br /> Default: `true`

### services

सेवाएँ एक विशिष्ट कार्य लेती हैं जिसकी आप देखभाल नहीं करना चाहते हैं। वे लगभग बिना किसी प्रयास के आपके परीक्षण सेटअप को बढ़ाते हैं।

Type: `String[]|Object[]`<br /> Default: `[]`

### framework

WDIO टेस्टरनर द्वारा उपयोग किए जाने वाले परीक्षण ढांचे को परिभाषित करता है।

Type: `String`<br /> Default: `mocha`<br /> Options: `mocha` | `jasmine`

### mochaOpts, jasmineOpts and cucumberOpts


विशिष्ट ढांचे से संबंधित विकल्प। फ्रेमवर्क एडेप्टर दस्तावेज़ीकरण देखें, जिस पर विकल्प उपलब्ध हैं। Read more on this in [Frameworks](frameworks).

Type: `Object`<br /> Default: `{ timeout: 10000 }`

### cucumberFeaturesWithLineNumbers

लाइन नंबरों के साथ खीरे की विशेषताओं की सूची (जब [ककड़ी फ्रेमवर्क](./Frameworks.md#using-cucumber)का उपयोग कर रहा हो)।

Type: `String[]` Default: `[]`

### रिपोर्ट करने वाला

उपयोग करने के लिए पत्रकारों की सूची। रिपोर्टर या तो एक स्ट्रिंग या `['reporterName', { /* reporter options */}]`की एक सरणी हो सकता है, जहां पहला तत्व रिपोर्टर के नाम के साथ एक स्ट्रिंग है और दूसरा तत्व रिपोर्टर विकल्पों के साथ एक ऑब्जेक्ट है।

Type: `String[]|Object[]`<br /> Default: `[]`

उदाहरण:

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

यह निर्धारित करता है कि रिपोर्टर को किस अंतराल में जाँच करनी चाहिए कि क्या वे सिंक्रनाइज़ हैं यदि वे अपने लॉग को एसिंक्रोनस रूप से रिपोर्ट करते हैं (उदाहरण के लिए यदि लॉग किसी तृतीय पक्ष विक्रेता को स्ट्रीम किए जाते हैं)।

Type: `Number`<br /> Default: `100` (ms)

### reporterSyncTimeout

यह निर्धारित करता है कि रिपोर्टर को अपने सभी लॉग अपलोड करने का अधिकतम समय कब तक पूरा करना है जब तक कि टेस्टरनर द्वारा कोई त्रुटि नहीं डाली जा रही है।

Type: `Number`<br /> Default: `5000` (ms)

### execArgv

बाल प्रक्रियाओं को लॉन्च करते समय निर्दिष्ट करने के लिए नोड तर्क।

Type: `String[]`<br /> Default: `null`

### filesToWatch

स्ट्रिंग पैटर्न का समर्थन करने वाले ग्लोब की एक सूची जो टेस्टरनर को बताती है कि इसे `- watch` फ़्लैग के साथ चलाते समय अन्य फ़ाइलों, जैसे एप्लिकेशन फ़ाइलों को अतिरिक्त रूप से देखने के लिए कहा जाता है। डिफ़ॉल्ट रूप से टेस्टरनर पहले से ही सभी विशेष फाइलों को देखता है।

Type: `String[]`<br /> Default: `[]`

### autoCompileOpts

टाइपस्क्रिप्ट या बेबेल के साथ WebdriverIO का उपयोग करते समय संकलक विकल्प।

#### autoCompileOpts.autoCompile

यदि `true` पर सेट किया जाता है तो WDIO टेस्टरनर स्वचालित रूप से कल्पना फ़ाइलों को ट्रांसपाइल करने का प्रयास करेगा।

Type: `Boolean` Default: `true`

#### autoCompileOpts.tsNodeOpts

कॉन्फ़िगर करें कि कैसे [`ts-node`](https://www.npmjs.com/package/ts-node) फ़ाइलों को ट्रांसपाइल करने के लिए माना जाता है।

Type: `Object` Default: `{ transpileOnly: true }`

#### autoCompileOpts.babelOpts

कॉन्फ़िगर करें कि कैसे [](https://www.npmjs.com/package/@babel/register)ts-node फ़ाइलों को ट्रांसपाइल करने के लिए माना जाता है।

Type: `Object` Default: `{}`

## Hooks

WDIO टेस्टरनर आपको परीक्षण जीवनचक्र के विशिष्ट समय पर ट्रिगर होने के लिए हुक सेट करने की अनुमति देता है। यह कस्टम क्रियाओं की अनुमति देता है (उदाहरण के लिए यदि परीक्षण विफल हो जाता है तो स्क्रीनशॉट लें)।

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
- `result` (`object`): हुक परिणाम ( `error`, `result`, `duration`, `passed`, `गुणों को पुनः प्राप्त` करता है)

### beforeTest

परीक्षण से पहले क्रियान्वित किया जाने वाला कार्य (केवल मोचा/जेसमीन में)।

पैरामीटर:

- `suite` (`object`): सुइट विवरण
- `context` (`object`): स्कोप ऑब्जेक्ट परीक्षण के साथ निष्पादित किया गया था

### beforeCommand

WebdriverIO कमांड के निष्पादित होने से पहले चलता है।

पैरामीटर:

- `commandName` (`string`): कमांड नाम
- `args` (`*`): तर्क जो कमांड प्राप्त करेंगे

### afterCommand

WebdriverIO कमांड के निष्पादित होने से पहले चलता है।

पैरामीटर:

- `commandName` (`string`): कमांड नाम
- `args` (`*`): तर्क जो कमांड प्राप्त करेंगे
- `result` (`number`): 0 - कमांड सफलता, 1 - कमांड त्रुटि
- `error` (`error`): त्रुटि ऑब्जेक्ट यदि कोई हो

### afterTest

एक परीक्षण (मोचा/जेसमीन में) समाप्त होने के बाद निष्पादित किया जाने वाला फंक्शन।

पैरामीटर:

- `test` (`object`): परीक्षण विवरण
- `context` (`object`): स्कोप ऑब्जेक्ट परीक्षण के साथ निष्पादित किया गया था
- `result.error` (`Error`): परीक्षण विफल होने की स्थिति में त्रुटि वस्तु, अन्यथा `undefined`
- `result.result` (`Any`): परीक्षण फंक्शन की वापसी वस्तु
- `result.duration` (`Number`): मिलीसेकंड में परिदृश्य की अवधि
- `result.passed` (`Boolean`): यदि परिदृश्य पास हो गया है तो सच है
- `result.retries` (`Object`): विशिष्ट संबंधित पुनर्प्रयासों के लिए सूचना, उदाहरण के लिए `{ attempts: 0, limit: 0 }`
- `result` (`object`): हुक परिणाम ( `error`, `result`, `duration`, `passed`, `retries` गुणों को करता है)

### afterSuite

हुक जो सुइट शुरू होने से पहले निष्पादित हो जाता है

पैरामीटर:

- `suite` (`object`): सुइट विवरण

### after

सभी परीक्षण किए जाने के बाद निष्पादित हो जाता है। आपके पास अभी भी परीक्षण से सभी वैश्विक वेरिएबल तक पहुंच है।

पैरामीटर:

- `exitCode` (`number`): 0 - टेस्ट सफलता, 1 - टेस्ट असफल
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो वर्कर में पैदा होंगी
- `specs` (`string[]`): वर्कर प्रक्रिया में चलने के लिए स्पेक्स

### afterSession

वेबड्राइवर सत्र समाप्त करने के ठीक बाद निष्पादित हो जाता है।

पैरामीटर:

- `config` (`object`): WebdriverIO कॉन्फ़िगरेशन ऑब्जेक्ट
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो वर्कर में पैदा होंगी
- `specs` (`string[]`): वर्कर प्रक्रिया में चलने के लिए स्पेक्स

### onComplete

सभी कर्मचारियों के बंद हो जाने के बाद निष्पादित हो जाता है और प्रक्रिया समाप्त होने वाली है। ऑनकंप्लीट हुक में त्रुटि के परिणामस्वरूप परीक्षण रन विफल हो जाएगा।

पैरामीटर:

- `exitCode` (`number`): 0 - सफलता, 1 - असफल
- `config` (`object`): WebdriverIO कॉन्फ़िगरेशन ऑब्जेक्ट
- `caps` (`object`): सत्र के लिए क्षमताएं शामिल हैं जो वर्कर में पैदा होंगी
- `result` (`object`): परिणाम वस्तु जिसमें स्टेप परिणाम होते हैं

### onReload

रिफ्रेश होने पर निष्पादित हो जाता है।

पैरामीटर:

- `oldSessionId` (`string`): पुराने सत्र की सत्र आईडी
- `newSessionId` (`string`): नए सत्र की सत्र आईडी

### beforeFeature

कुकुम्बर फीचर से पहले चलता है।

पैरामीटर:

- `uri` (`string`): फीचर फ़ाइल का पथ
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): कुकुम्बर फीचर ऑब्जेक्ट

### afterFeature

कुकुम्बर फीचर से बाद चलता है।

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
