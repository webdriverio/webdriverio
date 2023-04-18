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

## कॉन्फ़िग फ़ाइल को रूपांतरित करें

एक अच्छा पहला कदम कॉन्फिग फाइल के साथ शुरू करना है। WebdriverIO `v7` में हमें अब किसी भी कंपाइलर को मैन्युअल रूप से पंजीकृत करने की आवश्यकता नहीं है। असल में उन्हें हटाने की जरूरत है। यह स्वचालित रूप से पूर्ण कोडमोड के साथ किया जा सकता है:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./wdio.conf.js
```

:::caution

कोडमॉड अभी तक टाइपस्क्रिप्ट परियोजनाओं का समर्थन नहीं करता है। देखें [`@webdriverio/codemod#10`](https://github.com/webdriverio/codemod/issues/10)। हम जल्द ही इसके लिए समर्थन लागू करने के लिए काम कर रहे हैं। यदि आप टाइपस्क्रिप्ट का उपयोग कर रहे हैं तो कृपया शामिल हों!

:::

#### प्रतिबद्ध:

- _ट्रांसपाइल कॉन्फ़िगरेशन फ़ाइल_ [[6015534]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/60155346a386380d8a77ae6d1107483043a43994)

## अद्यतन चरण परिभाषाएँ

यदि आप चमेली या मोचा का उपयोग कर रहे हैं, तो आपका काम हो गया। अंतिम चरण Cucumber.js आयात को `cucumber` से `@cucumber/cucumber`अपडेट करना है। यह स्वचालित रूप से कोडमोड के माध्यम से भी किया जा सकता है:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./src/e2e/*
```

इतना ही! कोई और परिवर्तन आवश्यक नहीं है 🎉

#### प्रतिबद्ध:

- _ट्रांसपाइल चरण परिभाषाएँ_ [[8c97b90]](https://github.com/WarleyGabriel/demo-webdriverio-cucumber/pull/11/commits/8c97b90a8b9197c62dffe4e2954f7dad814753cc)

## निष्कर्ष

हमें उम्मीद है कि यह ट्यूटोरियल WebdriverIO `v7`में माइग्रेशन प्रक्रिया के माध्यम से आपका थोड़ा सा मार्गदर्शन करेगा। समुदाय विभिन्न संगठनों में विभिन्न टीमों के साथ परीक्षण करते समय कोडमोड में सुधार करना जारी रखता है। कोई मुद्दा उठाने में संकोच न करें [यदि आपके पास फीडबैक है या [चर्चा शुरू](https://github.com/webdriverio/codemod/discussions/new)](https://github.com/webdriverio/codemod/issues/new) यदि आप माइग्रेशन प्रक्रिया के दौरान संघर्ष करते हैं।
