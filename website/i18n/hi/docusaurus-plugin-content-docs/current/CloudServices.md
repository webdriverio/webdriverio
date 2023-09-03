---
id: cloudservices
title: क्लाउड सेवाओं का उपयोग करना
---

Using on-demand services like Sauce Labs, Browserstack, TestingBot, CrossBrowserTesting, LambdaTest or Perfecto with WebdriverIO is pretty simple. आपको केवल अपनी सेवा के `user` और `key` को अपने विकल्पों में सेट करना है।

वैकल्पिक रूप से, आप `build`जैसी क्लाउड-विशिष्ट क्षमताओं को सेट करके अपने परीक्षण को पैरामीट्रिज भी कर सकते हैं। यदि आप केवल ट्रैविस में क्लाउड सेवाएं चलाना चाहते हैं, तो आप ट्रैविस में हैं या नहीं यह जांचने के लिए `CI` पर्यावरण चर का उपयोग कर सकते हैं और तदनुसार कॉन्फ़िगरेशन को संशोधित कर सकते हैं।

```js
// wdio.conf.js
export let config = {...}
if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME
    config.key = process.env.SAUCE_ACCESS_KEY
}
```

## Sauce Labs

आप [सॉस लैब्स](https://saucelabs.com)में दूरस्थ रूप से चलाने के लिए अपने परीक्षण सेट अप कर सकते हैं।

केवल आवश्यकता यह है कि आप अपने कॉन्फिग में `user` और `key` सेट करें (या तो `wdio.conf.js` द्वारा निर्यात किया गया या `webdriverio.remote(...)`में पारित किया गया) आपके ब्राउज़रस्टैक स्वचालित उपयोगकर्ता नाम और एक्सेस कुंजी पर.

आप किसी भी वैकल्पिक [समर्थित क्षमता](https://docs.saucelabs.com/dev/test-configuration-options/) किसी भी ब्राउज़र की क्षमताओं में कुंजी/मान के रूप में पास कर सकते हैं।

### Sauce Connect

यदि आप किसी ऐसे सर्वर के खिलाफ परीक्षण चलाना चाहते हैं जो इंटरनेट तक पहुंच योग्य नहीं है (जैसे `localhost`पर), तो आपको [लोकल टेस्टिंग ](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)का उपयोग करने की आवश्यकता है।

यह इसका समर्थन करने के लिए WebdriverIO के दायरे से बाहर है, इसलिए आपको इसे अपने आप से शुरू करना होगा।

यदि आप WDIO टेस्टरनर का उपयोग कर रहे हैं, तो अपने `wdio.conf.js`में [`@wdio/testingbot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) को डाउनलोड और कॉन्फ़िगर करें। यह सॉस कनेक्ट को चलाने में मदद करता है और अतिरिक्त सुविधाओं के साथ आता है जो आपके परीक्षणों को सॉस सेवा में बेहतर ढंग से एकीकृत करता है।

### Travis CI के साथ

Travis CI, हालांकि, प्रत्येक परीक्षण से पहले सॉस कनेक्ट शुरू करने के लिए [के पास समर्थन](http://docs.travis-ci.com/user/sauce-connect/#Setting-up-Sauce-Connect) है, इसलिए उसके लिए उनके निर्देशों का पालन करना एक विकल्प है।

यदि आप ऐसा करते हैं, तो आपको प्रत्येक ब्राउज़र की `capabilities`में `tunnel-identifier` परीक्षण कॉन्फ़िगरेशन विकल्प सेट करना होगा। ट्रैविस इसे डिफ़ॉल्ट रूप से `TRAVIS_JOB_NUMBER` पर्यावरण चर पर सेट करता है।

साथ ही, यदि आप चाहते हैं कि सॉस लैब्स आपके परीक्षणों को बिल्ड नंबर के आधार पर समूहित करें, तो आप `build` से `TRAVIS_BUILD_NUMBER`सेट कर सकते हैं।

अंत में, यदि आप `name`सेट करते हैं, तो यह इस निर्माण के लिए सॉस लैब्स में इस परीक्षण का नाम बदल देता है। यदि आप [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) के साथ संयुक्त WDIO टेस्टरनर का उपयोग कर रहे हैं तो WebdriverIO स्वचालित रूप से परीक्षण के लिए उचित नाम सेट करता है।

उदाहरण `capabilities`:

```javascript
browserName: 'chrome',
version: '27.0',
platform: 'XP',
'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
name: 'integration',
build: process.env.TRAVIS_BUILD_NUMBER
```

### समय समाप्त

चूंकि आप अपने परीक्षण रिमोट रूप से चला रहे हैं, इसलिए कुछ टाइमआउट बढ़ाना आवश्यक हो सकता है।

आप परीक्षण कॉन्फ़िगरेशन विकल्प के रूप में `idle-timeout` पास करके [निष्क्रिय टाइमआउट](https://docs.saucelabs.com/dev/test-configuration-options/#idletimeout) को बदल सकते हैं। यह नियंत्रित करता है कि कनेक्शन बंद करने से पहले सॉस कमांड के बीच कितनी देर प्रतीक्षा करेगा।

## BrowserStack

WebdriverIO में [Browserstack](https://www.browserstack.com) इंटीग्रेशन बिल्ट-इन भी है।

केवल आवश्यकता यह है कि आप अपने कॉन्फिग में `user` और `key` सेट करें (या तो `wdio.conf.js` द्वारा निर्यात किया गया या `webdriverio.remote(...)`में पारित किया गया) आपके ब्राउज़रस्टैक स्वचालित उपयोगकर्ता नाम और एक्सेस कुंजी पर.

आप किसी भी वैकल्पिक [समर्थित क्षमता](https://www.browserstack.com/automate/capabilities) किसी भी ब्राउज़र की क्षमताओं में कुंजी/मान के रूप में पास कर सकते हैं। यदि आप `Browserstack.debug` से `True` सेट करते हैं तो यह सत्र का एक स्क्रीनकास्ट रिकॉर्ड करेगा, जो सहायक हो सकता है।

### लोकल टेस्टिंग

यदि आप किसी ऐसे सर्वर के खिलाफ परीक्षण चलाना चाहते हैं जो इंटरनेट तक पहुंच योग्य नहीं है (जैसे `localhost`पर), तो आपको [लोकल टेस्टिंग ](https://www.browserstack.com/local-testing#command-line)का उपयोग करने की आवश्यकता है।

यह इसका समर्थन करने के लिए WebdriverIO के दायरे से बाहर है, इसलिए आपको इसे अपने आप से शुरू करना होगा।

यदि आप लोकल का उपयोग करते हैं, तो आपको अपनी क्षमताओं में `browserstack.local` को `true` सेट करना चाहिए।

यदि आप WDIO टेस्टरनर का उपयोग कर रहे हैं, तो अपने `wdio.conf.js`में [`@wdio/browserstack-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-browserstack-service) को डाउनलोड और कॉन्फ़िगर करें। यह BrowserStack को चलाने में मदद करता है, और अतिरिक्त सुविधाओं के साथ आता है जो आपके परीक्षणों को BrowserStack सेवा में बेहतर ढंग से एकीकृत करता है।

### Travis CI के साथ

यदि आप ट्रैविस में लोकल टेस्टिंग जोड़ना चाहते हैं, तो आपको इसे स्वयं ही प्रारंभ करना होगा।

निम्न स्क्रिप्ट बैकग्राउंड में इसे डाउनलोड और प्रारंभ करेगी। परीक्षण शुरू करने से पहले आपको इसे ट्रैविस में चलाना चाहिए।

```sh
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip
./BrowserStackLocal -v -onlyAutomate -forcelocal $BROWSERSTACK_ACCESS_KEY &
sleep 3
```

साथ ही, आप `build` को ट्रैविस बिल्ड नंबर पर सेट करना चाह सकते हैं।

उदाहरण `capabilities`:

```javascript
browserName: 'chrome',
project: 'myApp',
version: '44.0',
build: `myApp #${process.env.TRAVIS_BUILD_NUMBER}.${process.env.TRAVIS_JOB_NUMBER}`,
'browserstack.local': 'true',
'browserstack.debug': 'true'
```

## TestingBot

केवल आवश्यकता यह है कि आप अपने कॉन्फ़िगरेशन में `user` और `key` सेट करें (या तो `wdio.conf.js` द्वारा निर्यात किया गया या `webdriverio.remote(...)`में पास किया गया) आपके [TestingBot](https://testingbot.com) उपयोगकर्ता नाम और सीक्रेट कुंजी।

आप किसी भी वैकल्पिक [समर्थित क्षमता](https://testingbot.com/support/other/test-options) किसी भी ब्राउज़र की क्षमताओं में कुंजी/मान के रूप में पास कर सकते हैं।

### लोकल टेस्टिंग

यदि आप किसी ऐसे सर्वर के खिलाफ परीक्षण चलाना चाहते हैं जो इंटरनेट तक पहुंच योग्य नहीं है (जैसे `localhost`पर), तो आपको [लोकल टेस्टिंग ](https://testingbot.com/support/other/tunnel)का उपयोग करने की आवश्यकता है। TestingBot एक जावा-आधारित सुरंग प्रदान करता है जिससे आप उन वेबसाइटों का परीक्षण कर सकते हैं जो इंटरनेट से सुलभ नहीं हैं।

उनके टनल सपोर्ट पेज में इसे शुरू करने और चलाने के लिए आवश्यक जानकारी है।

यदि आप WDIO टेस्टरनर का उपयोग कर रहे हैं, तो अपने `wdio.conf.js`में [`@wdio/testingbot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-testingbot-service) को डाउनलोड और कॉन्फ़िगर करें। यह BrowserStack को चलाने में मदद करता है, और अतिरिक्त सुविधाओं के साथ आता है जो आपके परीक्षणों को BrowserStack सेवा में बेहतर ढंग से एकीकृत करता है।

## CrossBrowserTesting

एकमात्र आवश्यकता आपके कॉन्फ़िगरेशन में `user`और `key` सेट करना है (या तो `wdio.conf.js` द्वारा निर्यात किया जाता है या `webdriverio में पास किया जाता है).remote(...)`) आपके [CrossBrowserTesting](https://crossbrowsertesting.com/) यूज़रनेम और ऑथकी पर।

आप किसी भी वैकल्पिक [समर्थित क्षमता](https://help.crossbrowsertesting.com/selenium-testing/getting-started/crossbrowsertesting-automation-capabilities/) किसी भी ब्राउज़र की क्षमताओं में कुंजी/मान के रूप में पास कर सकते हैं।

### लोकल टेस्टिंग

यदि आप किसी ऐसे सर्वर के खिलाफ परीक्षण चलाना चाहते हैं जो इंटरनेट तक पहुंच योग्य नहीं है (जैसे `localhost`पर), तो आपको [लोकल टेस्टिंग ](https://help.crossbrowsertesting.com/local-connection/general/local-tunnel-overview/)का उपयोग करने की आवश्यकता है। TestingBot एक जावा-आधारित टनल प्रदान करता है जिससे आप उन वेबसाइटों का परीक्षण कर सकते हैं जो इंटरनेट से सुलभ नहीं हैं।

यदि आप WDIO टेस्टरनर का उपयोग कर रहे हैं, तो अपने `wdio.conf.js`में [`@wdio/browserstack-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-crossbrowsertesting-service) को डाउनलोड और कॉन्फ़िगर करें। यह BrowserStack को चलाने में मदद करता है, और अतिरिक्त सुविधाओं के साथ आता है जो आपके परीक्षणों को BrowserStack सेवा में बेहतर ढंग से एकीकृत करता है।

## लैम्ब्डा टेस्ट

[लैम्ब्डाटेस्ट](https://www.lambdatest.com) इंटीग्रेशन भी बिल्ट-इन है।

केवल आवश्यकता यह है कि आप अपने कॉन्फिग में `user` और `key` सेट करें (या तो `wdio.conf.js` द्वारा निर्यात किया गया या `webdriverio.remote(...)`में पारित किया गया) आपके ब्राउज़रस्टैक स्वचालित उपयोगकर्ता नाम और एक्सेस कुंजी पर.

आप किसी भी वैकल्पिक [समर्थित क्षमता](https://www.lambdatest.com/capabilities-generator/) किसी भी ब्राउज़र की क्षमताओं में कुंजी/मान के रूप में पास कर सकते हैं। यदि आप `Browserstack. debug` से `True` सेट करते हैं तो यह सत्र का एक स्क्रीनकास्ट रिकॉर्ड करेगा, जो सहायक हो सकता है।

### लोकल टेस्टिंग के लिए टनल

यदि आप किसी ऐसे सर्वर के खिलाफ परीक्षण चलाना चाहते हैं जो इंटरनेट तक पहुंच योग्य नहीं है (जैसे `localhost`पर), तो आपको [लोकल टेस्टिंग ](https://www.lambdatest.com/support/docs/testing-locally-hosted-pages/)का उपयोग करने की आवश्यकता है।

यह इसका समर्थन करने के लिए WebdriverIO के दायरे से बाहर है, इसलिए आपको इसे अपने आप से शुरू करना होगा।

यदि आप लोकल का उपयोग करते हैं, तो आपको अपनी क्षमताओं में `` को `true` सेट करना चाहिए।

यदि आप WDIO टेस्टरनर का उपयोग कर रहे हैं, तो अपने `wdio.conf.js`में [`@wdio/testingbot-service`](https://github.com/LambdaTest/wdio-lambdatest-service) को डाउनलोड और कॉन्फ़िगर करें। यह लैम्बडाटेस्ट को चलाने में मदद करता है, और अतिरिक्त सुविधाओं के साथ आता है जो आपके परीक्षणों को लैम्ब्डाटेस्ट सेवा में बेहतर ढंग से एकीकृत करता है।
### Travis CI के साथ

यदि आप ट्रैविस में लोकल टेस्टिंग जोड़ना चाहते हैं, तो आपको इसे स्वयं ही प्रारंभ करना होगा।

निम्न स्क्रिप्ट बैकग्राउंड में इसे डाउनलोड और प्रारंभ करेगी। परीक्षण शुरू करने से पहले आपको इसे ट्रैविस में चलाना चाहिए।

```sh
wget http://downloads.lambdatest.com/tunnel/linux/64bit/LT_Linux.zip
unzip LT_Linux.zip
./LT -user $LT_USERNAME -key $LT_ACCESS_KEY -cui &
sleep 3
```

साथ ही, आप `build` को ट्रैविस बिल्ड नंबर पर सेट करना चाह सकते हैं।

उदाहरण `capabilities`:

```javascript
platform: 'Windows 10',
browserName: 'chrome',
version: '79.0',
build: `myApp #${process.env.TRAVIS_BUILD_NUMBER}.${process.env.TRAVIS_JOB_NUMBER}`,
'tunnel': 'true',
'visual': 'true'
```

## बिल्कुल सही

[`Perfecto`](https://www.perfecto.io)के साथ wdio का उपयोग करते समय, आपको प्रत्येक उपयोगकर्ता के लिए एक सुरक्षा टोकन बनाना होगा और इसे क्षमता संरचना (अन्य क्षमताओं के अतिरिक्त) में निम्नानुसार जोड़ना होगा:

```js
export const config = {
  capabilities: [{
    // ...
    securityToken: "your security token"
  }],
```

इसके अलावा, आपको निम्नानुसार क्लाउड कॉन्फ़िगरेशन जोड़ने की आवश्यकता है:

```js
  hostname: "your_cloud_name.perfectomobile.com",
  path: "/nexperience/perfectomobile/wd/hub",
  port: 443,
  protocol: "https",
```
