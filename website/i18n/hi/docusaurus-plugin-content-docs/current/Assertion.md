---
id: assertion
title: एसेर्शन
---

[WDIO टेस्टरनर](https://webdriver.io/docs/clioptions) एक बिल्ट इन एसेर्शन लाइब्रेरी के साथ आता है जो आपको अपने (वेब) एप्लिकेशन के भीतर ब्राउज़र या तत्वों के विभिन्न पहलुओं पर शक्तिशाली एसेर्शन करने की अनुमति देता है। यह e2e परीक्षण अनुकूलित, मैचर्स, अतिरिक्त के साथ [जेस्ट मैचर्स](https://jestjs.io/docs/en/using-matchers) कार्यक्षमता का विस्तार करता है: उदाहरण के लिए

```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```

या

```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```

पूरी सूची के लिए, [अपेक्षित एपीआई दस्तावेज़](/docs/api/expect-webdriverio)देखें।

## चाई से पलायन

[चाय](https://www.chaijs.com/) और [एक्सपेक्ट-वेबड्राइवरियो](https://github.com/webdriverio/expect-webdriverio#readme) सह-अस्तित्व में रह सकते हैं, और कुछ मामूली समायोजन के साथ एक्सपेक्ट-वेबड्राइवरियो में एक सहज ट्रांजीशन प्राप्त किया जा सकता है। यदि आपने WebdriverIO v6 में अपग्रेड किया है तो डिफ़ॉल्ट रूप से आपके पास बॉक्स से बाहर `एक्सपेक्ट-वेबड्राइवरियो` से सभी एसर्शन तक पहुंच होगी। इसका मतलब यह है कि विश्व स्तर पर जहां भी आप `expect` का उपयोग करते हैं, आप `expect-webdriverio` एसर्शन कहेंगे। यही है, जब तक आप [`injectGlobals`](/docs/configuration#injectglobals) से `false` सेट नहीं करते हैं या वैश्विक स्पष्ट रूप से ओवरराइड नहीं करते हैं, चाय का उपयोग करने को expect` करते हैं। इस मामले में आपको अपेक्षित-वेबड्राइवरियो पैकेज को स्पष्ट रूप से इम्पोर्ट किए बिना किसी भी अपेक्षित-वेबड्राइवरियो अभिकथन तक पहुंच नहीं होगी, जहां आपको इसकी आवश्यकता है।

यह मार्गदर्शिका इस बात के उदाहरण दिखाएगी कि कैसे चाई से माइग्रेट किया जाए यदि इसे स्थानीय रूप से ओवरराइड किया गया है और कैसे चाई से माइग्रेट किया जाए यदि इसे विश्व स्तर पर ओवरराइड किया गया है।

### लोकल

मान लें कि चाई को फ़ाइल में स्पष्ट रूप से आयात किया गया था, उदाहरण के लिए:

```js
// myfile.js - original code
import { expect as expectChai } from 'chai'

describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        expectChai(await browser.getUrl()).to.include('/login')
    })
})
```

इस कोड को माइग्रेट करने के लिए चाय इम्पोर्ट को हटा दें और इसके बजाय नई उम्मीद-वेबड्राइवरियो अभिकथन विधि `toHaveUrl` का उपयोग करें:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

यदि आप एक ही फाइल में चाई और एक्सपेक्ट-वेबड्राइवरियो दोनों का उपयोग करना चाहते हैं, तो आप चाई इम्पोर्ट रखेंगे और `expect` एक्सपेक्ट-वेबड्राइवरियो एश्योरेंस के लिए डिफॉल्ट होगा, जैसे:

```js
// myfile.js
import { expect as expectChai } from 'chai'
import { expect as expectWDIO } from '@wdio/globals'

describe('Element', () => {
    it('should be displayed', async () => {
        const isDisplayed = await $("#element").isDisplayed()
        expectChai(isDisplayed).to.equal(true); // Chai assertion
    })
});

describe('Other element', () => {
    it('should not be displayed', async () => {
        await expectWDIO($("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    })
})
```

### वैश्विक

मान लें कि चाय का उपयोग करने के लिए विश्व स्तर पर `expect` ओवरराइड किया गया था। एक्सपेक्ट-वेबड्राइवरियो एसर्शन का उपयोग करने के लिए हमें "पहले" हुक में विश्व स्तर पर एक चर सेट करने की आवश्यकता है, जैसे:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

अब चाई और एक्सपेक्ट-वेबड्राइवरियो का एक दूसरे के साथ उपयोग किया जा सकता है। अपने कोड में आप चाय और एक्सपेक्ट-वेबड्राइवरियो अभिकथन का उपयोग इस प्रकार करेंगे, जैसे:

```js
// myfile.js
describe('Element', () => {
    it('should be displayed', async () => {
        const isDisplayed = await $("#element").isDisplayed()
        expect(isDisplayed).to.equal(true); // Chai assertion
    });
});

describe('Other element', () => {
    it('should not be displayed', async () => {
        await expectWdio($("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    });
});
```

माइग्रेट करने के लिए आप धीरे-धीरे प्रत्येक चाय के दावे को एक्सपेक्ट-वेबड्राइवरियो पर ले जाएंगे। एक बार जब चाई के सभी दावों को पूरे कोड बेस में बदल दिया जाता है, तो "पहले" हुक को हटाया जा सकता है। `wdioExpect` से `expect` के सभी उदाहरणों को बदलने के लिए एक वैश्विक खोज और प्रतिस्थापन तब माइग्रेशन को समाप्त कर देगा।
