---
id: gettingstarted
title: शुरू करें
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CreateProjectAnimation from '@site/src/pages/components/CreateProjectAnimation.js';

WebdriverIO दस्तावेज़ीकरण में आपका स्वागत है। यह आपको तेजी से आरंभ करने में मदद करेगा। यदि आप समस्याओं में भाग लेते हैं, तो आप हमारे [डिसॉर्ड सपोर्ट सर्वर](https://discord.webdriver.io) पर सहायता और उत्तर पा सकते हैं या आप मुझे [ट्विटर](https://twitter.com/webdriverio)पर हिट कर सकते हैं।

:::info
ये WebdriverIO के नवीनतम संस्करण (__>=8.x__) के लिए दस्तावेज़ हैं। यदि आप अभी भी पुराने संस्करण का उपयोग कर रहे हैं, तो कृपया [पुरानी प्रलेखन वेबसाइटों पर जाएँ](/versions)!
:::

## एक WebdriverIO सेटअप आरंभ करें

[WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio)का उपयोग करके किसी मौजूदा या नए प्रोजेक्ट में पूर्ण WebdriverIO सेटअप जोड़ने के लिए, चलाएँ:

यदि आप किसी मौजूदा प्रोजेक्ट की रूट डायरेक्टरी में हैं, तो दौड़ें:

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio .
```

or if you want to create a new project:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```

or if you want to create a new project:

```sh
yarn create wdio ./path/to/new/project
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio .
```

or if you want to create a new project:

```sh
pnpm create wdio ./path/to/new/project
```

</TabItem>
</Tabs>

यह एकल कमांड WebdriverIO CLI टूल को डाउनलोड करता है और एक कॉन्फ़िगरेशन विज़ार्ड चलाता है जो आपको अपने टेस्ट सूट को कॉन्फ़िगर करने में मदद करता है।

<CreateProjectAnimation />

विज़ार्ड एक सेट प्रश्न पूछेगा जो सेटअप के माध्यम से आपका मार्गदर्शन करता है। आप डिफ़ॉल्ट सेट अप चुनने के लिए `--yes` पैरामीटर पास कर सकते हैं जो [पेज ऑब्जेक्ट](https://martinfowler.com/bliki/PageObject.html) पैटर्न का उपयोग करके क्रोम के साथ मोचा का उपयोग करेगा।

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio . --yes
```

</TabItem>
</Tabs>

## चालू परीक्षण

आप `run` कमांड का उपयोग करके और आपके द्वारा अभी बनाए गए WebdriverIO कॉन्फ़िगरेशन की ओर इशारा करके अपना टेस्ट सूट शुरू कर सकते हैं:

```sh
npx wdio run ./wdio.conf.js
```

यदि आप विशिष्ट परीक्षण फ़ाइलें चलाना चाहते हैं तो आप `--spec` पैरामीटर जोड़ सकते हैं:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

या अपनी कॉन्फ़िगरेशन फ़ाइल में सुइट्स को परिभाषित करें और सूट में परिभाषित परीक्षण फ़ाइलों को चलाएं:

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## एक स्क्रिप्ट में चलाएँ

यदि आप Node.JS स्क्रिप्ट के भीतर [स्टैंडअलोन मोड](/docs/setuptypes#standalone-mode) में एक ऑटोमेशन इंजन के रूप में WebdriverIO का उपयोग करना चाहते हैं, तो आप सीधे WebdriverIO को भी इंस्टॉल कर सकते हैं और इसे पैकेज के रूप में उपयोग कर सकते हैं, उदाहरण के लिए वेबसाइट का स्क्रीनशॉट जनरेट करना:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__नोट:__ सभी WebdriverIO कमांड अतुल्यकालिक हैं और [`async/wait`](https://javascript.info/async-await)का उपयोग करके ठीक से नियंत्रित करने की आवश्यकता है।

## रिकॉर्ड परीक्षण

WebdriverIO स्क्रीन पर अपनी परीक्षण क्रियाओं को रिकॉर्ड करके आरंभ करने में आपकी मदद करने के लिए उपकरण प्रदान करता है और स्वचालित रूप से WebdriverIO परीक्षण स्क्रिप्ट उत्पन्न करता है। अधिक जानकारी के लिए [Chrome DevTools Recorder](/docs/record) के साथ

रिकॉर्डर परीक्षण देखें।

## सिस्टम आवश्यकताएं

रिकॉर्डर परीक्षण देखें।

- कम से कम v16.x या उच्चतर स्थापित करें क्योंकि यह सबसे पुराना सक्रिय LTS संस्करण है
- केवल वे रिलीज़ जो LTS रिलीज़ हैं या बन जाएँगी आधिकारिक रूप से समर्थित हैं

यदि नोड वर्तमान में आपके सिस्टम पर स्थापित नहीं है, तो हम कई सक्रिय Node.js संस्करणों के प्रबंधन में सहायता के लिए [NVM](https://github.com/creationix/nvm) या [Volta](https://volta.sh/) जैसे टूल का उपयोग करने का सुझाव देते हैं। एनवीएम एक लोकप्रिय विकल्प है, जबकि वोल्टा भी एक अच्छा विकल्प है।
