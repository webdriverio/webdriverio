---
id: web-extension-testing
title: वेब विस्तार परीक्षण
---

WebdriverIO किसी ब्राउज़र को स्वचालित करने के लिए आदर्श टूल है। वेब एक्सटेंशन ब्राउज़र का एक हिस्सा हैं और उन्हें उसी तरह से स्वचालित किया जा सकता है। जब भी आपका वेब एक्सटेंशन वेबसाइटों पर जावास्क्रिप्ट चलाने के लिए सामग्री स्क्रिप्ट का उपयोग करता है या पॉपअप मोडल पेश करता है, तो आप WebdriverIO का उपयोग करके उसके लिए e2e परीक्षण चला सकते हैं।

## ब्राउज़र में वेब एक्सटेंशन लोड करना

पहले चरण के रूप में हमें अपने सत्र के भाग के रूप में परीक्षण के तहत एक्सटेंशन को ब्राउज़र में लोड करना होगा। यह क्रोम और फ़ायरफ़ॉक्स के लिए अलग तरह से काम करता है।

:::info

ये डॉक्स सफारी वेब एक्सटेंशन को छोड़ देते हैं क्योंकि इसके लिए उनका समर्थन बहुत पीछे है और उपयोगकर्ता की मांग अधिक नहीं है। यदि आप सफारी के लिए एक वेब एक्सटेंशन बना रहे हैं, तो कृपया [raise an issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) उठाएं और इसे यहां भी शामिल करने में सहयोग करें।

:::

### Chrome

क्रोम में एक वेब एक्सटेंशन को लोड करने के लिए `crx` फ़ाइल की `base64` एन्कोडेड स्ट्रिंग प्रदान करके या वेब एक्सटेंशन फ़ोल्डर को पथ प्रदान करके किया जा सकता है। अपनी क्रोम क्षमताओं को निम्नलिखित के रूप में परिभाषित करके बाद वाला करना सबसे आसान है:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            // given your wdio.conf.js is in the root directory and your compiled
            // web extension files are located in the `./dist` folder
            args: [`--load-extension=${path.join(__dirname, '..', '..', 'dist')}`]
        }
    }]
}
```

:::info

यदि आप क्रोम की तुलना में किसी भिन्न ब्राउज़र को स्वचालित करते हैं, जैसे कि ब्रेव, एज या ओपेरा, तो संभावना है कि ब्राउज़र विकल्प उपरोक्त उदाहरण के साथ मेल खाता है, बस एक अलग क्षमता नाम का उपयोग करते हुए, उदाहरण के लिए `ms:edgeOptions`।

:::

यदि आप अपने एक्सटेंशन को `.crx` फ़ाइल के रूप में [crx](https://www.npmjs.com/package/crx) NPM पैकेज का उपयोग करके संकलित करते हैं, तो आप बंडल किए गए एक्सटेंशन को इसके माध्यम से इंजेक्ट कर सकते हैं:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extPath = path.join(__dirname, `web-extension-chrome.crx`)
const chromeExtension = (await fs.readFile(extPath)).toString('base64')

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            extensions: [chromeExtension]
        }
    }]
}
```

### Firefox

फ़ायरफ़ॉक्स प्रोफ़ाइल बनाने के लिए जिसमें एक्सटेंशन शामिल हैं, आप अपने सत्र को तदनुसार सेट करने के लिए [फ़ायरफ़ॉक्स प्रोफ़ाइल सेवा](/docs/firefox-profile-service) का उपयोग कर सकते हैं। हालाँकि आप उन समस्याओं का सामना कर सकते हैं जहाँ हस्ताक्षर संबंधी समस्याओं के कारण आपका स्थानीय विकसित एक्सटेंशन लोड नहीं किया जा सकता है। इस स्थिति में आप [`installAddOn`](/docs/api/gecko#installaddon) कमांड के माध्यम से `before` हुक में एक एक्सटेंशन लोड कर सकते हैं, उदाहरण के लिए:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extensionPath = path.resolve(__dirname, `web-extension.xpi`)

export const config = {
    // ...
    before: async (capabilities) => {
        const browserName = (capabilities as Capabilities.Capabilities).browserName
        if (browserName === 'firefox') {
            const extension = await fs.readFile(extensionPath)
            await browser.installAddOn(extension.toString('base64'), true)
        }
    }
}
```

`.xpi` फ़ाइल उत्पन्न करने के लिए, [`web-ext`](https://www.npmjs.com/package/web-ext) NPM पैकेज का उपयोग करने की अनुशंसा की जाती है। आप निम्न उदाहरण कमांड का उपयोग करके अपने एक्सटेंशन को बंडल कर सकते हैं:

```sh
npx web-ext build -s dist/ -a . -n web-extension-firefox.xpi
```
