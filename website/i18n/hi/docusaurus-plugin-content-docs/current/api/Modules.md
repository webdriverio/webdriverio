---
id: modules
title: मॉड्यूल
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

WebdriverIO एनपीएम और अन्य रजिस्ट्रियों के लिए विभिन्न मॉड्यूल प्रकाशित करता है जिनका उपयोग आप अपने स्वयं के स्वचालन ढांचे के निर्माण के लिए कर सकते हैं। WebdriverIO सेटअप प्रकार के बारे में अधिक दस्तावेज़ [यहाँ](/docs/setuptypes)देखें।

## `webdriver` और `devtools`

प्रोटोकॉल पैकेज ([`webdriver`](https://www.npmjs.com/package/webdriver) और [`devtools`](https://www.npmjs. com/package/devtools)) निम्न स्थैतिक कार्यों के साथ एक वर्ग को उजागर करता है जो आपको सत्र आरंभ करने की अनुमति देता है:

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

विशिष्ट क्षमताओं के साथ एक नया सत्र प्रारंभ करता है। सत्र प्रतिक्रिया के आधार पर विभिन्न प्रोटोकॉल से आदेश प्रदान किए जाएंगे।

##### मापदंडों

- `options`: [वेबड्राइवर विकल्प](/docs/configuration#webdriver-options)
- `modifier`: फ़ंक्शन जो क्लाइंट इंस्टेंस को वापस आने से पहले संशोधित करने की अनुमति देता है
- `userPrototype`: गुण ऑब्जेक्ट जो इंस्टेंस प्रोटोटाइप को विस्तारित करने की अनुमति देता है
- `CustomCommandWrapper`: फ़ंक्शन जो फ़ंक्शन कॉल के चारों ओर कार्यक्षमता को लपेटने की अनुमति देता है

##### रिटर्न्स

- [ब्राउज़र](/docs/api/browser) वस्तु

##### उदाहरण

```js
const client = await WebDriver.newSession({
    capabilities: { browserName: 'chrome' }
})
```

#### `attachSession(attachInstance, modifier, userPrototype, customCommandWrapper)`

चल रहे WebDriver या DevTools सत्र से जुड़ता है।

##### मापदंडों

- `modifier`: संपत्ति के साथ एक सत्र या कम से कम एक वस्तु संलग्न करने के लिए उदाहरण `sessionId` (उदाहरण के लिए `{ sessionId: 'xxx' }`)
- `modifier`: फ़ंक्शन जो क्लाइंट इंस्टेंस को वापस आने से पहले संशोधित करने की अनुमति देता है
- `userPrototype`: गुण ऑब्जेक्ट जो इंस्टेंस प्रोटोटाइप को विस्तारित करने की अनुमति देता है
- `CustomCommandWrapper`: फ़ंक्शन जो फ़ंक्शन कॉल के चारों ओर कार्यक्षमता को लपेटने की अनुमति देता है

##### रिटर्न्स

- [Browser](/docs/api/browser) object

##### उदाहरण

```js
const client = await WebDriver.newSession({...})
const clonedClient = await WebDriver.attachSession(client)
```

#### `reloadSession(instance)`

दिए गए उदाहरण दिए गए सत्र को पुनः लोड करता है।

##### मापदंडों

- `modifier`: पुनः लोड करने के लिए पैकेज उदाहरण

##### उदाहरण

```js
const client = await WebDriver.newSession({...})
await WebDriver.reloadSession(client)
```

## `webdriverio`

प्रोटोकॉल पैकेज के समान (`webdriver` और `devtools`) आप सत्रों को प्रबंधित करने के लिए WebdriverIO पैकेज API का भी उपयोग कर सकते हैं। एपीआई को 'webdriverio</code> ' से `import { remote, attach, multiremote } का उपयोग करके आयात किया जा सकता है और इसमें निम्न कार्यक्षमता शामिल है:</p>

<h4 spaces-before="0"><code>remote(options, modifier)`</h4>

WebdriverIO सत्र प्रारंभ करता है। उदाहरण में प्रोटोकॉल पैकेज के रूप में सभी आदेश शामिल हैं लेकिन अतिरिक्त उच्च क्रम कार्यों के साथ, [एपीआई डॉक्स](/docs/api)देखें।

##### मापदंडों

- `options`: [वेबड्राइवर विकल्प](/docs/configuration#webdriverio)
- `modifier`: फ़ंक्शन जो क्लाइंट इंस्टेंस को वापस आने से पहले संशोधित करने की अनुमति देता है

##### रिटर्न्स

- [ब्राउज़र](/docs/api/browser) वस्तु

##### उदाहरण

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})
```

#### `attach(attachOptions)`

चल रहे WebdriverIO सत्र से जुड़ता है।

##### मापदंडों

- `attachOptions`: एक संपत्ति के साथ एक सत्र या कम से कम एक वस्तु संलग्न करने के लिए उदाहरण `sessionId` (उदाहरण के लिए `{ sessionId: 'xxx' }`)

##### रिटर्न्स

- [ब्राउज़र](/docs/api/browser) वस्तु

##### उदाहरण

```js
import { remote, attach } from 'webdriverio'

const browser = await remote({...})
const newBrowser = await attach(browser)
```

#### `multiremote(multiremoteOptions)`

एक मल्टीरेमोट इंस्टेंस आरंभ करता है जो आपको एक इंस्टेंस के भीतर कई सत्रों को नियंत्रित करने की अनुमति देता है। ठोस उपयोग के मामलों के लिए हमारे [मल्टीरिमोट उदाहरण](https://github.com/webdriverio/webdriverio/tree/main/examples/multiremote) चेकआउट करें।

##### मापदंडों

- `multiremoteOptions`: ब्राउज़र नाम और उनके [वेबड्राइवरआईओ विकल्प](/docs/configuration#webdriverio)का प्रतिनिधित्व करने वाली चाबियों वाला एक ऑब्जेक्ट।

##### रिटर्न्स

- [ब्राउज़र](/docs/api/browser) वस्तु

##### उदाहरण

```js
import { multiremote } from 'webdriverio'

const matrix = await multiremote({
    myChromeBrowser: {
        capabilities: { browserName: 'chrome' }
    },
    myFirefoxBrowser: {
        capabilities: { browserName: 'firefox' }
    }
})
await matrix.url('http://json.org')
await matrix.getInstance('browserA').url('https://google.com')

console.log(await matrix.getTitle())
// returns ['Google', 'JSON']
```

## `@wdio/cli`

`wdio` कमांड को कॉल करने के बजाय, आप टेस्ट रनर को मॉड्यूल के रूप में भी शामिल कर सकते हैं और इसे मनमाने वातावरण में चला सकते हैं। उसके लिए, आपको मॉड्यूल के रूप में `@wdio/cli` पैकेज की आवश्यकता होगी, जैसे:

<Tabs
  defaultValue="esm"
  values={[
    {label: 'EcmaScript Modules', value: 'esm'},
 {label: 'CommonJS', value: 'cjs'}
 ]
}>
<TabItem value="esm">

```js
import Launcher from '@wdio/cli'
```

</TabItem>
<TabItem value="cjs">

```js
const Launcher = require('@wdio/cli').default
```

</TabItem>
</Tabs>

उसके बाद, लॉन्चर का एक उदाहरण बनाएं और परीक्षण चलाएँ।

#### `Launcher(configPath, opts)`

`Launcher` क्लास कन्स्ट्रक्टर यूआरएल को कॉन्फ़िगरेशन फ़ाइल की अपेक्षा करता है, और `opts` ऑब्जेक्ट सेटिंग्स के साथ जो कॉन्फ़िगरेशन में ओवरराइट करेगा।

##### मापदंडों

- `configPath`: `wdio.conf.js` को चलाने के लिए पथ
- `opts`: तर्क ([`<RunCommandArguments>`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/types.ts#L51-L77)) कॉन्फ़िगरेशन फ़ाइल से मानों को अधिलेखित करने के लिए

##### उदाहरण

```js
const wdio = new Launcher(
    '/path/to/my/wdio.conf.js',
    { spec: '/path/to/a/single/spec.e2e.js' }
)

wdio.run().then((exitCode) => {
    process.exit(exitCode)
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace)
    process.exit(1)
})
```

`run` कमांड [प्रॉमिस](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)देता है। यदि परीक्षण सफलतापूर्वक चलता है या विफल रहता है तो इसका समाधान किया जाता है, और यदि लॉन्चर परीक्षण चलाने में असमर्थ था तो इसे अस्वीकार कर दिया जाता है।

## `@wdio/browser-runner`

WebdriverIO के [ब्राउज़र रनर](/docs/runner#browser-runner) का उपयोग करके यूनिट या घटक परीक्षण चलाते समय आप अपने परीक्षणों के लिए मॉकिंग उपयोगिताओं का आयात कर सकते हैं, जैसे:

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

निम्नलिखित नामित निर्यात उपलब्ध हैं:

#### `fn`

मॉक फंक्शन, आधिकारिक [सबसे महत्वपूर्ण डॉक्स](https://vitest.dev/api/mock.html#mock-functions)में अधिक देखें।

#### `spyOn`

स्पाई फंक्शन, आधिकारिक [वीटेस्ट डॉक्स](https://vitest.dev/api/mock.html#mock-functions)में अधिक देखें।

#### `mock`

फ़ाइल या निर्भरता मॉड्यूल को मॉक करने की विधि।

##### मापदंडों

- `moduleName`: या तो फ़ाइल का एक सापेक्ष पथ जिसका मजाक उड़ाया जाना है या एक मॉड्यूल नाम।
- `factory`: नकली मान लौटाने के लिए फ़ंक्शन (वैकल्पिक)

##### उदाहरण

```js
mock('../src/constants.ts', () => ({
    SOME_DEFAULT: 'mocked out'
}))

mock('lodash', (origModuleFactory) => {
    const origModule = await origModuleFactory()
    return {
        ...origModule,
        pick: fn()
    }
})
```

#### `unmock`

अनमॉक डिपेंडेंसी जिसे मैनुअल मॉक (`__mocks__`) डायरेक्टरी में परिभाषित किया गया है।

##### मापदंडों

- `moduleName`: मॉड्यूल का नाम अनमोक होना।

##### उदाहरण

```js
unmock('lodash')
```
