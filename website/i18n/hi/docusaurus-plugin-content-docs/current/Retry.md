---
id: retry
title: फ्लेकी परीक्षण का पुनः प्रयास करें
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

आप वेबड्राइवरआईओ टेस्टरनर के साथ कुछ परीक्षणों को फिर से चला सकते हैं जो परतदार नेटवर्क या दौड़ की स्थिति जैसी चीजों के कारण अस्थिर हो जाते हैं। (हालांकि, यदि परीक्षण अस्थिर हो जाते हैं तो केवल पुन: दौड़ दर बढ़ाने की अनुशंसा नहीं की जाती है!)

## मोचा में सुइट्स फिर से चलाएं

मोचा के संस्करण 3 के बाद से, आप पूरे टेस्ट सूट को फिर से चला सकते हैं (`describe`ब्लोक के अंदर सब कुछ का वर्णन करता है)। यदि आप मोचा का उपयोग करते हैं तो आपको WebdriverIO कार्यान्वयन के बजाय इस पुनर्प्रयास तंत्र का समर्थन करना चाहिए जो आपको केवल कुछ परीक्षण ब्लॉकों को फिर से चलाने की अनुमति देता है (सब कुछ `it` ब्लॉक के भीतर)। `this.retries()` विधि का उपयोग करने के लिए, सुइट ब्लॉक `describe` एक अनबाउंड फ़ंक्शन `function(){}` का उपयोग करना चाहिए, जैसा कि फैट एरो फ़ंक्शन `() => {}`में वर्णित है [मोचा डॉक्स](https://mochajs.org/#arrow-functions)। मोचा का उपयोग करके आप अपने `wdio.conf.js`में `mochaOpts.retries` उपयोग करके सभी विशिष्टताओं के लिए पुनः प्रयास संख्या भी सेट कर सकते हैं।

यहाँ एक उदाहरण है:

```js
describe('retries', function () {
    // Retry all tests in this suite up to 4 times
    this.retries(4)

    beforeEach(async () => {
        await browser.url('http://www.yahoo.com')
    })

    it('should succeed on the 3rd try', async function () {
        // Specify this test to only retry up to 2 times
        this.retries(2)
        console.log('run')
        await expect($('.foo')).toBeDisplayed()
    })
})
```

## चमेली या मोचा में एकल परीक्षण फिर से चलाएँ

एक निश्चित परीक्षण ब्लॉक को फिर से चलाने के लिए आप परीक्षण ब्लॉक फ़ंक्शन के बाद अंतिम पैरामीटर के रूप में फिर से दौड़ की संख्या लागू कर सकते हैं:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 ]
}>
<TabItem value="mocha">

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', async function () {
        console.log(this.wdioRetries) // returns number of retries
        // ...
    }, 3)
})
```

The same works for hooks too:

```js
describe('my flaky app', () => {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(async () => {
        // ...
    }, 1)

    // ...
})
```

</TabItem>
<TabItem value="jasmine">

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', async function () {
        console.log(this.wdioRetries) // returns number of retries
        // ...
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 3)
})
```

The same works for hooks too:

```js
describe('my flaky app', () => {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(async () => {
        // ...
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 1)

    // ...
})
```

यदि आप जैस्मीन का उपयोग कर रहे हैं, तो दूसरा पैरामीटर टाइमआउट के लिए आरक्षित है। पुनर्प्रयास पैरामीटर लागू करने के लिए आपको टाइमआउट को इसके डिफ़ॉल्ट मान `jasmine.DEFAULT_TIMEOUT_INTERVAL` पर सेट करना होगा और फिर अपनी पुनःप्रयास संख्या लागू करनी होगी।

</TabItem>
</Tabs>

