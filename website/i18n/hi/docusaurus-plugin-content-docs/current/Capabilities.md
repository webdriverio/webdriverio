---
id: capabilities
title: क्षमताएं
---

एक क्षमता एक रिमोट इंटरफ़ेस की परिभाषा है। यह WebdriverIO को यह समझने में मदद करता है कि आप किस ब्राउज़र या मोबाइल वातावरण में अपने परीक्षण चलाना पसंद करते हैं। स्थानीय रूप से परीक्षण विकसित करते समय क्षमताएँ कम महत्वपूर्ण होती हैं क्योंकि आप इसे अधिकांश समय एक रिमोट इंटरफ़ेस पर चलाते हैं लेकिन CI/CD में एकीकरण परीक्षणों का एक बड़ा सेट चलाते समय यह अधिक महत्वपूर्ण हो जाता है।

:::info

एक क्षमता ऑब्जेक्ट का फोर्मेट [वेबड्राइवर विनिर्देश](https://w3c.github.io/webdriver/#capabilities)द्वारा अच्छी तरह से परिभाषित किया गया है। यदि उपयोगकर्ता परिभाषित क्षमताएं उस विनिर्देश का पालन नहीं करती हैं तो WebdriverIO टेस्टरनर जल्दी विफल हो जाएगा।

:::

## कस्टम क्षमताएं

जबकि निश्चित परिभाषित क्षमताओं की मात्रा बहुत कम है, हर कोई कस्टम क्षमताओं को प्रदान और स्वीकार कर सकता है जो ऑटोमेशन ड्राइवर या रिमोट इंटरफ़ेस के लिए विशिष्ट हैं:

### ब्राउज़र विशिष्ट क्षमता एक्सटेंशन

- `goog: chromeOptions`: [Chromedriver](https://chromedriver.chromium.org/capabilities) एक्सटेंशन, केवल क्रोम में परीक्षण के लिए लागू
- `moz:firefoxOptions`: [Geckodriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html) एक्सटेंशन, केवल फायरफॉक्स में परीक्षण के लिए लागू
- `ms:edgeOptions`: [EdgeOptions](https://learn.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options) क्रोमियम एज के परीक्षण के लिए EdgeDriver का उपयोग करते समय परिवेश निर्दिष्ट करने के लिए

### क्लाउड वेंडर क्षमता एक्सटेंशन

- `sauce:options`: [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#w3c-webdriver-browser-capabilities--optional)
- `bstack:options`: [BrowserStack](https://www.browserstack.com/docs/automate/selenium/organize-tests)
- `tb:options`: [TestingBot](https://testingbot.com/support/other/test-options)
- और भी कई...

### स्वचालन इंजन क्षमता एक्सटेंशन

- `appium:xxx`: [Appium](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/)
- `selenoid:xxx`: [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)
- और भी कई...

अपने परीक्षण के लिए विशिष्ट क्षमताओं को खोजने के लिए WebdriverIOs [क्षमता TypeScript परिभाषा](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc) पर एक नज़र डालें। ध्यान दें: ये सभी अभी भी मान्य नहीं हैं और हो सकता है कि अब प्रदाता द्वारा समर्थित न हों।

## विशिष्ट उपयोग मामलों के लिए विशेष क्षमताएं

यह उदाहरणों की एक सूची है जो दिखाती है कि एक निश्चित उपयोग के मामले को प्राप्त करने के लिए किन क्षमताओं को लागू करने की आवश्यकता है।

### ब्राउजर हेडलेस चलाएं

हेडलेस ब्राउजर चलाने का मतलब विंडो या यूआई के बिना ब्राउजर इंस्टेंस चलाना है। यह ज्यादातर सीआई/सीडी परिवेशों में उपयोग किया जाता है जहां कोई डिस्प्ले उपयोग नहीं किया जाता है। ब्राउज़र को हेडलेस मोड में चलाने के लिए, निम्नलिखित क्षमताओं को लागू करें:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
 {label: 'Firefox', value: 'firefox'},
 {label: 'Microsoft Edge', value: 'msedge'},
 {label: 'Safari Edge', value: 'safari'},
 ]
}>
<TabItem value="chrome">

```ts
{
    browserName: 'chrome',
    'goog:chromeOptions': {
        args: ['headless', 'disable-gpu']
    }
}
```

</TabItem>
<TabItem value="firefox">

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        args: ['-headless']
    }
```

</TabItem>
<TabItem value="msedge">

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        args: ['--headless']
    }
```

</TabItem>
<TabItem value="safari">

ऐसा लगता है कि सफारी [समर्थन नहीं करता] (https://discussions.apple.com/thread/251837694) हेडलेस मोड में चल रहा है।

</TabItem>
</Tabs>
