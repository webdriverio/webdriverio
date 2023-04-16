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

[चाय](https://www.chaijs.com/) और [एक्सपेक्ट-वेबड्राइवरियो](https://github.com/webdriverio/expect-webdriverio#readme) सह-अस्तित्व में रह सकते हैं, और कुछ मामूली समायोजन के साथ एक्सपेक्ट-वेबड्राइवरियो में एक सहज ट्रांजीशन प्राप्त किया जा सकता है। यदि आपने WebdriverIO v6 में अपग्रेड किया है तो डिफ़ॉल्ट रूप से आपके पास बॉक्स से बाहर `एक्सपेक्ट-वेबड्राइवरियो` से सभी एसर्शन तक पहुंच होगी। इसका मतलब यह है कि विश्व स्तर पर जहां भी आप `expect` का उपयोग करते हैं, आप `expect-webdriverio` एसर्शन कहेंगे। That is, unless you you set [`injectGlobals`](/docs/configuration#injectglobals) to `false` or have explicitly overridden the global `expect` to use Chai. In this case you would not have access to any of the expect-webdriverio assertions without explicitly importing the expect-webdriverio package where you need it.

This guide will show examples of how to migrate from Chai if it has been overridden locally and how to migrate from Chai if it has been overridden globally.

### Local

Assume Chai was imported explicitly in a file, e.g.:

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

To migrate this code remove the Chai import and use the new expect-webdriverio assertion method `toHaveUrl` instead:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

If you wanted to use both Chai and expect-webdriverio in the same file you would keep the Chai import and `expect` would default to the expect-webdriverio assertion, e.g.:

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

### Global

Assume `expect` was globally overridden to use Chai. In order to use expect-webdriverio assertions we need to globally set a variable in the "before" hook, e.g.:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

Now Chai and expect-webdriverio can be used alongside each other. In your code you would use Chai and expect-webdriverio assertions as follows, e.g.:

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

To migrate you would slowly move each Chai assertion over to expect-webdriverio. Once all Chai assertions have been replaced throughout the code base the "before" hook can be deleted. A global find and replace to replace all instances of `wdioExpect` to `expect` will then finish off the migration.
