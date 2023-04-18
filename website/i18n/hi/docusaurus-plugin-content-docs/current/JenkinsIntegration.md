---
id: jenkins
title: Jenkins
---

WebdriverIO offers a tight integration to CI systems like [Jenkins](https://jenkins-ci.org). With the `junit` reporter, you can easily debug your tests as well as keep track of your test results. The integration is pretty easy.

1. Install the `junit` test reporter: `$ npm install @wdio/junit-reporter --save-dev`)
1. Update your config to save your XUnit results where Jenkins can find them, (and specify the `junit` reporter):

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './'
        }]
    ],
    // ...
}
```

It is up to you which framework to choose. The reports will be similar. For this tutorial, we’ll use Jasmine.

After you have written couple of tests, you can setup a new Jenkins job. Give it a name and a description:

![Name And Description](/img/jenkins/jobname.png "Name And Description")

Then make sure it grabs always the newest version of your repository:

![जेनकींस गिट सेटअप](/img/jenkins/gitsetup.png "जेनकींस गिट सेटअप")

**अब महत्वपूर्ण हिस्सा:** शेल कमांड को निष्पादित करने के लिए `build` चरण बनाएं। आपके प्रोजेक्ट को बनाने के लिए `build` चरण की आवश्यकता है। चूंकि यह डेमो प्रोजेक्ट केवल बाहरी ऐप का परीक्षण करता है, इसलिए आपको कुछ भी बनाने की आवश्यकता नहीं है। बस नोड निर्भरताओं को इंस्टाल करें और कमांड चलायें `npm test` (which is an alias for `node_modules/.bin/wdio test/wdio.conf.js`)

यदि आपने AnsiColor जैसा प्लगइन इंस्टाल किया है, लेकिन लॉग अभी भी रंगीन नहीं हैं, तो पर्यावरण चर `FORCE_COLOR=1` (जैसे, `FORCE_COLOR=1 npm test`) के साथ परीक्षण चलाएँ।

![बिल्ड स्टेप](/img/jenkins/runjob.png "बिल्ड स्टेप")

आपके परीक्षण के बाद, आप चाहते हैं कि जेनकींस आपकी XUnit रिपोर्ट को ट्रैक करे। ऐसा करने के लिए, आपको _"JUnit परीक्षा परिणाम रिपोर्ट प्रकाशित करें"_नामक पोस्ट-बिल्ड क्रिया जोड़नी होगी।

आप अपनी रिपोर्ट पर नज़र रखने के लिए एक बाहरी XUnit प्लगइन भी इंस्टाल कर सकते हैं। JUnit एक बुनियादी जेनकींस स्थापना के साथ आता है और अभी के लिए पर्याप्त है।

कॉन्फ़िगरेशन फ़ाइल के अनुसार, XUnit रिपोर्ट प्रोजेक्ट की रूट डायरेक्टरी में सहेजी जाएगी। ये रिपोर्ट एक्सएमएल फाइलें हैं। इसलिए, रिपोर्ट को ट्रैक करने के लिए आपको बस इतना करना है कि जेनकींस को अपनी रूट निर्देशिका में सभी एक्सएमएल फाइलों पर इंगित करें:

![पोस्ट-बिल्ड एक्शन](/img/jenkins/postjob.png "पोस्ट-बिल्ड एक्शन")

इतना ही! अब आपने अपने WebdriverIO जॉब चलाने के लिए Jenkins को सेट अप कर लिया है। आपका कार्य अब इतिहास चार्ट के साथ विस्तृत परीक्षा परिणाम प्रदान करेगा, विफल कार्यों पर स्टैकट्रेस जानकारी, और प्रत्येक परीक्षण में उपयोग किए गए पेलोड के साथ कमांड की एक सूची।

![जेनकींस अंतिम एकीकरण](/img/jenkins/final.png "जेनकींस अंतिम एकीकरण")
