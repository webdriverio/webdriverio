---
id: customcommands
title: कस्टम कमांड
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

यदि आप `browser` उदाहरण को अपने स्वयं के आदेशों के सेट के साथ विस्तारित करना चाहते हैं, तो ब्राउज़र विधि  `addCommand` यहां आपके लिए है। आप अपनी कमांड को एसिंक्रोनस तरीके से लिख सकते हैं, ठीक अपने स्पेक्स की तरह।

## पैरामीटर

### कमान का नाम

एक नाम जो कमांड को परिभाषित करता है और ब्राउजर या एलिमेंट स्कोप से जुड़ा होगा।

प्रकार: `String`

### कस्टम फंक्शन

एक फ़ंक्शन जिसे कमांड कहे जाने पर निष्पादित किया जा रहा है। `this` स्कोप या तो [`WebdriverIO.Browser`](/docs/api/browser) या [`WebdriverIO.Element`](/docs/api/element) है जो इस बात पर निर्भर करता है कि कमांड ब्राउज़र या एलिमेंट स्कोप से जुड़ी है या नहीं।

टाइप: `Function`

### टारगेट स्कोप

यह तय करने के लिए फ्लैग करें कि कमांड को ब्राउजर या एलिमेंट स्कोप से अटैच करना है या नहीं। अगर `true` पर सेट किया जाता है तो कमांड एक एलिमेंट कमांड होगी।

Type: `Boolean`<br /> Default: `false`

## उदाहरण

यह उदाहरण दिखाता है कि एक नया कमांड कैसे जोड़ा जाए जो वर्तमान यूआरएल और शीर्षक को एक परिणाम के रूप में लौटाता है। स्कोप (`this`) एक [`WebdriverIO.Browser`](/docs/api/browser) ऑब्जेक्ट है।

```js
browser.addCommand('getUrlAndTitle', async function (customVar) {
    // `this` refers to the `browser` scope
    return {
        url: await this.getUrl(),
        title: await this.getTitle(),
        customVar: customVar
    }
})
```

इसके अतिरिक्त, आप अंतिम तर्क के रूप में `true` पास करके, अपने स्वयं के कमांड के सेट के साथ तत्व उदाहरण का विस्तार कर सकते हैं। इस मामले में दायरा (`this`) एक [`WebdriverIO.Element`](/docs/api/element) ऑब्जेक्ट है।

```js
browser.addCommand("waitAndClick", async function () {
    // `this` is return value of $(selector)
    await this.waitForDisplayed()
    await this.click()
}, true)
```

कस्टम कमांड आपको एक कॉल के रूप में अक्सर उपयोग किए जाने वाले कमांड के विशिष्ट अनुक्रम को बंडल करने का अवसर देते हैं। आप अपने टेस्ट सूट में किसी भी समय कस्टम कमांड को परिभाषित कर सकते हैं; बस यह सुनिश्चित कर लें कि कमांड को इसके पहले उपयोग के पहले *पहले* परिभाषित किया गया है। (आपके `wdio.conf.js` में `before`उन्हें बनाने के लिए एक अच्छी जगह है।)

एक बार परिभाषित करने के बाद, आप उन्हें निम्नानुसार उपयोग कर सकते हैं:

```js
it('should use my custom command', async () => {
    await browser.url('http://www.github.com')
    const result = await browser.getUrlAndTitle('foobar')

    assert.strictEqual(result.url, 'https://github.com/')
    assert.strictEqual(result.title, 'GitHub · Where software is built')
    assert.strictEqual(result.customVar, 'foobar')
})
```

__Note:__ यदि आप `browser` स्कोप में एक कस्टम कमांड पंजीकृत करते हैं, तो कमांड तत्वों के लिए एक्सेस योग्य नहीं होगा। इसी तरह, यदि आप एलिमेंट स्कोप में कमांड रजिस्टर करते हैं, तो यह `browser` स्कोप में एक्सेस नहीं किया जा सकेगा:

```js
browser.addCommand("myCustomBrowserCommand", () => { return 1 })
const elem = await $('body')
console.log(typeof browser.myCustomBrowserCommand) // outputs "function"
console.log(typeof elem.myCustomBrowserCommand()) // outputs "undefined"

browser.addCommand("myCustomElementCommand", () => { return 1 }, true)
const elem2 = await $('body')
console.log(typeof browser.myCustomElementCommand) // outputs "undefined"
console.log(await elem2.myCustomElementCommand('foobar')) // outputs "1"

const elem3 = await $('body')
elem3.addCommand("myCustomElementCommand2", () => { return 2 })
console.log(typeof browser.myCustomElementCommand2) // outputs "undefined"
console.log(await elem3.myCustomElementCommand2('foobar')) // outputs "2"
```

__Note:__ यदि आपको कस्टम कमांड को चेन करने की आवश्यकता है, तो कमांड `$`के साथ समाप्त होनी चाहिए,