यह पुनर्प्रयास तंत्र केवल एकल हुक या परीक्षण ब्लॉकों को पुन: प्रयास करने की अनुमति देता है। यदि आपका परीक्षण आपके आवेदन को स्थापित करने के लिए हुक के साथ है, तो यह हुक नहीं चल रहा है। [मोचा](https://mochajs.org/#retry-tests) मूल परीक्षण पुनर्प्रयास प्रदान करता है जो यह व्यवहार प्रदान करता है जबकि जैस्मीन ऐसा नहीं करती है। आप ` afterTest ` हुक में निष्पादित पुनर्प्रयासों की संख्या तक पहुँच सकते हैं।

## ककड़ी में फिर से दौड़ना

### ककड़ी में पूर्ण सुइट फिर से चलाएँ

ककड़ी के लिए >=6 yआप प्रदान कर सकते हैं [`retry`](https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#retry-failing-tests) विन्यास विकल्प के साथ एक`retryTagFilter` वैकल्पिक पैरामीटर प्रदान कर सकते हैं ताकि आपके सभी या कुछ असफल परिदृश्य सफल होने तक अतिरिक्त पुनर्प्रयास प्राप्त कर सकें। इस सुविधा के काम करने के लिए आपको `scenarioLevelReporter` to `true`. सेट करने की आवश्यकता है।

### ककड़ी में पुन: चलाएँ चरण परिभाषाएँ

एक निश्चित कदम परिभाषा के लिए एक पुन: दौड़ दर को परिभाषित करने के लिए बस इसके लिए एक पुनः प्रयास विकल्प लागू करें, जैसे:

```js
module.exports = function () {
    /**
     * step definition that runs max 3 times (1 actual run + 2 reruns)
     */
    this.Given(/^some step definition$/, { wrapperOptions: { retry: 2 } }, async () => {
        // ...
    })
    // ...
})
```

Reruns को केवल आपकी स्टेप डेफिनिशन फाइल में परिभाषित किया जा सकता है, आपकी फीचर फाइल में कभी नहीं।

## प्रति-निर्दिष्ट फ़ाइल के आधार पर पुनर्प्रयास जोड़ें

पहले, केवल परीक्षण- और सूट-स्तरीय पुनर्प्रयास उपलब्ध थे, जो ज्यादातर मामलों में ठीक हैं।

लेकिन किसी भी परीक्षण में जिसमें राज्य शामिल है (जैसे कि सर्वर पर या डेटाबेस में) पहली परीक्षा विफलता के बाद राज्य को अमान्य छोड़ दिया जा सकता है। किसी भी बाद के पुनर्प्रयासों को अमान्य स्थिति के कारण पास होने का कोई मौका नहीं मिल सकता है।

प्रत्येक विशिष्ट फ़ाइल के लिए एक नया `browser` उदाहरण बनाया गया है, जो इसे किसी भी अन्य राज्यों (सर्वर, डेटाबेस) को हुक और सेटअप करने के लिए एक आदर्श स्थान बनाता है। इस स्तर पर पुनर्प्रयास का मतलब है कि पूरी सेटअप प्रक्रिया को बस दोहराया जाएगा, जैसे कि यह एक नई युक्ति के लिए हो।

```js
module.exports = function () {
    /**
     * The number of times to retry the entire specfile when it fails as a whole
     */
    specFileRetries: 1,
    /**
     * Delay in seconds between the spec file retry attempts
     */
    specFileRetriesDelay: 0,
    /**
     * Retried specfiles are inserted at the beginning of the queue and retried immediately
     */
    specFileRetriesDeferred: false
}
```

## एक विशिष्ट परीक्षण कई बार चलाएं

यह परतदार परीक्षणों को कोडबेस में पेश होने से रोकने में मदद करने के लिए है। `--multi-run` cli विकल्प जोड़कर यह निर्दिष्ट परीक्षण(ओं) या सुइट(रों) को x संख्या में चलाएगा। इस cli फ़्लैग का उपयोग करते समय `--spec` या `--suite` फ़्लैग को भी निर्दिष्ट किया जाना चाहिए।

एक कोडबेस में नए परीक्षण जोड़ते समय, विशेष रूप से सीआई/सीडी प्रक्रिया के माध्यम से परीक्षण पारित हो सकते हैं और विलय हो सकते हैं लेकिन बाद में परतदार हो जाते हैं। यह चंचलता कई चीजों से आ सकती है जैसे नेटवर्क समस्याएँ, सर्वर लोड, डेटाबेस आकार, आदि। आपकी सीडी/सीडी प्रक्रिया में `--multi-run` फ़्लैग का उपयोग करने से इन परतदार परीक्षणों को पकड़ने में मदद मिल सकती है, इससे पहले कि वे एक मुख्य कोडबेस में विलय हो जाएँ।

उपयोग करने की एक रणनीति आपके सीआई/सीडी प्रक्रिया में नियमित रूप से अपने परीक्षण चलाती है, लेकिन यदि आप एक नया परीक्षण शुरू कर रहे हैं तो आप `--spec` में `--multi के साथ निर्दिष्ट नए विनिर्देश के साथ परीक्षणों का एक और सेट चला सकते हैं। -run` तो यह नई परीक्षा x संख्या को कई बार चलाता है। यदि परीक्षण उनमें से किसी भी समय विफल रहता है तो परीक्षण विलय नहीं होगा और यह देखने की आवश्यकता होगी कि यह विफल क्यों हुआ।

```sh
# This will run the example.e2e.js spec 5 times
npx wdio run ./wdio.conf.js --spec example.e2e.js --multi-run 5
```