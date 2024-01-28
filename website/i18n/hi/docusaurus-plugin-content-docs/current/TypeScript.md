---
id: typescript
title: टाइपस्क्रिप्ट सेटअप
---

स्वत: पूर्णता और टाइप सुरक्षा प्राप्त करने के लिए आप [टाइपस्क्रिप्ट](http://www.typescriptlang.org) का उपयोग करके परीक्षण लिख सकते हैं।

आपको [`typescript`](https://github.com/microsoft/TypeScript) और [`ts-node`](https://github.com/TypeStrong/ts-node) को `devDependencies`के माध्यम से स्थापित करने की आवश्यकता होगी:

```bash npm2yarn
$ npm install typescript ts-node --save-dev
```

WebdriverIO स्वचालित रूप से पता लगाएगा कि क्या ये निर्भरताएँ स्थापित हैं और आपके लिए आपके कॉन्फ़िगरेशन और परीक्षणों को संकलित करेगा। `tsconfig.json` उसी डायरेक्टरी में रखना सुनिश्चित करें जिसमें आप WDIO कॉन्फिगर करते हैं। If you need to configure how ts-node runs please use the environment variables for [ts-node](https://www.npmjs.com/package/ts-node#options) or use wdio config's [autoCompileOpts section](/docs/configurationfile).

## कॉन्फ़िगरेशन

You can provide custom `ts-node` options through the environment (by default it uses the tsconfig.json in the root relative to your wdio config if the file exists):

```sh
# run wdio testrunner with custom options
TS_NODE_PROJECT=./config/tsconfig.e2e.json TS_NODE_TYPE_CHECK=true wdio run wdio.conf.ts
```

न्यूनतम टाइपस्क्रिप्ट संस्करण `v4.0.5`है।

## फ्रेमवर्क सेटअप

और आपके `tsconfig.json` निम्नलिखित की आवश्यकता है:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types"]
    }
}
```

कृपया `webdriverio` या `@wdio/sync` को स्पष्ट रूप से आयात करने से बचें। `WebdriverIO` और `WebDriver` प्रकार एक बार `types` में `tsconfig.json`में जोड़े जाने पर कहीं से भी पहुंच योग्य होते हैं। यदि आप अतिरिक्त WebdriverIO सेवाओं, प्लगइन्स या `devtools` ऑटोमेशन पैकेज का उपयोग करते हैं, तो कृपया उन्हें `types` सूची में भी जोड़ें क्योंकि कई अतिरिक्त टाइपिंग प्रदान करते हैं।

## फ्रेमवर्क प्रकार

आपके द्वारा उपयोग किए जाने वाले ढांचे के आधार पर, आपको उस ढांचे के प्रकारों को अपनी `tsconfig.json` प्रकार की संपत्ति में जोड़ना होगा, साथ ही इसकी प्रकार परिभाषाएं भी स्थापित करनी होंगी। यह विशेष रूप से महत्वपूर्ण है यदि आप अंतर्निहित अभिकथन लाइब्रेरी [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio)के लिए टाइप सपोर्ट चाहते हैं।

उदाहरण के लिए, यदि आप मोचा ढांचे का उपयोग करने का निर्णय लेते हैं, तो आपको `@types/mocha` इंस्टॉल करना होगा और इसे इस तरह जोड़ना होगा ताकि सभी प्रकार विश्व स्तर पर उपलब्ध हो सकें:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'},
 ]
}>
<TabItem value="mocha">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

</TabItem>
<TabItem value="jasmine">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/jasmine-framework"]
    }
}
```

</TabItem>
<TabItem value="cucumber">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/cucumber-framework"]
    }
}
```

</TabItem>
</Tabs>

## सेवाएं:

यदि आप ऐसी सेवाओं का उपयोग करते हैं जो ब्राउज़र क्षेत्र में कमांड जोड़ती हैं तो आपको इन्हें अपने `tsconfig.json`में भी शामिल करना होगा। उदाहरण के लिए यदि आप `@wdio/lighthouse-service` का उपयोग करते हैं तो सुनिश्चित करें कि आप इसे `types` में भी जोड़ते हैं, जैसे:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework",
            "@wdio/lighthouse-service"
        ]
    }
}
```

आपके टाइपस्क्रिप्ट कॉन्फ़िगरेशन में सेवाओं और रिपोर्टरों को जोड़ने से आपकी WebdriverIO कॉन्फ़िगरेशन फ़ाइल की प्रकार की सुरक्षा भी मजबूत होती है।

## परिभाषाएँ टाइप करें

WebdriverIO कमांड चलाते समय सभी गुण आमतौर पर टाइप किए जाते हैं ताकि आपको अतिरिक्त प्रकार आयात करने से निपटना न पड़े। हालाँकि ऐसे मामले हैं जहाँ आप चर को पहले से परिभाषित करना चाहते हैं। यह सुनिश्चित करने के लिए कि ये टाइप सुरक्षित हैं आप [`@wdio/types`](https://www.npmjs.com/package/@wdio/types) पैकेज में परिभाषित सभी प्रकारों का उपयोग कर सकते हैं। उदाहरण के लिए यदि आप `webdriverio` के लिए दूरस्थ विकल्प को परिभाषित करना चाहते हैं तो आप यह कर सकते हैं:

```ts
import type { Options } from '@wdio/types'

const config: Options.WebdriverIO = {
    hostname: 'http://localhost',
    port: '4444' // Error: Type 'string' is not assignable to type 'number'.ts(2322)
    capabilities: {
        browserName: 'chrome'
    }
}
```

## युक्तियाँ और संकेत

### संकलन & लिंट

पूरी तरह से सुरक्षित होने के लिए, आप सर्वोत्तम प्रथाओं का पालन करने पर विचार कर सकते हैं: अपने कोड को टाइपस्क्रिप्ट कंपाइलर ( `tsc` या `npx tsc`चलाएँ) के साथ संकलित करें और [प्री-कमिट हुक](https://github.com/typicode/husky)पर [एस्लिंट](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) चलाएँ।
