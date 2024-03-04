---
id: automationProtocols
title: स्वचालन प्रोटोकॉल
---

WebdriverIO के साथ, आप अपने E2E परीक्षणों को स्थानीय रूप से या क्लाउड में चलाते समय कई स्वचालन तकनीकों के बीच चयन कर सकते हैं। By default, WebdriverIO will attempt to start a local automation session using the [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol.

## WebDriver Bidi Protocol

The [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) is an automation protocol to automate browsers using bi-directional communication. It's the successor of the [WebDriver](https://w3c.github.io/webdriver/) protocol and enables a lot more introspection capabilities for various testing use cases.

This protocol is currently under development and new primitives might be added in the future. All browser vendors have committed to implementing this web standard and a lot of [primitives](https://wpt.fyi/results/webdriver/tests/bidi?label=experimental&label=master&aligned) have already been landed in browsers.

## वेबड्राइवर प्रोटोकॉल

> [वेबड्राइवर](https://w3c.github.io/webdriver/) एक रिमोट कंट्रोल इंटरफ़ेस है जो उपयोगकर्ता एजेंटों के इंट्रोस्पेक्सन और नियंत्रण को सक्षम बनाता है। यह वेब ब्राउज़र के व्यवहार को दूर से निर्देश देने के लिए आउट-ऑफ़-प्रोसेस प्रोग्राम के लिए एक प्लेटफ़ॉर्म- और भाषा-तटस्थ वायर प्रोटोकॉल प्रदान करता है।

वेबड्राइवर प्रोटोकॉल को उपयोगकर्ता के दृष्टिकोण से एक ब्राउज़र को स्वचालित करने के लिए डिज़ाइन किया गया था, जिसका अर्थ है कि एक उपयोगकर्ता जो कुछ भी करने में सक्षम है, आप ब्राउज़र के साथ कर सकते हैं। यह कमांड का एक सेट प्रदान करता है जो किसी एप्लिकेशन के साथ सामान्य इंटरैक्शन को दूर करता है (उदाहरण के लिए, किसी तत्व की स्थिति को नेविगेट करना, क्लिक करना या पढ़ना)। Since it is a web standard, it is well supported across all major browser vendors and also is being used as an underlying protocol for mobile automation using [Appium](http://appium.io).

इस ऑटोमेशन प्रोटोकॉल का उपयोग करने के लिए, आपको एक प्रॉक्सी सर्वर की आवश्यकता होती है जो सभी आदेशों का अनुवाद करता है और उन्हें लक्षित वातावरण (यानी ब्राउज़र या मोबाइल ऐप) में निष्पादित करता है।

ब्राउज़र ऑटोमेशन के लिए, प्रॉक्सी सर्वर आमतौर पर ब्राउज़र ड्राइवर होता है। सभी ब्राउज़रों के लिए ड्राइवर उपलब्ध हैं:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

किसी भी तरह के मोबाइल ऑटोमेशन के लिए, आपको [एपियम](http://appium.io)को इंस्टॉल और सेटअप करना होगा। यह आपको उसी वेबड्राइवरआईओ सेटअप का उपयोग करके मोबाइल (आईओएस/एंड्रॉइड) या यहां तक कि डेस्कटॉप (मैकओएस/विंडोज) अनुप्रयोगों को स्वचालित करने की अनुमति देगा।

ऐसी बहुत सी सेवाएँ भी हैं जो आपको उच्च स्तर पर क्लाउड में अपना स्वचालन परीक्षण चलाने की अनुमति देती हैं। इन सभी ड्राइवरों को स्थानीय रूप से सेटअप करने के बजाय, आप क्लाउड में इन सेवाओं (जैसे [सॉस लैब्स](https://saucelabs.com)) से बात कर सकते हैं और उनके प्लेटफॉर्म पर परिणामों का निरीक्षण कर सकते हैं। परीक्षण स्क्रिप्ट और स्वचालन वातावरण के बीच संचार इस प्रकार दिखाई देगा:

![वेब ड्राइवर सेटअप](/img/webdriver.png)

### लाभ

- आधिकारिक W3C वेब मानक, सभी प्रमुख ब्राउज़रों द्वारा समर्थित
- सरलीकृत प्रोटोकॉल जो सामान्य उपयोगकर्ता इंटरैक्शन को कवर करता है
- मोबाइल स्वचालन के लिए समर्थन (और यहां तक कि देशी डेस्कटॉप ऐप्स)
- [सॉस लैब्स](https://saucelabs.com)जैसी सेवाओं के माध्यम से स्थानीय और साथ ही क्लाउड में उपयोग किया जा सकता है

### नुकसान

- गहन ब्राउज़र विश्लेषण के लिए डिज़ाइन नहीं किया गया है (उदाहरण के लिए, नेटवर्क ईवेंट का पता लगाना या इंटरसेप्ट करना)
- स्वचालन क्षमताओं का सीमित सेट (उदाहरण के लिए, सीपीयू या नेटवर्क को थ्रॉटल करने के लिए कोई समर्थन नहीं)
- ब्राउज़र ड्राइवर को सेलेनियम-स्टैंडअलोन/क्रोमड्राइवर/आदि के साथ सेट करने के लिए अतिरिक्त प्रयास
