---
id: browser
title: ब्राउज़र वस्तु
---

__विस्तार:__ [इवेंटएमिटर](https://nodejs.org/api/events.html#class-eventemitter)

ब्राउज़र ऑब्जेक्ट वह सत्र उदाहरण है जिसका उपयोग आप ब्राउज़र या मोबाइल डिवाइस को नियंत्रित करने के लिए करते हैं। यदि आप WDIO टेस्ट रनर का उपयोग करते हैं, तो आप वैश्विक `browser` या `driver` ऑब्जेक्ट के माध्यम से वेबड्राइवर इंस्टेंस तक पहुंच सकते हैं या इसे [`@wdio/globals`](/docs/api/globals). का उपयोग करके आयात कर सकते हैं। यदि आप स्टैंडअलोन मोड में WebdriverIO का उपयोग करते हैं, तो ब्राउज़र ऑब्जेक्ट [`remote`](/docs/api/modules#remoteoptions-modifier) विधि द्वारा लौटाया जाता है।

सेशन को टेस्ट रनर द्वारा इनिशियलाइज़ किया जाता है। वही सत्र समाप्त करने के लिए जाता है। यह टेस्ट रनर प्रक्रिया द्वारा भी किया जाता है।

## विशेषताएं

ब्राउज़र ऑब्जेक्ट में निम्नलिखित गुण होते हैं:

| नाम                 | प्रकार     | विवरण                                                                                                                                    |
| ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `क्षमताएं`          | `वस्तु`    | दूरस्थ सर्वर से सौंपी गई क्षमता।<br /><b>उदाहरण:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                                           |
| `अनुरोधित क्षमताएं` | `वस्तु`    | दूरस्थ सर्वर से अनुरोधित क्षमताएं।<br /><b>उदाहरण:</b><pre>{ browserName: 'chrome' }</pre>                                         |
| `sessionId`         | `String`   | दूरस्थ सर्वर से निर्दिष्ट सत्र आईडी।                                                                                                     |
| `options`           | `Object`   | WebdriverIO [विकल्प](/docs/configuration) ब्राउज़र ऑब्जेक्ट कैसे बनाया गया था इसके आधार पर। अधिक [सेटअप प्रकार देखें](/docs/setuptypes)। |
| `commandList`       | `String[]` | ब्राउज़र उदाहरण के लिए पंजीकृत आदेशों की सूची                                                                                            |
| `isMobile`          | `Boolean`  | एक मोबाइल सत्र का संकेत देता है। [मोबाइल फ़्लैग्स](#mobile-flags)के अंतर्गत और देखें।                                                    |
| `isIOS`             | `Boolean`  | एक आईओएस सत्र इंगित करता है। [मोबाइल फ़्लैग्स](#mobile-flags)के अंतर्गत और देखें।                                                        |
| `isAndroid`         | `Boolean`  | एक एंड्राइड सत्र का संकेत देता है। [मोबाइल फ़्लैग्स](#mobile-flags)के अंतर्गत और देखें।                                                  |

## विधियां

आपके सत्र के लिए उपयोग किए गए ऑटोमेशन बैकएंड के आधार पर, WebdriverIO पहचानता है कि कौन से [प्रोटोकॉल कमांड](/docs/api/protocols) को [ब्राउज़र ऑब्जेक्ट](/docs/api/browser)से जोड़ा जाएगा। उदाहरण के लिए यदि आप क्रोम में एक स्वचालित सत्र चलाते हैं, तो आपके पास क्रोमियम विशिष्ट कमांड जैसे [`elementHover`](/docs/api/chromium#elementhover) तक पहुंच होगी, लेकिन [एपियम कमांड](/docs/api/appium)में से कोई भी नहीं।

इसके अलावा WebdriverIO पृष्ठ पर [ब्राउज़र](/docs/api/browser) या [तत्वों](/docs/api/element) के साथ इंटरैक्ट करने के लिए उपयोग करने के लिए अनुशंसित सुविधाजनक तरीकों का एक सेट प्रदान करता है।

इसके अतिरिक्त निम्नलिखित आदेश उपलब्ध हैं:

| नाम                  | पैरामीटर                                                                                                               | विवरण                                                                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | कस्टम कमांड को परिभाषित करने की अनुमति देता है जिसे रचना उद्देश्यों के लिए ब्राउज़र ऑब्जेक्ट से कॉल किया जा सकता है। [कस्टम कमांड](/docs/customcommands) गाइड में और पढ़ें।                                                                         |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | कस्टम कार्यक्षमता के साथ किसी भी ब्राउज़र कमांड को ओवरवाइट करने की अनुमति देता है। सावधानी से उपयोग करें क्योंकि यह फ्रेमवर्क उपयोगकर्ताओं को भ्रमित कर सकता है। [कस्टम कमांड](/docs/customcommands#overwriting-native-commands) गाइड में और पढ़ें। |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Allos एक कस्टम चयनकर्ता रणनीति को परिभाषित करने के लिए, [चयनकर्ता](/docs/selectors#custom-selector-strategies) मार्गदर्शिका में अधिक पढ़ें।                                                                                                         |

## टिप्पणियां

### मोबाइल फ्लेग

यदि आपको इस आधार पर अपने परीक्षण को संशोधित करने की आवश्यकता है कि आपका सत्र मोबाइल डिवाइस पर चलता है या नहीं, तो आप जांच करने के लिए मोबाइल फ़्लैग्स तक पहुंच सकते हैं।

उदाहरण के लिए, यह कॉन्फ़िगरेशन दिया गया है:

```js
// wdio.conf.js
export const config = {
    // ...
    capabilities: {
        platformName: 'iOS',
        app: 'net.company.SafariLauncher',
        udid: '123123123123abc',
        deviceName: 'iPhone',
        // ...
    }
    // ...
}
```

आप इन झंडों को अपने परीक्षण में इस प्रकार एक्सेस कर सकते हैं:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

यह उपयोगी हो सकता है यदि, उदाहरण के लिए, आप डिवाइस प्रकार के आधार पर अपने [पेज ऑब्जेक्ट](../pageobjects) में चयनकर्ताओं को परिभाषित करना चाहते हैं, जैसे:

```js
// mypageobject.page.js
import Page from './page'

class LoginPage extends Page {
    // ...
    get username() {
        const selectorAndroid = 'new UiSelector().text("Cancel").className("android.widget.Button")'
        const selectorIOS = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
        const selectorType = driver.isAndroid ? 'android' : 'ios'
        const selector = driver.isAndroid ? selectorAndroid : selectorIOS
        return $(`${selectorType}=${selector}`)
    }
    // ...
}
```

आप कुछ डिवाइस प्रकारों के लिए केवल कुछ परीक्षण चलाने के लिए भी इन झंडों का उपयोग कर सकते हैं:

```js
// mytest.e2e.js
describe('my test', () => {
    // ...
    // only run test with Android devices
    if (driver.isAndroid) {
        it('tests something only for Android', () => {
            // ...
        })
    }
    // ...
})
```

### आयोजन
ब्राउज़र ऑब्जेक्ट एक EventEmitter है और आपके उपयोग के मामलों के लिए कुछ ईवेंट उत्सर्जित होते हैं।

यहाँ घटनाओं की एक सूची है। ध्यान रखें कि यह अभी उपलब्ध घटनाओं की पूरी सूची नहीं है। यहां अधिक घटनाओं के विवरण जोड़कर दस्तावेज़ को अद्यतन करने में योगदान करने के लिए स्वतंत्र महसूस करें।

#### `request.performance`
यह वेबड्राइवर स्तर के संचालन को मापने के लिए एक घटना है। जब भी WebdriverIO WebDriver बैकएंड को एक अनुरोध भेजता है, तो यह घटना कुछ उपयोगी जानकारी के साथ उत्सर्जित होगी:

- `durationMillisecond`: मिलीसेकंड में अनुरोध की समय अवधि।
- `error`: अनुरोध विफल होने पर त्रुटि वस्तु।
- `request`: अनुरोध वस्तु। आप यूआरएल, विधि, शीर्षलेख इत्यादि पा सकते हैं।
- `retryCount`: यदि यह `0`है, तो अनुरोध पहला प्रयास था। जब WebDriverIO हुड के नीचे पुनः प्रयास करता है तो यह बढ़ जाएगा।
- `success`: अनुरोध का प्रतिनिधित्व करने के लिए बूलियन सफल हुआ या नहीं। यदि यह `false`, `error` संपत्ति भी प्रदान की जाएगी।

एक उदाहरण घटना:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### कस्टम कमांड

आप आमतौर पर उपयोग किए जाने वाले वर्कफ़्लोज़ को अलग करने के लिए ब्राउज़र स्कोप पर कस्टम कमांड सेट कर सकते हैं। अधिक जानकारी के लिए [कस्टम कमांड](/docs/customcommands#adding-custom-commands) पर हमारी मार्गदर्शिका देखें।