```js
browser.addCommand("user$", (locator) => { return ele })
browser.addCommand("user$", (locator) => { return ele }, true)
await browser.user$('foo').user$('bar').click()
```

बहुत सारे कस्टम कमांड के साथ `browser` स्कोप को ओवरलोड न करने के लिए सावधान रहें।

हम [पेज ऑब्जेक्ट](PageObjects.md)में कस्टम लॉजिक को परिभाषित करने की सलाह देते हैं, ताकि वे एक विशिष्ट पेज से बंधे रहें।

## प्रकार परिभाषाएँ बढ़ाएँ

टाइपस्क्रिप्ट के साथ, WebdriverIO इंटरफेस का विस्तार करना आसान है। इस तरह अपने कस्टम कमांड में प्रकार जोड़ें:

1. एक प्रकार की परिभाषा फ़ाइल बनाएँ (उदाहरण के लिए, `./src/types/wdio.d.ts`)
2. ए यदि मॉड्यूल-शैली प्रकार की परिभाषा फ़ाइल का उपयोग कर रहे हैं (आयात/निर्यात का उपयोग करके और `declare global WebdriverIO` करें), फ़ाइल पथ को `tsconfig.json` `include` संपत्ति में शामिल करना सुनिश्चित करें।

   बी।  यदि परिवेश-शैली प्रकार की परिभाषा फ़ाइलों का उपयोग कर रहे हैं (प्रकार परिभाषा फ़ाइलों में कोई आयात/निर्यात नहीं है और `declare namespace WebdriverIO`घोषित करें), सुनिश्चित करें कि `tsconfig.json` *नहीं* में कोई `include` है, क्योंकि यह होगा में सूचीबद्ध नहीं होने वाली सभी प्रकार की परिभाषा फ़ाइलों में अनुभाग `include` हैं जिन्हें टाइपस्क्रिप्ट द्वारा पहचाना नहीं जा सकता है।

<Tabs
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
 {label: 'Ambient Type Definitions (no tsconfig include)', value: 'ambient'},
 ]
}>
<TabItem value="modules">

```json title="tsconfig.json"
{
    "compilerOptions": { ... },
    "include": [
        "./test/**/*.ts",
        "./src/types/**/*.ts"
    ]
}
```

</TabItem>
<TabItem value="ambient">

```json title="tsconfig.json"
{
    "compilerOptions": { ... }
}
```

</TabItem>
</Tabs>

3. अपने निष्पादन मोड के अनुसार अपने कमांड के लिए परिभाषाएँ जोड़ें।

<Tabs
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
 {label: 'Ambient Type Definitions', value: 'ambient'},
 ]
}>
<TabItem value="modules">

```typescript
declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface MultiRemoteBrowser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface Element {
            elementCustomCommand: (arg: any) => Promise<number>
        }
    }
}
```

</TabItem>
<TabItem value="ambient">

```typescript
declare namespace WebdriverIO {
    interface Browser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface MultiRemoteBrowser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface Element {
        elementCustomCommand: (arg: any) => Promise<number>
    }
}
```

</TabItem>
</Tabs>

## तृतीय पक्ष पुस्तकालयों को एकीकृत करें

यदि आप बाहरी पुस्तकालयों का उपयोग करते हैं (उदाहरण के लिए, डेटाबेस कॉल करने के लिए) जो वादों का समर्थन करते हैं, तो उन्हें एकीकृत करने का एक अच्छा तरीका कुछ एपीआई विधियों को एक कस्टम कमांड के साथ लपेटना है।

वादे को वापस करते समय, WebdriverIO यह सुनिश्चित करता है कि जब तक वादा पूरा नहीं हो जाता तब तक यह अगले आदेश के साथ जारी नहीं रहेगा। अगर वादा खारिज हो जाता है, तो आदेश एक त्रुटि देगा।

```js
import got from 'got'

browser.addCommand('makeRequest', async (url) => {
    return got(url).json()
})
```

फिर, बस इसे अपने WDIO टेस्ट स्पेक्स में उपयोग करें:

```js
it('execute external library in a sync way', async () => {
    await browser.url('...')
    const body = await browser.makeRequest('http://...')
    console.log(body) // returns response body
})
```

**नोट:** आपके कस्टम कमांड का परिणाम आपके द्वारा लौटाए गए वादे का परिणाम है।

## ओवरराइटिंग कमांड

आप मूल आदेशों को `overwriteCommand`से भी अधिलेखित कर सकते हैं।

ऐसा करने की अनुशंसा नहीं की जाती है, क्योंकि इससे ढांचे का अप्रत्याशित व्यवहार हो सकता है!

समग्र दृष्टिकोण `addCommand`के समान है, केवल अंतर यह है कि कमांड फ़ंक्शन में पहला तर्क मूल फ़ंक्शन है जिसे आप अधिलेखित करने वाले हैं। कृपया नीचे कुछ उदाहरण देखें।

