---
id: multiremote
title: मल्टीरिमोट
---

WebdriverIO आपको एक ही परीक्षण में एकाधिक स्वचालित सत्र चलाने की अनुमति देता है। यह तब आसान हो जाता है जब आप ऐसी सुविधाओं का परीक्षण कर रहे होते हैं जिनके लिए एक से अधिक उपयोगकर्ताओं की आवश्यकता होती है (उदाहरण के लिए, चैट या WebRTC एप्लिकेशन)।

कुछ दूरस्थ उदाहरण बनाने के बजाय जहां आपको प्रत्येक उदाहरण पर [`newSession`](/docs/api/webdriver#newsession) या [`url`](/docs/api/browser/url) जैसे सामान्य कमांड निष्पादित करने की आवश्यकता होती है, आप बस एक **मल्टीरिमोट** उदाहरण बना सकते हैं और एक ही समय में सभी ब्राउज़रों को नियंत्रित कर सकते हैं।

ऐसा करने के लिए, केवल `multiremote()` फ़ंक्शन का उपयोग करें, और मानों के लिए `capabilities` के नाम वाले ऑब्जेक्ट में पास करें। प्रत्येक क्षमता को एक नाम देकर, आप एक उदाहरण पर कमांड निष्पादित करते समय उस एकल उदाहरण को आसानी से चुन सकते हैं और उस तक पहुंच सकते हैं।

::: जानकारी

मल्टीरेमोट _नहीं_ है जो आपके सभी परीक्षणों को समानांतर में निष्पादित करने के लिए है। इसका उद्देश्य विशेष एकीकरण परीक्षणों (जैसे चैट एप्लिकेशन) के लिए कई ब्राउज़रों और/या मोबाइल उपकरणों को समन्वयित करने में सहायता करना है।

:::

सभी मल्टीरिमोट उदाहरण परिणामों की एक सरणी लौटाते हैं। पहला परिणाम क्षमता वस्तु में पहले परिभाषित क्षमता का प्रतिनिधित्व करता है, दूसरा परिणाम दूसरी क्षमता और इसी तरह।

## स्टैंडअलोन मोड का उपयोग करना

यहाँ __स्टैंडअलोन मोड__में मल्टीरिमोट इंस्टेंस बनाने का एक उदाहरण दिया गया है:

```js
import { multiremote } from 'webdriverio'

(async () => {
    const browser = await multiremote({
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    })

    // open url with both browser at the same time
    await browser.url('http://json.org')

    // call commands at the same time
    const title = await browser.getTitle()
    expect(title).toEqual(['JSON', 'JSON'])

    // click on an element at the same time
    const elem = await browser.$('#someElem')
    await elem.click()

    // only click with one browser (Firefox)
    await elem.getInstance('myFirefoxBrowser').click()
})()
```

## WDIO टेस्टरनर का उपयोग करना

WDIO टेस्टरनर में मल्टीरेमोट का उपयोग करने के लिए, बस अपने `wdio.conf.js` में `capabilities` ऑब्जेक्ट को एक ऑब्जेक्ट के रूप में ब्राउज़र नामों के साथ कुंजी के रूप में परिभाषित करें (क्षमताओं की सूची के बजाय):

```js
export const config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }
    // ...
}
```

यह क्रोम और फ़ायरफ़ॉक्स के साथ दो वेबड्राइवर सत्र बनाएगा। केवल क्रोम और फ़ायरफ़ॉक्स के बजाय आप [एपियम](http://appium.io) या एक मोबाइल डिवाइस और एक ब्राउज़र का उपयोग करके दो मोबाइल डिवाइस भी बूट कर सकते हैं।

आप स्थानीय वेबड्राइवर/एपियम, या सेलेनियम स्टैंडअलोन उदाहरणों के साथ [क्लाउड सेवाओं में से एक बैकएंड](https://webdriver.io/docs/cloudservices.html) को बूट भी कर सकते हैं। WebdriverIO स्वचालित रूप से क्लाउड बैकएंड क्षमताओं का पता लगाता है यदि आपने ब्राउज़र क्षमताओं में `bstack:options` ([Browserstack](https://webdriver.io/docs/browserstack-service.html)), `sauce:options` ([SauceLabs](https://webdriver.io/docs/sauce-service.html)), या `tb:options` ([TestingBot](https://webdriver.io/docs/testingbot-service.html)) में से कोई भी निर्दिष्ट किया है।

```js
export const config = {
    // ...
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myBrowserStackFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox',
                'bstack:options': {
                    // ...
                }
            }
        }
    },
    services: [
        ['browserstack', 'selenium-standalone']
    ],
    // ...
}
```

किसी भी प्रकार का OS/ब्राउज़र संयोजन यहाँ संभव है (मोबाइल और डेस्कटॉप ब्राउज़र सहित)। `browser` चर के माध्यम से आपके परीक्षण कॉल के सभी आदेश प्रत्येक उदाहरण के साथ समानांतर में निष्पादित होते हैं। यह आपके एकीकरण परीक्षणों को सुव्यवस्थित करने और उनके निष्पादन को गति देने में मदद करता है।

उदाहरण के लिए, यदि आप एक URL खोलते हैं:

```js
browser.url('https://socketio-chat-h9jt.herokuapp.com/')
```

प्रत्येक कमांड का परिणाम कुंजी के रूप में ब्राउज़र नाम के साथ एक ऑब्जेक्ट होगा, और कमांड परिणाम मान के रूप में होगा, जैसे:

```js
// wdio testrunner example
await browser.url('https://www.whatismybrowser.com')

const elem = await $('.string-major')
const result = await elem.getText()

console.log(result[0]) // returns: 'Chrome 40 on Mac OS X (Yosemite)'
console.log(result[1]) // returns: 'Firefox 35 on Mac OS X (Yosemite)'
```

ध्यान दें कि प्रत्येक कमांड को एक-एक करके निष्पादित किया जाता है। इसका मतलब यह है कि सभी ब्राउज़रों द्वारा इसे निष्पादित करने के बाद कमांड समाप्त हो जाती है। यह सहायक है क्योंकि यह ब्राउज़र क्रियाओं को समन्वयित रखता है, जिससे यह समझना आसान हो जाता है कि वर्तमान में क्या हो रहा है।

कभी-कभी कुछ का परीक्षण करने के लिए प्रत्येक ब्राउज़र में अलग-अलग चीजें करना आवश्यक होता है। उदाहरण के लिए, यदि हम चैट एप्लिकेशन का परीक्षण करना चाहते हैं, तो एक ब्राउज़र होना चाहिए जो एक पाठ संदेश भेजता है जबकि दूसरा ब्राउज़र इसे प्राप्त करने की प्रतीक्षा करता है, और फिर उस पर एक अभिकथन चलाता है।

WDIO टेस्टरनर का उपयोग करते समय, यह ब्राउज़र नामों को उनके उदाहरणों के साथ वैश्विक दायरे में पंजीकृत करता है:

```js
const myChromeBrowser = browser.getInstance('myChromeBrowser')
await myChromeBrowser.$('#message').setValue('Hi, I am Chrome')
await myChromeBrowser.$('#send').click()

// wait until messages arrive
await $('.messages').waitForExist()
// check if one of the messages contain the Chrome message
assert.true(
    (
        await $$('.messages').map((m) => m.getText())
    ).includes('Hi, I am Chrome')
)
```

इस उदाहरण में, `myFirefoxBrowser` उदाहरण `myChromeBrowser` उदाहरण द्वारा `#send` बटन पर क्लिक करने के बाद एक संदेश पर प्रतीक्षा करना शुरू कर देगा।

मल्टीरिमोट कई ब्राउज़रों को नियंत्रित करना आसान और सुविधाजनक बनाता है, चाहे आप उन्हें समानांतर में एक ही काम करना चाहते हैं, या कॉन्सर्ट में अलग-अलग चीजें करना चाहते हैं।

## ब्राउजर ऑब्जेक्ट के माध्यम से स्ट्रिंग्स का उपयोग करके ब्राउजर इंस्टेंसेस तक पहुंचना
उनके वैश्विक चर (जैसे `myChromeBrowser`, `myFirefoxBrowser`) के माध्यम से ब्राउज़र आवृत्ति तक पहुँचने के अलावा, आप उन्हें `browser` ऑब्जेक्ट के माध्यम से भी एक्सेस कर सकते हैं, उदाहरण के लिए `browser["myChromeBrowser"]` या `browser["myFirefoxBrowser"]`. आप `browser.instances`द्वारा अपने सभी उदाहरणों की सूची प्राप्त कर सकते हैं। पुन: प्रयोज्य परीक्षण चरणों को लिखते समय यह विशेष रूप से उपयोगी होता है जिसे किसी भी ब्राउज़र में निष्पादित किया जा सकता है, उदाहरण के लिए:

wdio.conf.js:
```js
    capabilities: {
        userA: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        userB: {
            capabilities: {
                browserName: 'chrome'
            }
        }
    }
```

ककड़ी फ़ाइल:
    ```feature
    When User A types a message into the chat
    ```

चरण परिभाषा फ़ाइल:
```js
When(/^User (.) types a message into the chat/, async (userId) => {
    await browser.getInstance(`user${userId}`).$('#message').setValue('Hi, I am Chrome')
    await browser.getInstance(`user${userId}`).$('#send').click()
})
```
