---
id: protocols
title: प्रोटोकॉल कमांड
---

WebdriverIO एक ऑटोमेशन फ्रेमवर्क है जो एक रिमोट एजेंट को नियंत्रित करने के लिए विभिन्न ऑटोमेशन प्रोटोकॉल पर निर्भर करता है, उदाहरण के लिए एक ब्राउज़र, मोबाइल डिवाइस या टेलीविजन के लिए। रिमोट डिवाइस के आधार पर विभिन्न प्रोटोकॉल चलन में आते हैं। ये आदेश दूरस्थ सर्वर (जैसे ब्राउज़र ड्राइवर) द्वारा सत्र की जानकारी के आधार पर [ब्राउज़र](/docs/api/browser) या [तत्व](/docs/api/element) ऑब्जेक्ट को असाइन किए जाते हैं।

आंतरिक रूप से WebdriverIO रिमोट एजेंट के साथ लगभग सभी इंटरैक्शन के लिए प्रोटोकॉल कमांड का उपयोग करता है। हालाँकि [ब्राउज़र](/docs/api/browser) या [एलिमेंट](/docs/api/element) ऑब्जेक्ट को सौंपे गए अतिरिक्त कमांड WebdriverIO के उपयोग को सरल करते हैं, उदाहरण के लिए प्रोटोकॉल कमांड का उपयोग करके किसी तत्व का टेक्स्ट प्राप्त करना इस तरह दिखेगा:

```js
const searchInput = await browser.findElement('css selector', '#lst-ib')
await client.getElementText(searchInput['element-6066-11e4-a52e-4f735466cecf'])
```

[ब्राउज़र](/docs/api/browser) या [एलिमेंट](/docs/api/element) ऑब्जेक्ट के सुविधाजनक कमांड का उपयोग करके इसे कम किया जा सकता है:

```js
$('#lst-ib').getText()
```

निम्नलिखित खंड प्रत्येक व्यक्तिगत प्रोटोकॉल की व्याख्या करता है।

## वेबड्राइवर प्रोटोकॉल

[वेबड्राइवर](https://w3c.github.io/webdriver/#elements) प्रोटोकॉल ब्राउज़र को स्वचालित करने के लिए एक वेब मानक है। कुछ अन्य E2E उपकरणों के विपरीत यह गारंटी देता है कि स्वचालन वास्तविक ब्राउज़र पर किया जा सकता है जो आपके उपयोगकर्ताओं द्वारा उपयोग किया जाता है, जैसे फ़ायरफ़ॉक्स, सफारी और क्रोम और क्रोमियम आधारित ब्राउज़र जैसे एज, और न केवल ब्राउज़र इंजन पर, जैसे वेबकिट, जो बहुत अलग।

[Chrome DevTools](https://w3c.github.io/webdriver/#elements) जैसे डिबगिंग प्रोटोकॉल के विरोध में WebDriver प्रोटोकॉल का उपयोग करने का लाभ यह है कि आपके पास कमांड का एक विशिष्ट सेट होता है जो ब्राउज़र के साथ उसी तरह से इंटरैक्ट करने की अनुमति देता है जो सभी ब्राउज़र में फ़्लैकनेस की संभावना को कम करता है। इसके अलावा [सॉस लैब्स](https://saucelabs.com/), [ब्राउज़रस्टैक](https://www.browserstack.com/) और [अन्य](https://github.com/christian-bromann/awesome-selenium#cloud-services)जैसे क्लाउड विक्रेताओं का उपयोग करके बड़े पैमाने पर मापनीयता के लिए इस प्रोटोकॉल क्षमताओं की पेशकश करता है।

## वेबड्राइवर बीड़ी प्रोटोकॉल

[वेबड्राइवर बीड़ी](https://w3c.github.io/webdriver-bidi/) प्रोटोकॉल प्रोटोकॉल की दूसरी पीढ़ी है और वर्तमान में अधिकांश ब्राउज़र विक्रेताओं द्वारा इस पर काम किया जा रहा है। अपने पूर्ववर्ती की तुलना में प्रोटोकॉल फ्रेमवर्क और रिमोट डिवाइस के बीच द्वि-दिशात्मक संचार (इसलिए "बीड़ी") का समर्थन करता है। यह ब्राउज़र में आधुनिक वेब अनुप्रयोगों को बेहतर ढंग से स्वचालित करने के लिए बेहतर ब्राउज़र आत्मनिरीक्षण के लिए अतिरिक्त आदिम भी प्रस्तुत करता है।

इस प्रोटोकॉल को देखते हुए वर्तमान में कार्य प्रगति पर है और अधिक सुविधाएँ समय के साथ जोड़ी जाएँगी और ब्राउज़र द्वारा समर्थित होंगी। यदि आप WebdriverIOs के सुविधाजनक आदेशों का उपयोग करते हैं तो आपके लिए कुछ भी नहीं बदलेगा। WebdriverIO ब्राउज़र में उपलब्ध और समर्थित होते ही इन नई प्रोटोकॉल क्षमताओं का उपयोग करेगा।

## Appium

[Appium](https://appium.io/) प्रोजेक्ट मोबाइल, डेस्कटॉप और अन्य सभी प्रकार के IoT उपकरणों को स्वचालित करने की क्षमता प्रदान करता है। जबकि वेबड्राइवर ब्राउज़र और वेब पर ध्यान केंद्रित करता है, एपियम की दृष्टि समान दृष्टिकोण का उपयोग करना है लेकिन किसी भी मनमाने उपकरण के लिए। वेबड्राइवर द्वारा परिभाषित आदेशों के अतिरिक्त, इसमें विशेष आदेश होते हैं जो अक्सर स्वचालित होने वाले रिमोट डिवाइस के लिए विशिष्ट होते हैं। For mobile testing scenarios this is ideal when you want to write and run the same tests for both Android and iOS applications.

According to Appium [documentation](https://appium.io/docs/en/about-appium/intro/?lang=en) it was designed to meet mobile automation needs according to a philosophy outlined by the following four tenets:

- You shouldn't have to recompile your app or modify it in any way in order to automate it.
- You shouldn't be locked into a specific language or framework to write and run your tests.
- A mobile automation framework shouldn't reinvent the wheel when it comes to automation APIs.
- A mobile automation framework should be open source, in spirit and practice as well as in name!

## Chromium

The Chromium protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session through [Chromedriver](https://chromedriver.chromium.org/chromedriver-canary).

## Firefox

The Firefox protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session through [Geckodriver](https://github.com/mozilla/geckodriver).

## Sauce Labs

The [Sauce Labs](https://saucelabs.com/) protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session using the Sauce Labs cloud.

## Selenium Standalone

The [Selenium Standalone](https://www.selenium.dev/documentation/grid/advanced_features/endpoints/) protocol offers a super set of commands on top of the WebDriver protocol that is only supported when running automated session using the Selenium Grid.

## JSON Wire Protocol

The [JSON Wire Protocol](https://www.selenium.dev/documentation/legacy/json_wire_protocol/) is the pre-predecessor of the WebDriver protocol and __deprecated__ today. While some commands might still be supported in certain environments, it is not recommended to use any of its commands.

## Mobile JSON Wire Protocol

The [Mobile JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md) is a super set of mobile commands on top of the JSON Wire Protocol. Given this one is deprecated the Mobile JSON Wire Protocol also got __deprecated__. Appium might still support some of its commands but it is not recommended to use them.
