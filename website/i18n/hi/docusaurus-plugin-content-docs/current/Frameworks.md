---
id: frameworks
title: फ्रेमवर्क
---

WDIO रनर वर्तमान में [Mocha](http://mochajs.org/),  [Jasmine](http://jasmine.github.io/), और [कुकुम्बर](https://cucumber.io/)का समर्थन करता है।

WebdriverIO के साथ प्रत्येक ढांचे को एकीकृत करने के लिए, एनपीएम पर एडॉप्टर पैकेज हैं जिन्हें स्थापित किया जाना चाहिए। आप एडेप्टर को कहीं भी स्थापित नहीं कर सकते हैं; इन पैकेजों को उसी स्थान पर स्थापित किया जाना चाहिए जहाँ WebdriverIO स्थापित है। इसलिए, यदि आपने WebdriverIO को विश्व स्तर पर स्थापित किया है, तो विश्व स्तर पर एडेप्टर पैकेज को भी स्थापित करना सुनिश्चित करें।

आपकी विशिष्ट फ़ाइलों (या चरण परिभाषाओं) के भीतर, आप वैश्विक चर `browser`का उपयोग करके वेबड्राइवर उदाहरण तक पहुँच सकते हैं। आपको सेलेनियम सत्र आरंभ करने या समाप्त करने की आवश्यकता नहीं है। यह `wdio` परीक्षक द्वारा ध्यान रखा जाता है।)

## मोचा का उपयोग करना

सबसे पहले, एनपीएम से एडॉप्टर पैकेज इनस्टॉल करें:

```bash npm2yarn
एनपीएम इंस्टॉल @wdio/mocha-framework --save-dev
```

डिफ़ॉल्ट रूप से WebdriverIO एक [अभिकथन लाइब्रेरी](Assertion.md) प्रदान करता है जो अंतर्निहित है जिसमें आप तुरंत प्रारंभ कर सकते हैं:

