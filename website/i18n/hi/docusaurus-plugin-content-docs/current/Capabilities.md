---
id: capabilities
title: क्षमताएं
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

एक क्षमता एक रिमोट इंटरफ़ेस की परिभाषा है। यह WebdriverIO को यह समझने में मदद करता है कि आप किस ब्राउज़र या मोबाइल वातावरण में अपने परीक्षण चलाना पसंद करते हैं। स्थानीय रूप से परीक्षण विकसित करते समय क्षमताएँ कम महत्वपूर्ण होती हैं क्योंकि आप इसे अधिकांश समय एक रिमोट इंटरफ़ेस पर चलाते हैं लेकिन CI/CD में एकीकरण परीक्षणों का एक बड़ा सेट चलाते समय यह अधिक महत्वपूर्ण हो जाता है।

:::info

एक क्षमता ऑब्जेक्ट का फोर्मेट [वेबड्राइवर विनिर्देश](https://w3c.github.io/webdriver/#capabilities)द्वारा अच्छी तरह से परिभाषित किया गया है। यदि उपयोगकर्ता परिभाषित क्षमताएं उस विनिर्देश का पालन नहीं करती हैं तो WebdriverIO टेस्टरनर जल्दी विफल हो जाएगा।

:::

## कस्टम क्षमताएं

जबकि निश्चित परिभाषित क्षमताओं की मात्रा बहुत कम है, हर कोई कस्टम क्षमताओं को प्रदान और स्वीकार कर सकता है जो ऑटोमेशन ड्राइवर या रिमोट इंटरफ़ेस के लिए विशिष्ट हैं:

### ब्राउज़र विशिष्ट क्षमता एक्सटेंशन

- `goog:chromeOptions`: [Chromedriver](https://chromedriver.chromium.org/capabilities) extensions, only applicable for testing in Chrome
- `moz:firefoxOptions`: [Geckodriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html) extensions, only applicable for testing in Firefox
- `ms:edgeOptions`: [EdgeOptions](https://learn.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options) for specifying the environment when using EdgeDriver for testing Chromium Edge

### Cloud Vendor Capability Extensions

- `sauce:options`: [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#w3c-webdriver-browser-capabilities--optional)
- `bstack:options`: [BrowserStack](https://www.browserstack.com/docs/automate/selenium/organize-tests)
- `tb:options`: [TestingBot](https://testingbot.com/support/other/test-options)
- and many more...

### Automation Engine Capability Extensions

- `appium:xxx`: [Appium](https://appium.io/docs/en/writing-running-appium/caps/)
- `selenoid:xxx`: [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)
- and many more...

Have a look into WebdriverIOs [Capability TypeScript definition](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc) to find specific capabilities for your test. Note: not all of them are still valid and might not be supported anymore by the provider.

## Special Capabilities for Specific Use Cases

This is a list of examples showing which capabilities need to be applied to achieve a certain use case.

### Run Browser Headless

Running a headless browser means to run a browser instance without window or UI. This is mostly used within CI/CD environments where no display is used. To run a browser in headless mode, apply the following capabilities:

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

It seems that Safari [doesn't support](https://discussions.apple.com/thread/251837694) running in headless mode.

</TabItem>
</Tabs>
