---
id: timeouts
title: समय समाप्त
---

WebdriverIO में प्रत्येक कमांड एक अतुल्यकालिक ऑपरेशन है। सेलेनियम सर्वर (या क्लाउड सेवा जैसे [सॉस लैब्स](https://saucelabs.com)) के लिए एक अनुरोध निकाल दिया गया है, और इसकी प्रतिक्रिया में कार्रवाई पूर्ण या विफल होने के बाद परिणाम होता है।

इसलिए, संपूर्ण परीक्षण प्रक्रिया में समय एक महत्वपूर्ण घटक है। जब एक निश्चित कार्रवाई एक अलग कार्रवाई की स्थिति पर निर्भर करती है, तो आपको यह सुनिश्चित करने की ज़रूरत है कि वे सही क्रम में निष्पादित हों। इन मुद्दों से निपटने के दौरान टाइमआउट एक महत्वपूर्ण भूमिका निभाते हैं।

## सेलेनियम टाइमआउट

### सत्र स्क्रिप्ट टाइमआउट

एक सत्र में एक संबद्ध सत्र स्क्रिप्ट टाइमआउट होता है जो एसिंक्रोनस स्क्रिप्ट के चलने के लिए प्रतीक्षा करने का समय निर्दिष्ट करता है। जब तक अन्यथा न कहा जाए, यह 30 सेकंड है। आप इस टाइमआउट को इस प्रकार सेट कर सकते हैं:

```js
await browser.setTimeout({ 'script': 60000 })
await browser.executeAsync((done) => {
    console.log('this should not fail')
    setTimeout(done, 59000)
})
```

### सत्र पृष्ठ लोड टाइमआउट

एक सत्र में एक संबद्ध सत्र पृष्ठ लोड टाइमआउट होता है जो पृष्ठ लोड होने के पूर्ण होने तक प्रतीक्षा करने का समय निर्दिष्ट करता है। जब तक अन्यथा न कहा जाए, यह 300,000 मिलीसेकंड है।

आप इस टाइमआउट को इस प्रकार सेट कर सकते हैं:

```js
await browser.setTimeout({ 'pageLoad': 10000 })
```

> `pageLoad` कीवर्ड आधिकारिक वेबड्राइवर [विनिर्देश](https://www.w3.org/TR/webdriver/#set-timeouts)का एक हिस्सा है, लेकिन आपके ब्राउज़र के लिए [समर्थित](https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/687) नहीं हो सकता है (पिछला नाम `page load`है)।

### सत्र अंतर्निहित प्रतीक्षा समयबाह्य

एक सत्र में एक संबद्ध सत्र अंतर्निहित प्रतीक्षा समयबाह्य होता है। यह निहित तत्व स्थान रणनीति के लिए प्रतीक्षा करने का समय निर्दिष्ट करता है जब तत्वों का पता लगाने के लिए [`findElement`](/docs/api/webdriver#findelement) या [`findElements`](/docs/api/webdriver#findelements) कमांड ([`$`](/docs/api/browser/$) या [`$$`](/docs/api/browser/$$), क्रमशः, WebdriverIO को या के साथ चलाते समय WDIO टेस्टरनर के बिना)। जब तक अन्यथा न कहा जाए, यह 0 मिलीसेकंड है।

आप इस टाइमआउट को इसके माध्यम से सेट कर सकते हैं:

```js
await browser.setTimeout({ 'implicit': 5000 })
```

## WebdriverIO संबंधित टाइमआउट

### `WaitFor*` टाइमआउट

WebdriverIO एक निश्चित स्थिति (जैसे सक्षम, दृश्यमान, मौजूदा) तक पहुँचने के लिए तत्वों पर प्रतीक्षा करने के लिए कई कमांड प्रदान करता है। ये आदेश एक चयनकर्ता तर्क और एक टाइमआउट संख्या लेते हैं, जो यह निर्धारित करता है कि उस तत्व को राज्य तक पहुंचने के लिए कितनी देर तक प्रतीक्षा करनी चाहिए। `WaitforTimeout` विकल्प आपको सभी `WaitFor*` कमांड के लिए ग्लोबल टाइमआउट सेट करने की अनुमति देता है, इसलिए आपको बार-बार एक ही टाइमआउट सेट करने की आवश्यकता नहीं है। _(लोअरकेस `f`नोट करें!)_

```js
// wdio.conf.js
export const config = {
    // ...
    waitforTimeout: 5000,
    // ...
}
```

अपने परीक्षणों में, अब आप यह कर सकते हैं:

```js
const myElem = await $('#myElem')
await myElem.waitForDisplayed()

// you can also overwrite the default timeout if needed
await myElem.waitForDisplayed({ timeout: 10000 })
```

## फ्रेमवर्क संबंधित टाइमआउट

WebdriverIO के साथ आप जिस परीक्षण ढांचे का उपयोग कर रहे हैं, उसे टाइमआउट से निपटना है, खासकर जब से सब कुछ अतुल्यकालिक है। यह सुनिश्चित करता है कि कुछ गलत होने पर परीक्षण प्रक्रिया अटक न जाए।

डिफ़ॉल्ट रूप से, समय समाप्ति 10 सेकंड है, जिसका अर्थ है कि एक परीक्षण में इससे अधिक समय नहीं लगना चाहिए।

मोचा में एक भी परीक्षण ऐसा दिखता है:

```js
it('should login into the application', () => {
    await browser.url('/login')

    const form = await $('form')
    const username = await $('#username')
    const password = await $('#password')

    await username.setValue('userXY')
    await password.setValue('******')
    await form.submit()

    expect(await browser.getTitle()).to.be.equal('Admin Area')
})
```

ककड़ी में, टाइमआउट एकल चरण परिभाषा पर लागू होता है। हालाँकि, यदि आप टाइमआउट बढ़ाना चाहते हैं क्योंकि आपका परीक्षण डिफ़ॉल्ट मान से अधिक समय लेता है, तो आपको इसे फ्रेमवर्क विकल्पों में सेट करना होगा।

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'}
 ]
}>
<TabItem value="mocha">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'mocha',
    mochaOpts: {
        timeout: 20000
    },
    // ...
}
```

</TabItem>
<TabItem value="jasmine">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'jasmine',
    jasmineOpts: {
        defaultTimeoutInterval: 20000
    },
    // ...
}
```

</TabItem>
<TabItem value="cucumber">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 20000
    },
    // ...
}
```

</TabItem>
</Tabs>
