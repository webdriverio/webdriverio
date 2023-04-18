---
id: browser
title: The Browser Object
---

__Extends:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

The browser object is the session instance you use to control the browser or mobile device with. If you use the WDIO test runner, you can access the WebDriver instance through the global `browser` or `driver` object or import it using [`@wdio/globals`](/docs/api/globals). If you use WebdriverIO in standalone mode the browser object is returned by the [`remote`](/docs/api/modules#remoteoptions-modifier) method.

The session is initialized by the test runner. The same goes for ending the session. This is also done by the test runner process.

## Properties

A browser object has the following properties:

| Name                    | Type       | Details                                                                                                                               |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`          | `Object`   | Assigned capabilitie from the remote server.<br /><b>Example:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                            |
| `requestedCapabilities` | `Object`   | Capabilities requested from the remote server.<br /><b>Example:</b><pre>{ browserName: 'chrome' }</pre>                          |
| `sessionId`             | `String`   | Session id assigned from the remote server.                                                                                           |
| `options`               | `Object`   | WebdriverIO [options](/docs/configuration) depending on how the browser object was created. See more [setup types](/docs/setuptypes). |
| `commandList`           | `String[]` | A list of commands registered to the browser instance                                                                                 |
| `isMobile`              | `Boolean`  | Indicates a mobile session. See more under [Mobile Flags](#mobile-flags).                                                             |
| `isIOS`                 | `Boolean`  | Indicates an iOS session. [मोबाइल फ़्लैग्स](#mobile-flags)के अंतर्गत और देखें।                                                        |
| `isAndroid`             | `Boolean`  | एक एंड्राइड सत्र का संकेत देता है। [मोबाइल फ़्लैग्स](#mobile-flags)के अंतर्गत और देखें।                                               |

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

यह उपयोगी हो सकता है यदि, उदाहरण के लिए, आप डिवाइस प्रकार के आधार पर अपने [पेज ऑब्जेक्ट](PageObjects.md) में चयनकर्ताओं को परिभाषित करना चाहते हैं, जैसे:

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