```js
describe('my awesome website', () => {
    it('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

WebdriverIO Mocha के `BDD` (डिफ़ॉल्ट), `TDD`और `QUnit` [इंटरफेस](https://mochajs.org/#interfaces)का समर्थन करता है।

यदि आप अपने विनिर्देशों को TDD शैली में लिखना पसंद करते हैं, तो अपने `mochaOpts` कॉन्फ़िग में `ui` गुण को `tdd`पर सेट करें। अब आपकी टेस्ट फाइलें इस तरह लिखी जानी चाहिए:

```js
suite('my awesome website', () => {
    test('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

यदि आप अन्य मोचा-विशिष्ट सेटिंग्स को परिभाषित करना चाहते हैं, तो आप इसे अपनी कॉन्फ़िगरेशन फ़ाइल में `mochaOpts` कुंजी के साथ कर सकते हैं। सभी विकल्पों की सूची [मोचा परियोजना की वेबसाइट](https://mochajs.org/api/mocha)पर देखी जा सकती है।

__नोट:__ WebdriverIO मोचा में `done` कॉलबैक के बहिष्कृत उपयोग का समर्थन नहीं करता है:

```js
it('should test something', (done) => {
    done() // throws "done is not a function"
})
```

यदि आप कुछ एसिंक्रोनस रूप से चलाना चाहते हैं, तो आप या तो [`browser.call`](/docs/api/browser/call) कमांड या [कस्टम कमांड](CustomCommands.md)का उपयोग कर सकते हैं।

### मोचा विकल्प

आपके Mocha परिवेश को कॉन्फ़िगर करने के लिए आपके `wdio.conf.js` में निम्न विकल्प लागू किए जा सकते हैं। __नोट:__ सभी विकल्प समर्थित नहीं हैं, उदाहरण के लिए `parallel` विकल्प को लागू करने से त्रुटि होगी क्योंकि WDIO टेस्टरनर के पास समानांतर में परीक्षण चलाने का अपना तरीका है। हालांकि निम्नलिखित विकल्प समर्थित हैं:

#### require
जब आप कुछ बुनियादी कार्यक्षमता (वेबड्राइवरआईओ फ्रेमवर्क विकल्प) को जोड़ना या बढ़ाना चाहते हैं तो `require` विकल्प उपयोगी है।

Type: `string|string[]`<br /> Default: `[]`

#### compilers
फ़ाइलों को संकलित करने के लिए दिए गए मॉड्यूल(s) का उपयोग करें। कंपाइलर्स को आवश्यकता से पहले शामिल किया जाएगा (WebdriverIO फ्रेमवर्क विकल्प)।

Type: `string[]`<br /> Default: `[]`

#### allowUncaught
अनकही त्रुटियों का प्रचार करें।

Type: `boolean`<br /> Default: `false`

#### bail
पहले टेस्ट में फेल होने के बाद बेल

Type: `boolean`<br /> Default: `false`

#### checkLeaks
वैश्विक चर लीक के लिए जाँच करें।

Type: `boolean`<br /> Default: `false`

#### delay
देरी रूट सूट निष्पादन।

Type: `boolean`<br /> Default: `false`

#### fgrep
परीक्षण फ़िल्टर दिए गए स्ट्रिंग।

Type: `string`<br /> Default: `null`

#### forbidOnly
परीक्षण `only` सुइट में विफल रहता है।

Type: `boolean`<br /> Default: `false`

#### forbidPending
लंबित परीक्षण सूट विफल।

Type: `boolean`<br /> Default: `false`

#### fullTrace
विफलता पर पूर्ण स्टैकट्रेस।

Type: `boolean`<br /> Default: `false`

#### global
वैश्विक दायरे में अपेक्षित चर।

Type: `string[]`<br /> Default: `[]`

#### grep
टेस्ट फिल्टर रेगुलर एक्सप्रेशन दिया।

Type: `RegExp|string`<br /> Default: `null`

#### invert
उलटा परीक्षण फ़िल्टर मिलान करता है।

Type: `boolean`<br /> Default: `false`

#### retries
असफल परीक्षणों का पुन: प्रयास करने की संख्या।

Type: `number`<br /> Default: `0`

#### timeout
टाइमआउट थ्रेशोल्ड मान (मिलीसेकंड में).

Type: `number`<br /> Default: `30000`

## जेसमीन का प्रयोग

सबसे पहले, एनपीएम से एडॉप्टर पैकेज इनस्टॉल करें:

```bash npm2yarn
npm install @wdio/jasmine-framework --save-dev
```

फिर आप अपने कॉन्फ़िगरेशन में `jasmineOpts` गुण सेट करके अपने Jasmine परिवेश को कॉन्फ़िगर कर सकते हैं. सभी विकल्पों की सूची [मोचा परियोजना की वेबसाइट](https://jasmine.github.io/api/3.5/Configuration.html)पर देखी जा सकती है।

### अवरोधन अभिकथन

जैस्मीन फ्रेमवर्क इसे परिणाम के आधार पर एप्लिकेशन या वेबसाइट की स्थिति को लॉग करने के लिए प्रत्येक अभिकथन को इंटरसेप्ट करने की अनुमति देता है।

उदाहरण के लिए, हर बार एक दावा विफल होने पर स्क्रीनशॉट लेना बहुत आसान होता है। आपके `jasmineOpts` में आप `expectationResultHandler` नामक एक संपत्ति जोड़ सकते हैं जो एक फ़ंक्शन को निष्पादित करने के लिए लेता है। फ़ंक्शन के पैरामीटर अभिकथन के परिणाम के बारे में जानकारी प्रदान करते हैं।

निम्न उदाहरण दर्शाता है कि यदि कोई अभिकथन विफल हो जाता है तो स्क्रीनशॉट कैसे लिया जाए:

```js
jasmineOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function(passed, assertion) {
        /**
         * only take screenshot if assertion failed
         */
        if(passed) {
            return
        }

        browser.saveScreenshot(`assertionError_${assertion.error.message}.png`)
    }
},
```

**नोट:** आप कुछ async करने के लिए परीक्षण निष्पादन को रोक नहीं सकते। ऐसा हो सकता है कि कमांड में बहुत अधिक समय लगे और वेबसाइट की स्थिति बदल गई हो। (हालांकि आम तौर पर, अन्य 2 कमांड के बाद भी स्क्रीनशॉट लिया जाता है, जो अभी भी त्रुटि के बारे में _कुछ_ मूल्यवान जानकारी देता है।)

### जेसमीन विकल्प

निम्नलिखित विकल्पों को आपके `wdio.conf.js` में `cucumberOpts` गुण का उपयोग करके अपने खीरा वातावरण को कॉन्फ़िगर करने के लिए लागू किया जा सकता है: इन कॉन्फ़िगरेशन विकल्पों पर अधिक जानकारी के लिए, [जैस्मीन डॉक्स](https://jasmine.github.io/api/edge/Configuration)देखें।

#### defaultTimeoutInterval
जैस्मीन संचालन के लिए डिफ़ॉल्ट टाइमआउट अंतराल।

Type: `number`<br /> Default: `60000`

#### helpers
चमेली चश्मा से पहले शामिल करने के लिए spec_dir के सापेक्ष फ़ाइलपथ (और ग्लोब) की सरणी।

Type: `string[]`<br /> Default: `[]`

#### requires
जब आप कुछ बुनियादी कार्यक्षमता को जोड़ना या बढ़ाना चाहते हैं तो `require` विकल्प उपयोगी है।

Type: `string[]`<br /> Default: `[]`

#### random
क्या विशिष्ट निष्पादन आदेश को यादृच्छिक बनाना है.

Type: `boolean`<br /> Default: `true`

#### seed
यादृच्छिककरण के आधार के रूप में उपयोग करने के लिए सीड। निष्पादन की शुरुआत में बीज को बेतरतीब ढंग से निर्धारित करने के लिए नल का कारण बनता है।

Type: `Function`<br /> Default: `null`

#### failSpecWithNoExpectations
क्या स्पेक्स को विफल करना है यदि यह कोई अपेक्षा नहीं रखता है। डिफ़ॉल्ट रूप से एक युक्ति जो बिना किसी अपेक्षा के चलती है, को पारित होने के रूप में रिपोर्ट किया जाता है। इसे सही पर सेट करने से ऐसे विनिर्देश की विफलता के रूप में रिपोर्ट की जाएगी।

Type: `boolean`<br /> Default: `false`

#### oneFailurePerSpec
क्या विशिष्टताओं को उत्पन्न करना है या नहीं, केवल एक अपेक्षा विफल है।

Type: `boolean`<br /> Default: `false`

#### specFilter
स्पेक्स फ़िल्टर उपयोग करने के लिए फंक्शन।

Type: `Function`<br /> Default: `(spec) => true`

#### grep
केवल इस स्ट्रिंग या regexp से मेल खाने वाले परीक्षण चलाएँ। (केवल तभी लागू होता है जब कोई कस्टम `specFilter` फ़ंक्शन सेट न हो)

Type: `string|Regexp`<br /> Default: `null`

#### invertGrep
यदि सही है तो यह मेल खाने वाले परीक्षणों को उलट देता है और केवल ऐसे परीक्षण चलाता है जो `grep`में प्रयुक्त अभिव्यक्ति से मेल नहीं खाते हैं। (केवल तभी लागू होता है जब कोई कस्टम `specFilter` फ़ंक्शन सेट न हो)

Type: `boolean`<br /> Default: `false`

## कुकुम्बर का उपयोग

सबसे पहले, एनपीएम से एडॉप्टर पैकेज इनस्टॉल करें:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

यदि आप कुकुम्बर का उपयोग करना चाहते हैं, तो `framework` प्रॉपर्टी को `cucumber` में `framework: 'cucumber'` जोड़कर [कॉन्फिग फाइल](ConfigurationFile.md)।

कुकुम्बर के लिए विकल्प कॉन्फ़िग फ़ाइल में `cucumberOpts`के साथ दिए जा सकते हैं। विकल्पों की पूरी सूची देखें [यहाँ](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options)।

कुकुम्बर के साथ जल्दी उठने और दौड़ने के लिए, हमारे [`cucumber-boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) प्रोजेक्ट पर एक नज़र डालें, जो उन सभी चरण परिभाषाओं के साथ आता है जिनकी आपको घूरने की ज़रूरत है, और आप तुरंत फ़ीचर फ़ाइलें लिख रहे होंगे।

### कुकुम्बर विकल्प

निम्नलिखित विकल्पों को आपके `wdio.conf.js` में `cucumberOpts` गुण का उपयोग करके अपने खीरा वातावरण को कॉन्फ़िगर करने के लिए लागू किया जा सकता है:

#### backtrace
त्रुटियों के लिए पूर्ण बैकट्रैक दिखाएं।

Type: `Boolean`<br /> Default: `true`

#### requireModule
किसी भी समर्थन फ़ाइल की आवश्यकता से पहले मॉड्यूल की आवश्यकता होती है।

Type: `string[]`<br /> Default: `[]`<br /> Example:

```js
cucumberOpts: {
    requireModule: ['@babel/register']
    // or
    requireModule: [
        [
            '@babel/register',
            {
                rootMode: 'upward',
                ignore: ['node_modules']
            }
        ]
    ]
 }
 ```

#### failAmbiguousDefinitions
अस्पष्ट परिभाषाओं को त्रुटियों के रूप में मानें। कृपया ध्यान दें कि यह `@wdio/cucumber-framework` विशिष्ट विकल्प है और इसे खीरा-js द्वारा ही पहचाना नहीं गया है।

Type: `boolean`<br /> Default: `false`

#### failFast
पहली बार असफल होने पर रन होने को रोक दें।

Type: `boolean`<br /> Default: `false`

#### ignoreUndefinedDefinitions
अपरिभाषित परिभाषाओं को चेतावनियों के रूप में मानें। कृपया ध्यान दें कि यह @wdio/cucumber-framework विशिष्ट विकल्प है और इसे cucumber-js द्वारा ही पहचाना नहीं गया है।

Type: `boolean`<br /> Default: `false`

#### names
केवल उन परिदृश्यों को निष्पादित करें जिनके नाम अभिव्यक्ति (दोहराने योग्य) से मेल खाते हैं।

Type: `RegExp[]`<br /> Default: `[]`

#### profile
उपयोग करने के लिए प्रोफ़ाइल निर्दिष्ट करें।

Type: `string[]`<br /> Default: `[]`

#### require
सुविधाओं को निष्पादित करने से पहले आपकी चरण परिभाषाओं वाली फ़ाइलों की आवश्यकता होती है। आप अपनी चरण परिभाषाओं के लिए एक ग्लोब भी निर्दिष्ट कर सकते हैं।

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### snippetSyntax
एक कस्टम स्निपेट सिंटैक्स निर्दिष्ट करें।

Type: `string`<br /> Default: `null`

#### snippets
लंबित चरणों के लिए चरण परिभाषा स्निपेट छुपाएं.

Type: `boolean`<br /> Default: `true`

#### source
स्रोत यूरी छुपाएं।

Type: `boolean`<br /> Default: `true`

#### strict
कोई अपरिभाषित या लंबित चरण होने पर विफल।

Type: `boolean`<br /> Default: `false`

#### tagExpression
अभिव्यक्ति से मेल खाने वाले टैग के साथ केवल सुविधाओं या परिदृश्यों को निष्पादित करें। अधिक विवरण के लिए कृपया [कुकुम्बर दस्तावेज़](https://docs.cucumber.io/cucumber/api/#tag-expressions) देखें।

Type: `string`<br /> Default: `null`

#### tagsInTitle
फीचर या परिदृश्य नाम में कुकुम्बर टैग जोड़ें।

Type: `boolean`<br /> Default: `false`

#### timeout
स्टेप परिभाषाओं के लिए मिलीसेकंड में टाइमआउट।

Type: `number`<br /> Default: `30000`

### कुकुम्बर में स्किपिंग परीक्षण

ध्यान दें कि यदि आप `cucumberOpts`में उपलब्ध नियमित खीरा परीक्षण फ़िल्टरिंग क्षमताओं का उपयोग करके एक परीक्षण छोड़ना चाहते हैं, तो आप इसे क्षमताओं में कॉन्फ़िगर किए गए सभी ब्राउज़रों और उपकरणों के लिए करेंगे। यदि आवश्यक न हो तो सत्र शुरू किए बिना केवल विशिष्ट क्षमताओं के संयोजन के लिए परिदृश्यों को छोड़ने में सक्षम होने के लिए, वेबड्राइवरियो ककड़ी के लिए निम्नलिखित विशिष्ट टैग सिंटैक्स प्रदान करता है:

`@skip([condition])`

वेयर स्थिति उनके मानों के साथ क्षमताओं गुणों का एक वैकल्पिक संयोजन है, जब **सभी** से मेल खाते हैं, तो टैग किए गए परिदृश्य या सुविधा को छोड़ दिया जाता है। बेशक आप कई अलग-अलग परिस्थितियों में परीक्षण छोड़ने के लिए परिदृश्यों और सुविधाओं में कई टैग जोड़ सकते हैं।

आप `टैगएक्सप्रेशन' को बदले बिना परीक्षण छोड़ने के लिए '@tagExpression' का भी उपयोग कर सकते हैं। इस मामले में छोड़े गए टेस्ट को टेस्ट रिपोर्ट में प्रदर्शित किए जाएंगे।

यहाँ आपके पास इस सिंटैक्स के कुछ उदाहरण हैं:
- `@skip` या `@skip()`: टैग किए गए आइटम को हमेशा छोड़ देगा
- `@skip(browserName="chrome")`: क्रोम ब्राउज़र के विरुद्ध परीक्षण निष्पादित नहीं किया जाएगा।
- `@skip(browserName="firefox";platformName="linux")`: लिनक्स निष्पादन पर फ़ायरफ़ॉक्स में परीक्षण को छोड़ देगा।
- `@skip(browserName=["chrome","firefox"])`: टैग किए गए आइटम क्रोम और फ़ायरफ़ॉक्स दोनों ब्राउज़रों के लिए छोड़ दिए जाएंगे।
- `@skip(browserName=/i.*explorer/`: regexp से मेल खाने वाले ब्राउज़र की क्षमताओं को छोड़ दिया जाएगा (जैसे `iexplorer`, `internet Explorer`, `internet-explorer`, ...)।

### इम्पोर्ट स्टेप डेफिनिशन हेल्पर

स्टेप डेफिनिशन हेल्पर जैसे `Given`, `When` या `Then` या हुक का उपयोग करने के लिए, आपको `@cucumber/cucumber`से आयात करने का अनुमान है, उदाहरण के लिए:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

अब, यदि आप WebdriverIO से असंबंधित अन्य प्रकार के परीक्षणों के लिए पहले से ही ककड़ी का उपयोग करते हैं, जिसके लिए आप एक विशिष्ट संस्करण का उपयोग करते हैं, तो आपको इन सहायकों को WebdriverIO ककड़ी पैकेज से अपने e2e परीक्षणों में आयात करने की आवश्यकता होती है, जैसे:

```js
import { Given, When, Then } from '@wdio/cucumber-framework'
```

यह सुनिश्चित करता है कि आप WebdriverIO ढांचे के भीतर सही सहायकों का उपयोग करते हैं और आपको अन्य प्रकार के परीक्षण के लिए एक स्वतंत्र ककड़ी संस्करण का उपयोग करने की अनुमति देता है।
