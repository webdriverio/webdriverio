---
id: v7-migration
title: वी6 से वी7 तक
---

यह ट्यूटोरियल उन लोगों के लिए है जो अभी भी WebdriverIO के `v6` का उपयोग कर रहे हैं और `v7`में माइग्रेट करना चाहते हैं। जैसा कि हमारे [रिलीज़ ब्लॉग पोस्ट](https://webdriver.io/blog/2021/02/09/webdriverio-v7-released) में उल्लेख किया गया है, परिवर्तन ज्यादातर हुड के अंतर्गत हैं और उन्नयन सीधे आगे की प्रक्रिया होनी चाहिए।

:::info

यदि आप WebdriverIO `v5` या नीचे का उपयोग कर रहे हैं, तो कृपया पहले `v6` में अपग्रेड करें। कृपया हमारी [v6 माइग्रेशन गाइड](v6-migration)देखें।

:::

जबकि हम इसके लिए पूरी तरह से स्वचालित प्रक्रिया चाहते हैं, वास्तविकता अलग दिखती है। हर किसी का अलग सेटअप होता है। हर कदम को मार्गदर्शन के रूप में देखा जाना चाहिए और कदम दर कदम निर्देश की तरह नहीं। अगर आपको माइग्रेशन से जुड़ी कोई समस्या है, तो बेझिझक [हमसे संपर्क करें](https://github.com/webdriverio/codemod/discussions/new).

## Setup

अन्य माइग्रेशन के समान हम WebdriverIO [codemod](https://github.com/webdriverio/codemod)का उपयोग कर सकते हैं। इस ट्यूटोरियल के लिए हम एक समुदाय के सदस्य द्वारा सबमिट किए गए [बॉयलरप्लेट प्रोजेक्ट](https://github.com/WarleyGabriel/demo-webdriverio-cucumber) का उपयोग करते हैं और इसे `v6` से `v7`में पूरी तरह माइग्रेट करते हैं।

कोडमोड को स्थापित करने के लिए, दौड़ें:

```sh
npm install jscodeshift @wdio/codemod
```

#### प्रतिबद्ध:

- _कोडमॉड डिप्स_ [[6ec9e52]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/6ec9e52038f7e8cb1221753b67040b0f23a8f61a)स्थापित करें

## WebdriverIO निर्भरता को अपग्रेड करें

यह देखते हुए कि सभी WebdriverIO संस्करण एक-दूसरे से तंग हैं, हमेशा एक विशिष्ट टैग में अपग्रेड करना सबसे अच्छा होता है, उदाहरण के लिए `latest`। ऐसा करने के लिए हम सभी WebdriverIO संबंधित निर्भरताओं को हमारे `package.json` से कॉपी करते हैं और उन्हें इसके माध्यम से पुनः इंस्टॉल करते हैं:

```sh
npm i --save-dev @wdio/allure-reporter@7 @wdio/cli@7 @wdio/cucumber-framework@7 @wdio/local-runner@7 @wdio/spec-reporter@7 @wdio/sync@7 wdio-chromedriver-service@7 wdio-timeline-reporter@7 webdriverio@7
```

आमतौर पर WebdriverIO निर्भरताएँ देव निर्भरताओं का हिस्सा होती हैं, यह आपकी परियोजना के आधार पर भिन्न हो सकती है। इसके बाद आपका `package.json` और `package-lock.json` अपडेट होना चाहिए। __नोट:__ ये [उदाहरण प्रोजेक्ट](https://github.com/WarleyGabriel/demo-webdriverio-cucumber)द्वारा उपयोग की जाने वाली निर्भरताएं हैं, आपका भिन्न हो सकता है।

#### प्रतिबद्ध:

- _अद्यतन निर्भरताएँ_ [[7097ab6]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/7097ab6297ef9f37ead0a9c2ce9fce8d0765458d)

## Transform Config File

A good first step is to start with the config file. In WebdriverIO `v7` we don't require to manually register any of the compilers anymore. In fact they need to be removed. This can be done with the codemod full automatically:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./wdio.conf.js
```

:::caution

The codemod doesn't yet support TypeScript projects. See [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10). We are working to implement support for it soon. If you are using TypeScript please get involved!

:::

#### Commits:

- _transpile config file_ [[6015534]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/60155346a386380d8a77ae6d1107483043a43994)

## Update Step Definitions

If you are using Jasmine or Mocha, you are done here. The last step is to update the Cucumber.js imports from `cucumber` to `@cucumber/cucumber`. This can also be done via the codemod automatically:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./src/e2e/*
```

That's it! No more changes necessary 🎉

#### Commits:

- _transpile step definitions_ [[8c97b90]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/8c97b90a8b9197c62dffe4e2954f7dad814753cc)

## Conclusion

We hope this tutorial guides you a little bit through the migration process to WebdriverIO `v7`. The community continues to improve the codemod while testing it with various teams in various organisations. Don't hesitate to [raise an issue](https://github.com/webdriverio/codemod/issues/new) if you have feedback or [start a discussion](https://github.com/webdriverio/codemod/discussions/new) if you struggle during the migration process.