### ओवरराइटिंग ब्राउज़र कमांड

```js
/**
 * print milliseconds before pause and return its value.
 */
// 'pause'            - name of command to be overwritten
// origPauseFunction  - original pause function
browser.overwriteCommand('pause', async (origPauseFunction, ms) => {
    console.log(`sleeping for ${ms}`)
    await origPauseFunction(ms)
    return ms
})

// then use it as before
console.log(`was sleeping for ${await browser.pause(1000)}`)
```

### ओवरराइटिंग एलिमेंट कमांड

एलिमेंट स्तर पर ओवरराइटिंग कमांड लगभग समान है। बस `True` तीसरे तर्क के रूप में `overwriteCommand`पास करें:

```js
/**
 * Attempt to scroll to element if it is not clickable.
 * Pass { force: true } to click with JS even if element is not visible or clickable.
 */
// 'click'            - name of command to be overwritten
// origClickFunction  - original click function
browser.overwriteCommand('click', async function (origClickFunction, { force = false } = {}) {
    if (!force) {
        try {
            // attempt to click
            await origClickFunction()
            return null
        } catch (err) {
            if (err.message.includes('not clickable at point')) {
                console.warn('WARN: Element', this.selector, 'is not clickable.',
                    'Scrolling to it before clicking again.')

                // scroll to element and click again
                await this.scrollIntoView()
                return origClickFunction()
            }
            throw err
        }
    }

    // clicking with js
    console.warn('WARN: Using force click for', this.selector)
    await browser.execute((el) => {
        el.click()
    }, this)
}, true) // don't forget to pass `true` as 3rd argument

// then use it as before
const elem = await $('body')
await elem.click()

// or pass params
await elem.click({ force: true })
```

## अधिक वेबड्राइवर कमांड जोड़ें

यदि आप WebDriver प्रोटोकॉल का उपयोग कर रहे हैं और ऐसे प्लेटफ़ॉर्म पर परीक्षण चला रहे हैं जो [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) में किसी भी प्रोटोकॉल परिभाषा द्वारा परिभाषित नहीं किए गए अतिरिक्त कमांड का समर्थन करता है, तो आप उन्हें `addCommand` इंटरफ़ेस के माध्यम से मैन्युअल रूप से जोड़ सकते हैं। `webdriver` पैकेज एक कमांड रैपर प्रदान करता है जो इन नए एंडपॉइंट्स को उसी तरह पंजीकृत करने की अनुमति देता है जैसे अन्य कमांड, समान पैरामीटर चेक और त्रुटि प्रबंधन प्रदान करते हैं। इस नए समापन बिंदु को पंजीकृत करने के लिए कमांड रैपर को इम्पोर्ट करें और इसके साथ एक नया कमांड निम्नानुसार पंजीकृत करें:

```js
import { command } from 'webdriver'

browser.addCommand('myNewCommand', command('POST', '/session/:sessionId/foobar/:someId', {
    command: 'myNewCommand',
    description: 'a new WebDriver command',
    ref: 'https://vendor.com/commands/#myNewCommand',
    variables: [{
        name: 'someId',
        description: 'some id to something'
    }],
    parameters: [{
        name: 'foo',
        type: 'string',
        description: 'a valid parameter',
        required: true
    }]
}))
```

इस आदेश को अमान्य पैरामीटर के साथ कॉल करने से पूर्वनिर्धारित प्रोटोकॉल कमांड के समान त्रुटि प्रबंधन होता है, उदाहरण के लिए:

```js
// call command without required url parameter and payload
await browser.myNewCommand()

/**
 * results in the following error:
 * Error: Wrong parameters applied for myNewCommand
 * Usage: myNewCommand(someId, foo)
 *
 * Property Description:
 *   "someId" (string): some id to something
 *   "foo" (string): a valid parameter
 *
 * For more info see https://my-api.com
 *    at Browser.protocolCommand (...)
 *    ...
 */
```

कमांड को सही ढंग से कॉल करना, उदाहरण के लिए `browser.myNewCommand('foo', 'bar')`, सही ढंग से एक वेबड्राइवर अनुरोध बनाता है जैसे `http://localhost:4444/session/7bae3c4c55c3bf82f54894ddc83c5f31/foobar/foo` जैसे पेलोड के साथ `{ foo: 'bar' }`.

:::note
`:sessionId` url पैरामीटर स्वचालित रूप से वेबड्राइवर सत्र की सत्र आईडी के साथ प्रतिस्थापित किया जाएगा। अन्य यूआरएल पैरामीटर लागू किए जा सकते हैं लेकिन उन्हें `variables`के भीतर परिभाषित करने की आवश्यकता है।
:::

[`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) पैकेज में प्रोटोकॉल कमांड को कैसे परिभाषित किया जा सकता है, इसके उदाहरण देखें।
