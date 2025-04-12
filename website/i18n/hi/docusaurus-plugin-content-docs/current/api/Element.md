---
id: element
title: एलीमेंट ऑब्जेक्ट
---

An Element Object is an object representing an element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. इसे कई एलिमेंट क्वेरी कमांड में से एक का उपयोग करके प्राप्त किया जा सकता है, उदाहरण के लिए [`$`](/docs/api/element/$), [`Custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) या [`shadow$`](/docs/api/element/shadow$)।

## विशेषताएं

एक तत्व वस्तु में निम्नलिखित गुण होते हैं:

| नाम         | प्रकार   | विवरण                                                                                                                                                                                                                                                            |
| ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | दूरस्थ सर्वर से निर्दिष्ट सत्र आईडी।                                                                                                                                                                                                                             |
| `elementId` | `String` | संबद्ध [वेब तत्व संदर्भ](https://w3c.github.io/webdriver/#elements) जिसका उपयोग प्रोटोकॉल स्तर पर तत्व के साथ इंटरैक्ट करने के लिए किया जा सकता है                                                                                                               |
| `selector`  | `String` | [चयनकर्ता](/docs/selectors) तत्व को क्वेरी करने के लिए प्रयोग किया जाता है।                                                                                                                                                                                      |
| `parent`    | `Object` | या तो [ब्राउज़र ऑब्जेक्ट](/docs/api/browser) जब तत्व इससे प्राप्त किया गया था (उदाहरण के लिए `cconst elem = browser.$('selector')`) या एक [तत्व ऑब्जेक्ट](/docs/api/element) यदि यह किसी तत्व दायरे से प्राप्त किया गया था (उदाहरण के लिए `elem.$( 'selector')`) |
| `options`   | `Object` | WebdriverIO [विकल्प](/docs/configuration) ब्राउज़र ऑब्जेक्ट कैसे बनाया गया था इसके आधार पर। अधिक [सेटअप प्रकार देखें](/docs/setuptypes)।                                                                                                                         |

## विधियां
An element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. उपलब्ध प्रोटोकॉल कमांड सत्र के प्रकार पर निर्भर करते हैं। यदि आप एक स्वचालित ब्राउज़र सत्र चलाते हैं, तो Appium [कमांड](/docs/api/appium) में से कोई भी उपलब्ध नहीं होगा और इसके विपरीत।

इसके अतिरिक्त निम्नलिखित आदेश उपलब्ध हैं:

| नाम                | पैरामीटर                                                              | विवरण                                                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to define custom commands that can be called from the browser object for composition purposes. [कस्टम कमांड](/docs/customcommands) गाइड में और पढ़ें।                                                                        |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to overwrite any browser command with custom functionality. सावधानी से उपयोग करें क्योंकि यह फ्रेमवर्क उपयोगकर्ताओं को भ्रमित कर सकता है। [कस्टम कमांड](/docs/customcommands#overwriting-native-commands) गाइड में और पढ़ें। |

## टिप्पणियां

### तत्व श्रृंखला

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element lookups. जैसा कि तत्व ऑब्जेक्ट आपको सामान्य क्वेरी विधियों का उपयोग करके उनकी पेड़ की शाखा के भीतर तत्वों को खोजने की अनुमति देता है, उपयोगकर्ता नेस्टेड तत्वों को निम्नानुसार प्राप्त कर सकते हैं:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

गहरी नेस्टेड संरचनाओं के साथ किसी भी नेस्टेड तत्व को सरणी में असाइन करने के लिए इसका उपयोग करना काफी वर्बोज़ हो सकता है। Therefore WebdriverIO has the concept of chained element queries that allow fetching nested elements like this:

```js
console.log(await $('#header').$('#headline').getText())
```

यह तत्वों का एक सेट लाते समय भी काम करता है, उदाहरण के लिए:

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

When working with a set of elements this can be especially useful when trying to interact with them, so instead of doing:

```js
const elems = await $$('div')
const locations = await Promise.all(
    elems.map((el) => el.getLocation())
)
```

आप तत्व श्रृंखला पर सीधे ऐरे विधियों को कॉल कर सकते हैं, उदाहरण के लिए:

```js
const location = await $$('div').map((el) => el.getLocation())
```

same as:

```js
const divs = await $$('div')
const location = await divs.map((el) => el.getLocation())
```

WebdriverIO uses a custom implementation that supports asynchronous iterators under the hood so all commands from their API are also supported for these use cases.

__Note:__ all async iterators return a promise even if your callback doesn't return one, e.g.:

```ts
const divs = await $$('div')
console.log(divs.map((div) => div.selector)) // ❌ returns "Promise<string>[]"
console.log(await divs.map((div) => div.selector)) // ✅ returns "string[]"
```

### कस्टम कमांड

आप आमतौर पर उपयोग किए जाने वाले वर्कफ़्लोज़ को अलग करने के लिए ब्राउज़र स्कोप पर कस्टम कमांड सेट कर सकते हैं। अधिक जानकारी के लिए [कस्टम कमांड](/docs/customcommands#adding-custom-commands) पर हमारी मार्गदर्शिका देखें।
