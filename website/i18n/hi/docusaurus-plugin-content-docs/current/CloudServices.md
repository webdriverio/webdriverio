---
id: cloudservices
title: Using Cloud Services
---

Using on-demand services like Sauce Labs, Browserstack, TestingBot, CrossBrowserTestin, LambdaTest or Perfecto with WebdriverIO is pretty simple. All you need to do is to set your service's `user` and `key` in your options.

Optionally, you can also parametrize your test by setting cloud-specific capabilities like `build`. If you only want to run cloud services in Travis, you can use the `CI` environment variable to check if you are in Travis and modify the config accordingly.

```js
// wdio.conf.js
export let config = {...}
if (process.env.CI) {
    config.user = process.env.SAUCE_USERNAME
    config.key = process.env.SAUCE_ACCESS_KEY
}
```

## Sauce Labs

You can set up your tests to run remotely in [Sauce Labs](https://saucelabs.com).

The only requirement is to set the `user` and `key` in your config (either exported by `wdio.conf.js` or passed into `webdriverio.remote(...)`) to your Sauce Labs username and access key.

You can also pass in any optional [test configuration option](https://docs.saucelabs.com/dev/test-configuration-options/) as a key/value in the capabilities for any browser.

### Sauce Connect

If you want to run tests against a server that is not accessible to the Internet (like on `localhost`), then you need to use [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy).

It is out of the scope of WebdriverIO to support this, so you'll have to start it by yourself.

If you are using the WDIO testrunner download and configure the [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) in your `wdio.conf.js`. It helps getting Sauce Connect running and comes with additional features that better integrate your tests into the Sauce service.

### With Travis CI

Travis CI, however, does [have support](http://docs.travis-ci.com/user/sauce-connect/#Setting-up-Sauce-Connect) for starting Sauce Connect before each test, so following their directions for that is an option.

If you do so, you must set the `tunnel-identifier` test configuration option in each browser's `capabilities`. Travis sets this to the `TRAVIS_JOB_NUMBER` environmental variable by default.

Also, if you want to have Sauce Labs group your tests by build number, you can set the `build` to `TRAVIS_BUILD_NUMBER`.

Lastly, if you set `name`, this changes the name of this test in Sauce Labs for this build. If you are using the WDIO testrunner combined with the [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service), WebdriverIO automatically sets a proper name for the test.

Example `capabilities`:

```javascript
browserName: 'chrome',
version: '27.0',
platform: 'XP',
'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
name: 'integration',
build: process.env.TRAVIS_BUILD_NUMBER
```

### Timeouts

Since you are running your tests remotely, it might be necessary to increase some timeouts.

You can change the [idle timeout](https://docs.saucelabs.com/dev/test-configuration-options/#idletimeout) by passing `idle-timeout` as a test configuration option. This controls how long Sauce will wait between commands before closing the connection.

## BrowserStack

WebdriverIO also has a [Browserstack](https://www.browserstack.com) integration built-in.

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
