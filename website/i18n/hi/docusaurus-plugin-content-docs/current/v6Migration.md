---
id: v6-migration
title: From v5 to v6
---

This tutorial is for people who are still using `v5` of WebdriverIO and want to migrate to `v6` or to the latest version of WebdriverIO. As mentioned in our [release blog post](https://webdriver.io/blog/2020/03/26/webdriverio-v6-released) the changes for this version upgrade can be summarised as following:

- we consolidated the parameters for some commands (e.g. `newWindow`, `react$`, `react$$`, `waitUntil`, `dragAndDrop`, `moveTo`, `waitForDisplayed`, `waitForEnabled`, `waitForExist`) and moved all optional parameters into a single object, e.g.

    ```js
    // v5
    browser.newWindow(
        'https://webdriver.io',
        'WebdriverIO window',
        'width=420,height=230,resizable,scrollbars=yes,status=1'
    )
    // v6
    browser.newWindow('https://webdriver.io', {
        windowName: 'WebdriverIO window',
        windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1'
    })
    ```

- configurations for services moved into the service list, e.g.

    ```js
    // v5
    exports.config = {
        services: ['sauce'],
        sauceConnect: true,
        sauceConnectOpts: { foo: 'bar' },
    }
    // v6
    exports.config = {
        services: [['sauce', {
            sauceConnect: true,
            sauceConnectOpts: { foo: 'bar' }
        }]],
    }
    ```

- some service options were renamed for simplification purposes
- we renamed command `launchApp` to `launchChromeApp` for Chrome WebDriver sessions

:::info

If you are using WebdriverIO `v4` or below, please upgrade to `v5` first.

:::

While we would love to have a fully automated process for this the reality looks different. Everyone has a different setup. Every step should be seen as guidance and less like a step by step instruction. If you have issues with the migration, don't hesitate to [contact us](https://github.com/webdriverio/codemod/discussions/new).

## Setup

Similar to other migrations we can use the WebdriverIO [codemod](https://github.com/webdriverio/codemod). To install the codemod, run:

```sh
npm install jscodeshift @wdio/codemod
```

## WebdriverIO निर्भरता को अपग्रेड करें

यह देखते हुए कि सभी WebdriverIO संस्करण एक-दूसरे से तंग हैं, हमेशा एक विशिष्ट टैग में अपग्रेड करना सबसे अच्छा होता है, उदाहरण के लिए `6.12.0`। यदि आप `v5` से सीधे `v7` में अपग्रेड करने का निर्णय लेते हैं तो आप टैग को छोड़ सकते हैं और सभी पैकेजों के नवीनतम संस्करण स्थापित कर सकते हैं। ऐसा करने के लिए हम सभी WebdriverIO संबंधित निर्भरताओं को हमारे `package.json` से कॉपी करते हैं और उन्हें इसके माध्यम से पुनः इंस्टॉल करते हैं:

```sh
npm i --save-dev @wdio/allure-reporter@6 @wdio/cli@6 @wdio/cucumber-framework@6 @wdio/local-runner@6 @wdio/spec-reporter@6 @wdio/sync@6 wdio-chromedriver-service@6 webdriverio@6
```

आमतौर पर WebdriverIO निर्भरताएँ देव निर्भरताओं का हिस्सा होती हैं, यह आपकी परियोजना के आधार पर भिन्न हो सकती है। इसके बाद आपका `package.json` और `package-lock.json` अपडेट होना चाहिए। __नोट:__ ये निर्भरता के उदाहरण हैं, आपके भिन्न हो सकते हैं। कॉल करके सुनिश्चित करें कि आपको नवीनतम v6 संस्करण मिल गया है, जैसे:

```sh
npm show webdriverio versions
```

सभी कोर वेबड्राइवरआईओ पैकेज के लिए उपलब्ध नवीनतम संस्करण 6 को स्थापित करने का प्रयास करें। सामुदायिक पैकेजों के लिए यह एक पैकेज से दूसरे पैकेज में भिन्न हो सकता है। यहां हम जानकारी के लिए चेंजलॉग की जांच करने की सलाह देते हैं कि कौन सा संस्करण अभी भी v6 के साथ संगत है।

## कॉन्फ़िग फ़ाइल को रूपांतरित करें

एक अच्छा पहला कदम कॉन्फिग फाइल के साथ शुरू करना है। सभी ब्रेकिंग परिवर्तनों को स्वचालित रूप से कोडमॉड का उपयोग करके हल किया जा सकता है:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./wdio.conf.js
```

:::caution

कोडमॉड अभी तक टाइपस्क्रिप्ट परियोजनाओं का समर्थन नहीं करता है। देखें [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10)। हम जल्द ही इसके लिए समर्थन लागू करने के लिए काम कर रहे हैं। यदि आप टाइपस्क्रिप्ट का उपयोग कर रहे हैं तो कृपया शामिल हों!

:::

## विशिष्ट फ़ाइलें और पृष्ठ ऑब्जेक्ट अपडेट करें

सभी आदेश परिवर्तनों को अद्यतन करने के लिए अपनी सभी e2e फ़ाइलों पर कोडमॉड चलाएँ जिनमें WebdriverIO कमांड शामिल हैं, जैसे:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./e2e/*
```

इतना ही! कोई और परिवर्तन आवश्यक नहीं है 🎉

## निष्कर्ष

हम आशा करते हैं कि यह ट्यूटोरियल WebdriverIO `v6`में माइग्रेशन प्रक्रिया के माध्यम से आपका थोड़ा सा मार्गदर्शन करेगा। हम पुरजोर अनुशंसा करते हैं कि नवीनतम संस्करण में अपग्रेड करना जारी रखें क्योंकि लगभग कोई ब्रेकिंग बदलाव नहीं होने के कारण `v7` में अपडेट करना तुच्छ है। V7</a>में अपग्रेड करने के लिए कृपया माइग्रेशन गाइड

देखें।</p> 

समुदाय विभिन्न संगठनों में विभिन्न टीमों के साथ परीक्षण करते समय कोडमोड में सुधार करना जारी रखता है। कोई मुद्दा उठाने में संकोच न करें [यदि आपके पास फीडबैक है या [चर्चा शुरू](https://github.com/webdriverio/codemod/discussions/new)](https://github.com/webdriverio/codemod/issues/new) यदि आप माइग्रेशन प्रक्रिया के दौरान संघर्ष करते हैं।
