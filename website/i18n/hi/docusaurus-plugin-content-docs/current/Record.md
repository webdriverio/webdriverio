---
id: record
title: रिकॉर्ड परीक्षण
---

क्रोम देवटूल में _रिकॉर्डर_ पैनल है जो उपयोगकर्ताओं को क्रोम के भीतर स्वचालित चरणों को रिकॉर्ड करने और प्लेबैक करने की अनुमति देता है। इन चरणों को [एक्सटेंशन](https://chrome.google.com/webstore/detail/webdriverio-chrome-record/pllimkccefnbmghgcikpjkmmcadeddfn?hl=en&authuser=1) के साथ WebdriverIO परीक्षणों में निर्यात किया जा सकता है, जिससे लेखन परीक्षण बहुत आसान हो जाता है।

## क्रोम देवटूल रिकॉर्डर क्या है

[Chrome DevTools Recorder](https://developer.chrome.com/docs/devtools/recorder/) एक ऐसा टूल है जो आपको परीक्षण क्रियाओं को सीधे ब्राउज़र में रिकॉर्ड करने और फिर से चलाने की अनुमति देता है और उन्हें JSON (या उन्हें e2e परीक्षण में निर्यात) के रूप में निर्यात भी करता है, साथ ही परीक्षण प्रदर्शन को मापता है।

उपकरण सीधा है, और चूंकि यह ब्राउज़र में प्लग किया गया है, इसलिए हमारे पास संदर्भ बदलने या किसी तीसरे पक्ष के उपकरण से निपटने की सुविधा नहीं है।

## क्रोम DevTools Recorder से परीक्षण कैसे रिकॉर्ड करें

यदि आपके पास नवीनतम क्रोम है तो आपके पास रिकॉर्डर पहले से स्थापित और आपके लिए उपलब्ध होगा। बस कोई भी वेबसाइट खोलें, राइट-क्लिक करें और _"निरीक्षण करें"_चुनें। DevTools के भीतर आप `CMD/Control` + `Shift` + `p` दबाकर रिकॉर्डर खोल सकते हैं और _"शो रिकॉर्डर"_दर्ज कर सकते हैं।

![Chrome DevTools Recorder](/img/recorder/recorder.png)

एक उपयोगकर्ता यात्रा की रिकॉर्डिंग शुरू करने के लिए, _"नई रिकॉर्डिंग शुरू करें"_पर क्लिक करें, अपने परीक्षण को एक नाम दें और फिर अपने परीक्षण को रिकॉर्ड करने के लिए ब्राउज़र का उपयोग करें:

![Chrome DevTools Recorder](/img/recorder/demo.gif)

अगला कदम, _"रिप्ले"_ पर क्लिक करके देखें कि रिकॉर्डिंग सफल रही या नहीं और आप जो करना चाहते थे वह कर पाए। यदि सब कुछ ठीक है, तो [निर्यात](https://developer.chrome.com/docs/devtools/recorder/reference/#recorder-extension) आइकन पर क्लिक करें और _"एक्सपोर्ट WebdriverIO Test Script"_चुनें:

_"Export as a WebdriverIO Test Script"_ विकल्प केवल तभी उपलब्ध होता है जब आप [WebdriverIO Chrome Recorder](https://chrome.google.com/webstore/detail/webdriverio-chrome-record/pllimkccefnbmghgcikpjkmmcadeddfn) एक्सटेंशन इंस्टॉल करते हैं।


![Chrome DevTools Recorder](/img/recorder/export.gif)

इतना ही!

## एक्सपोर्ट रिकॉर्डिंग

यदि आपने प्रवाह को WebdriverIO परीक्षण स्क्रिप्ट के रूप में निर्यात किया है, तो इसे स्क्रिप्ट डाउनलोड करनी चाहिए कि आप अपने परीक्षण सूट में&पेस्ट कॉपी कर सकते हैं। उदाहरण के लिए उपरोक्त रिकॉर्डिंग इस प्रकार दिखती है:

```ts
describe("My WebdriverIO Test", function () {
  it("tests My WebdriverIO Test", function () {
    await browser.setWindowSize(1026, 688)
    await browser.url("https://webdriver.io/")
    await browser.$("#__docusaurus > div.main-wrapper > header > div").click()
    await browser.$("#__docusaurus > nav > div.navbar__inner > div:nth-child(1) > a:nth-child(3)").click()rec
    await browser.$("#__docusaurus > div.main-wrapper.docs-wrapper.docs-doc-page > div > aside > div > nav > ul > li:nth-child(4) > div > a").click()
    await browser.$("#__docusaurus > div.main-wrapper.docs-wrapper.docs-doc-page > div > aside > div > nav > ul > li:nth-child(4) > ul > li:nth-child(2) > a").click()
    await browser.$("#__docusaurus > nav > div.navbar__inner > div.navbar__items.navbar__items--right > div.searchBox_qEbK > button > span.DocSearch-Button-Container > span").click()
    await browser.$("#docsearch-input").setValue("click")
    await browser.$("#docsearch-item-0 > a > div > div.DocSearch-Hit-content-wrapper > span").click()
  });
});
```

सुनिश्चित करें कि आप कुछ लोकेटरों पर फिर से जाएँ और यदि आवश्यक हो तो उन्हें अधिक लचीला [चयनकर्ता प्रकार](/docs/selectors) से बदलें। आप प्रवाह को JSON फ़ाइल के रूप में भी निर्यात कर सकते हैं और इसे वास्तविक परीक्षण स्क्रिप्ट में बदलने के लिए [`@wdio/chrome-recorder`](https://github.com/webdriverio/chrome-recorder) पैकेज का उपयोग कर सकते हैं।

## अगले चरण

आप अपने अनुप्रयोगों के लिए आसानी से परीक्षण बनाने के लिए इस प्रवाह का उपयोग कर सकते हैं। क्रोम DevTools रिकॉर्डर में कई अतिरिक्त सुविधाएं हैं, जैसे:

- [धीमे नेटवर्क](https://developer.chrome.com/docs/devtools/recorder/#simulate-slow-network) या अनुकरण करें
- [अपने परीक्षणों के प्रदर्शन को मापें](https://developer.chrome.com/docs/devtools/recorder/#measure)

उनके [डॉक्स](https://developer.chrome.com/docs/devtools/recorder)को देखना सुनिश्चित करें।
