---
id: pageobjects
title: Page Object Pattern
---

Version 5 of WebdriverIO was designed with Page Object Pattern support in mind. By introducing the "elements as first class citizens" principle, it is now possible to build up large test suites using this pattern.

There are no additional packages required to create page objects. It turns out that clean, modern classes provide all necessary features we need:

- inheritance between page objects
- lazy loading of elements
- encapsulation of methods and actions

The goal of using page objects is to abstract any page information away from the actual tests. Ideally, you should store all selectors or specific instructions that are unique for a certain page in a page object, so that you still can run your test after you've completely redesigned your page.

## Making A Page Object

First off, we need a main page object that we call `Page.js`. It will contain general selectors or methods which all page objects will inherit from.

```js
// Page.js
export default class Page {
    constructor() {
        this.title = 'My Page'
    }

    async open (path) {
        await browser.url(path)
    }
}
```

We will always `export` an instance of a page object, and never create that instance in the test. Since we are writing end-to-end tests, we always consider the page as a stateless construct&mdash;just as each HTTP request is a stateless construct.

Sure, the browser can carry session information and therefore can display different pages based on different sessions, but this shouldn't be reflected within a page object. These sorts of state changes should live in your actual tests.

Let's start testing the first page. डेमो उद्देश्यों के लिए, हम गिनी पिग के रूप में [एलिमेंटल सेलेनियम](http://elementalselenium.com) द्वारा [इंटरनेट](http://the-internet.herokuapp.com) वेबसाइट का उपयोग करते हैं। आइए [लॉगिन पेज](http://the-internet.herokuapp.com/login)के लिए पेज ऑब्जेक्ट उदाहरण बनाने का प्रयास करें।

## `Get` अपने चयनकर्ताओं को प्राप्त करें

पहला कदम उन सभी महत्वपूर्ण चयनकर्ताओं को लिखना है जो हमारे `login.page` ऑब्जेक्ट में गेट्टर फ़ंक्शंस के रूप में आवश्यक हैं:

```js
// login.page.js
import Page from './page'

class LoginPage extends Page {

    get username () { return $('#username') }
    get password () { return $('#password') }
    get submitBtn () { return $('form button[type="submit"]') }
    get flash () { return $('#flash') }
    get headerLinks () { return $$('#header a') }

    async open () {
        await super.open('login')
    }

    async submit () {
        await this.submitBtn.click()
    }

}

export default new LoginPage()
```

गेट्टर फ़ंक्शंस में चयनकर्ताओं को परिभाषित करना थोड़ा अजीब लग सकता है, लेकिन यह वास्तव में उपयोगी है। _जब आप संपत्ति का प्रयोग करते हैं _इन कार्यों का मूल्यांकन किया जाता है, जब आप ऑब्जेक्ट उत्पन्न नहीं करते हैं। इसके साथ आप उस पर कार्रवाई करने से पहले हमेशा तत्व का अनुरोध करते हैं।

## चेनिंग कमांड

WebdriverIO आंतरिक रूप से कमांड के अंतिम परिणाम को याद रखता है। यदि आप एक एक्शन कमांड के साथ एक एलिमेंट कमांड को चेन करते हैं, तो यह पिछले कमांड से एलिमेंट ढूंढता है और एक्शन को निष्पादित करने के लिए परिणाम का उपयोग करता है। इसके साथ आप चयनकर्ता (पहला पैरामीटर) को हटा सकते हैं और आदेश उतना ही सरल दिखता है:

```js
await LoginPage.username.setValue('Max Mustermann')
```

जो मूल रूप से वही है:

```js
let elem = await $('#username')
await elem.setValue('Max Mustermann')
```

या

```js
await $('#username').setValue('Max Mustermann')
```

## अपने परीक्षणों में पृष्ठ वस्तुओं का उपयोग करना

पृष्ठ के लिए आवश्यक तत्वों और विधियों को परिभाषित करने के बाद, आप इसके लिए परीक्षण लिखना शुरू कर सकते हैं। पेज ऑब्जेक्ट का उपयोग करने के लिए आपको केवल `import` (या `require`) करना है। इतना ही!

चूंकि आपने पृष्ठ ऑब्जेक्ट का पहले से निर्मित उदाहरण निर्यात किया है, इसे आयात करने से आप तुरंत इसका उपयोग करना शुरू कर सकते हैं।

यदि आप अभिकथन ढांचे का उपयोग करते हैं, तो आपके परीक्षण और भी अभिव्यंजक हो सकते हैं:

```js
// login.spec.js
import LoginPage from '../pageobjects/login.page'

describe('login form', () => {
    it('should deny access with wrong creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('foo')
        await LoginPage.password.setValue('bar')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('Your username is invalid!')
    })

    it('should allow access with correct creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('tomsmith')
        await LoginPage.password.setValue('SuperSecretPassword!')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('You logged into a secure area!')
    })
})
```

संरचनात्मक पक्ष से, यह अलग-अलग निर्देशिकाओं में विशिष्ट फ़ाइलों और पृष्ठ वस्तुओं को अलग करने के लिए समझ में आता है। इसके अतिरिक्त आप प्रत्येक पृष्ठ वस्तु को अंत: `.page.js`दे सकते हैं। इससे यह और स्पष्ट हो जाता है कि आप एक पेज ऑब्जेक्ट आयात करते हैं।

## आगे बढ़ना

यह WebdriverIO के साथ पेज ऑब्जेक्ट लिखने का मूल सिद्धांत है। लेकिन आप इससे कहीं अधिक जटिल पेज ऑब्जेक्ट स्ट्रक्चर बना सकते हैं! उदाहरण के लिए, आपके पास मोडल के लिए विशिष्ट पेज ऑब्जेक्ट हो सकते हैं, या एक विशाल पेज ऑब्जेक्ट को अलग-अलग वर्गों में विभाजित कर सकते हैं (प्रत्येक समग्र वेब पेज के एक अलग हिस्से का प्रतिनिधित्व करते हैं) जो मुख्य पेज ऑब्जेक्ट से प्राप्त होता है। पैटर्न वास्तव में आपके परीक्षणों से पृष्ठ की जानकारी को अलग करने के लिए बहुत सारे अवसर प्रदान करता है, जो आपके परीक्षण सूट को संरचित और ऐसे समय में स्पष्ट रखने के लिए महत्वपूर्ण है जब परियोजना और परीक्षणों की संख्या बढ़ती है।

आप यह उदाहरण (और इससे भी अधिक पेज ऑब्जेक्ट उदाहरण) GitHub पर [`example` फ़ोल्डर](https://github.com/webdriverio/webdriverio/tree/main/examples/pageobject) में पा सकते हैं।
