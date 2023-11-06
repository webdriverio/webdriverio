---
id: selectors
title: चयनकर्ताओं
---

[वेबड्राइवर प्रोटोकॉल](https://w3c.github.io/webdriver/) किसी तत्व को क्वेरी करने के लिए कई चयनकर्ता रणनीतियाँ प्रदान करता है। WebdriverIO तत्वों का चयन सरल रखने के लिए उन्हें सरल बनाता है। कृपया ध्यान दें कि भले ही तत्वों को क्वेरी करने के आदेश को `$` और `$$`कहा जाता है, उनका jQuery या [Sizzle Selector Engine](https://github.com/jquery/sizzle)से कोई लेना-देना नहीं है।

जबकि बहुत सारे अलग-अलग चयनकर्ता उपलब्ध हैं, उनमें से कुछ ही सही तत्व खोजने के लिए एक लचीला तरीका प्रदान करते हैं। उदाहरण के लिए, निम्न बटन दिया गया है:

```html
<button
  id="main"
  class="btn btn-large"
  name="submission"
  role="button"
  data-testid="submit"
>
  Submit
</button>
```

हम __करते हैं__ और __नहीं__ निम्नलिखित चयनकर्ताओं की अनुशंसा करते हैं:

| चयनकर्ताओं                                    | अनुशंसित   | नोट्स                                                                     |
| --------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `$('button')`                                 | 🚨 कभी नहीं | सबसे खराब - बहुत सामान्य, कोई संदर्भ नहीं।                                |
| `$('.btn.btn-large')`                         | 🚨 कभी नहीं | खराब। स्टाइल के साथ युग्मित। अत्यधिक परिवर्तन के अधीन।                    |
| `$('#main')`                                  | ⚠️ संयम से | बेहतर। लेकिन अभी भी स्टाइलिंग या जेएस इवेंट श्रोताओं के साथ जुड़ा हुआ है। |
| `$(() => document.queryElement('button'))` | ⚠️ संयम से | प्रभावी पूछताछ, लिखने के लिए जटिल।                                        |
| `$('button[name="submission"]')`              | ⚠️ संयम से | `name` विशेषता के साथ जोड़ा गया जिसमें HTML शब्दार्थ है।                  |
| `$('button[data-testid="submit"]')`           | ✅ अच्छा    | अतिरिक्त विशेषता की आवश्यकता है, a11y से कनेक्ट नहीं है।                  |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ हमेशा    | श्रेष्ठ। यह दिखता है कि उपयोगकर्ता पेज के साथ कैसे इंटरैक्ट करता है।      |

## सीएसएस क्वेरी चयनकर्ता

यदि अन्यथा इंगित नहीं किया गया है, तो WebdriverIO [CSS चयनकर्ता](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) पैटर्न का उपयोग करके तत्वों को क्वेरी करेगा, उदाहरण के लिए:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L7-L8
```

## लिंक लेख

इसमें एक विशिष्ट पाठ के साथ एंकर तत्व प्राप्त करने के लिए, टेक्स्ट को बराबर (`=`) चिह्न से प्रारंभ करें।

उदाहरण के लिए:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L3
```

आप इस तत्व को कॉल करके पूछ सकते हैं:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L16-L18
```

## आंशिक लिंक लेख

एक एंकर तत्व खोजने के लिए जिसका दृश्य पाठ आंशिक रूप से आपके खोज मूल्य से मेल खाता है, क्वेरी स्ट्रिंग के सामने `*=` का उपयोग करके क्वेरी करें (उदाहरण के लिए `*=driver`)।

आप ऊपर दिए गए उदाहरण से तत्व को कॉल करके भी पूछ सकते हैं:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L24-L26
```

__नोट:__ आप एक चयनकर्ता में एकाधिक चयनकर्ता रणनीतियों को मिश्रित नहीं कर सकते हैं। एक ही लक्ष्य तक पहुँचने के लिए कई श्रृंखलित तत्व प्रश्नों का उपयोग करें, उदाहरण के लिए:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('*=driver')
```

## निश्चित लेख वाला तत्व

उसी तकनीक को तत्वों पर भी लागू किया जा सकता है।

उदाहरण के लिए, यहाँ "मेरे पृष्ठ में आपका स्वागत है" पाठ के साथ स्तर 1 शीर्षक के लिए एक प्रश्न है:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L2
```

आप इस तत्व को कॉल करके पूछ सकते हैं:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L35-L36
```

या क्वेरी आंशिक पाठ का उपयोग करना:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L42-L43
```

वही `id` और `class` नामों के लिए काम करता है:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L4
```

आप इस तत्व को कॉल करके पूछ सकते हैं:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L45-L55
```

__नोट:__ आप एक चयनकर्ता में एकाधिक चयनकर्ता रणनीतियों को मिश्रित नहीं कर सकते हैं। एक ही लक्ष्य तक पहुँचने के लिए कई श्रृंखलित तत्व प्रश्नों का उपयोग करें, उदाहरण के लिए:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('h1*=Welcome')
```

## टैग का नाम

किसी विशिष्ट टैग नाम वाले तत्व को क्वेरी करने के लिए, `<tag>` या `<tag />`का उपयोग करें।

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L5
```

आप इस तत्व को कॉल करके पूछ सकते हैं:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L61-L62
```

## नाम गुण

किसी विशिष्ट नाम विशेषता वाले तत्वों को क्वेरी करने के लिए आप या तो एक सामान्य CSS3 चयनकर्ता या [JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) से प्रदान की गई नाम रणनीति का उपयोग कर सकते हैं जैसे [नाम = "कुछ-नाम"] चयनकर्ता पैरामीटर के रूप में:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L68-L69
```

__नोट:__ यह चयनकर्ता रणनीति इसे पदावनत करती है और केवल पुराने ब्राउज़र में काम करती है जो JSONWireProtocol प्रोटोकॉल द्वारा या Appium का उपयोग करके चलाए जाते हैं।

## xपाथ

विशिष्ट [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath)के माध्यम से तत्वों को क्वेरी करना भी संभव है।

एक xPath चयनकर्ता के पास `//body/div[6]/div[1]/span[1]`जैसा प्रारूप होता है।

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/xpath.html
```

आप दूसरे पैराग्राफ को कॉल करके क्वेरी कर सकते हैं:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L75-L76
```

आप DOM ट्री को ऊपर और नीचे करने के लिए भी xPath का उपयोग कर सकते हैं:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L78-L79
```

## अभिगम्यता नाम चयनकर्ता

क्वेरी तत्वों को उनके सुलभ नाम से। एक्सेस करने योग्य नाम वह है जिसकी घोषणा स्क्रीन रीडर द्वारा की जाती है जब वह तत्व फोकस प्राप्त करता है। पहुँच योग्य नाम का मान दृश्य सामग्री या छिपे हुए पाठ विकल्प दोनों हो सकते हैं।

:::info

आप इस चयनकर्ता के बारे में हमारे [रिलीज़ ब्लॉग पोस्ट](/blog/2022/09/05/accessibility-selector)में अधिक पढ़ सकते हैं

:::

### `aria-label`द्वारा प्राप्त करें

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L1
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L86-L87
```

### `aria-labelledby` फेच करें

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L2-L3
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L93-L94
```

### सामग्री द्वारा प्राप्त करें

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L4
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L100-L101
```

### शीर्षक से प्राप्त करें

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L5
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L107-L108
```

### `alt` प्रॉपर्टी द्वारा प्राप्त करें

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L114-L115
```

## ARIA - भूमिका विशेषता

[ARIA भूमिका](https://www.w3.org/TR/html-aria/#docconformance)के आधार पर तत्वों को क्वेरी करने के लिए, आप चयनकर्ता पैरामीटर के रूप में `[role=button]` जैसे तत्व की भूमिका सीधे निर्दिष्ट कर सकते हैं:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L13
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L131-L132
```

## आईडी विशेषता

लोकेटर रणनीति "आईडी" वेबड्राइवर प्रोटोकॉल में समर्थित नहीं है, किसी को आईडी का उपयोग करके तत्वों को खोजने के बजाय सीएसएस या xPath चयनकर्ता रणनीतियों का उपयोग करना चाहिए।

हालाँकि कुछ ड्राइवर (जैसे [Appium You.i इंजन ड्राइवर](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) अभी भी [इस चयनकर्ता](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) का समर्थन कर सकते हैं।

आईडी के लिए वर्तमान समर्थित चयनकर्ता सिंटैक्स हैं:

```js
//css locator
const button = await $('#someid')
//xpath locator
const button = await $('//*[@id="someid"]')
//id strategy
// Note: works only in Appium or similar frameworks which supports locator strategy "ID"
const button = await $('id=resource-id/iosname')
```

## जेएस फंक्शन

आप वेब नेटिव एपीआई का उपयोग करके तत्वों को लाने के लिए जावास्क्रिप्ट फ़ंक्शंस का भी उपयोग कर सकते हैं। बेशक, आप इसे केवल एक वेब संदर्भ (जैसे, `ब्राउज़र`या मोबाइल में वेब संदर्भ) के अंदर ही कर सकते हैं।

निम्नलिखित HTML स्निपेट को देखते हुए:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/js.html
```

आप `#elem` के सहोदर तत्व को निम्नानुसार क्वेरी कर सकते हैं:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L139-L143
```

## गहरे चयनकर्ता

कई फ्रंटएंड एप्लिकेशन [शैडो डोम](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)वाले तत्वों पर बहुत अधिक निर्भर करते हैं। वर्कअराउंड के बिना शैडो डोम के भीतर तत्वों को क्वेरी करना तकनीकी रूप से असंभव है। [`shadow$`](https://webdriver.io/docs/api/element/shadow$) और [`shadow$$`](https://webdriver.io/docs/api/element/shadow$$) ऐसे वर्कअराउंड रहे हैं जिनकी [सीमाएं](https://github.com/Georgegriff/query-selector-shadow-dom#how-is-this-different-to-shadow)थीं। गहरे चयनकर्ता के साथ अब आप सामान्य क्वेरी कमांड का उपयोग करके किसी भी शैडो डोम के भीतर सभी तत्वों को क्वेरी कर सकते हैं।

देखते हुए हमारे पास निम्नलिखित संरचना के साथ एक आवेदन है:

![क्रोम उदाहरण](https://github.com/Georgegriff/query-selector-shadow-dom/raw/main/Chrome-example.png "क्रोम उदाहरण")

इस चयनकर्ता के साथ आप `<button />` तत्व को क्वेरी कर सकते हैं जो किसी अन्य छाया DOM में नेस्टेड है, उदाहरण के लिए:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L147-L149
```

## मोबाइल चयनकर्ता

हाइब्रिड मोबाइल परीक्षण के लिए, यह महत्वपूर्ण है कि कमांड निष्पादित करने से पहले ऑटोमेशन सर्वर सही *संदर्भ* में हो। इशारों को स्वचालित करने के लिए, चालक को आदर्श रूप से मूल संदर्भ में सेट किया जाना चाहिए। लेकिन DOM से तत्वों का चयन करने के लिए, ड्राइवर को प्लेटफ़ॉर्म के वेबव्यू प्रसंग पर सेट करने की आवश्यकता होगी। केवल *तो* ऊपर वर्णित विधियों का उपयोग किया जा सकता है।

देशी मोबाइल परीक्षण के लिए, संदर्भों के बीच कोई स्विचिंग नहीं है, क्योंकि आपको मोबाइल रणनीतियों का उपयोग करना है और अंतर्निहित डिवाइस ऑटोमेशन तकनीक का सीधे उपयोग करना है। यह विशेष रूप से तब उपयोगी होता है जब किसी परीक्षण को तत्वों को खोजने पर कुछ सूक्ष्म नियंत्रण की आवश्यकता होती है।

### Android UiAutomator

एंड्रॉइड का यूआई ऑटोमेटर ढांचा तत्वों को खोजने के कई तरीके प्रदान करता है। आप तत्वों का पता लगाने के लिए [UI Automator API](https://developer.android.com/tools/testing-support-library/index.html#uia-apis)का उपयोग कर सकते हैं, विशेष रूप से [UiSelector वर्ग](https://developer.android.com/reference/androidx/test/uiautomator/UiSelector) का। एपियम में आप जावा कोड को एक स्ट्रिंग के रूप में सर्वर को भेजते हैं, जो इसे एप्लिकेशन के वातावरण में निष्पादित करता है, तत्व या तत्वों को वापस करता है।

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")'
const button = await $(`android=${selector}`)
await button.click()
```

### Android DataMatcher और ViewMatcher (केवल एस्प्रेसो)

एंड्रॉइड की डेटामैचर रणनीति [डेटा मैचर](https://developer.android.com/reference/android/support/test/espresso/DataInteraction)द्वारा तत्वों को खोजने का एक तरीका प्रदान करती है

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"]
})
await menuItem.click()
```

और इसी तरह [मैचर](https://developer.android.com/reference/android/support/test/espresso/ViewInteraction)देखें

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"],
  "class": "androidx.test.espresso.matcher.ViewMatchers"
})
await menuItem.click()
```

### Android दृश्य टैग (केवल एस्प्रेसो)

दृश्य टैग रणनीति तत्वों को उनके [टैग](https://developer.android.com/reference/android/support/test/espresso/matcher/ViewMatchers.html#withTagValue%28org.hamcrest.Matcher%3Cjava.lang.Object%3E%29)द्वारा खोजने का एक सुविधाजनक तरीका प्रदान करती है।

```js
const elem = await $('-android viewtag:tag_identifier')
await elem.click()
```

### iOS UIAutomation

आईओएस एप्लिकेशन को स्वचालित करते समय, ऐप्पल के [यूआई ऑटोमेशन फ्रेमवर्क](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) का उपयोग तत्वों को खोजने के लिए किया जा सकता है।

इस जावास्क्रिप्ट [एपीआई](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) में दृश्य और उस पर सब कुछ तक पहुंचने के तरीके हैं।

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
const button = await $(`ios=${selector}`)
await button.click()
```

आप आगे भी तत्व चयन को परिशोधित करने के लिए एपियम में आईओएस यूआई ऑटोमेशन के भीतर भविष्यवाणी खोज का उपयोग कर सकते हैं। विवरण के लिए [यहाँ](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) देखें।

### iOS XCUITest विधेय स्ट्रिंग्स और क्लास चेन

IOS 10 और इसके बाद के संस्करण ( `XCUITest` ड्राइवर का उपयोग करके) के साथ, आप [विधेय स्ट्रिंग्स](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules)का उपयोग कर सकते हैं:

```js
const selector = `type == 'XCUIElementTypeSwitch' && name CONTAINS 'Allow'`
const switch = await $(`-ios predicate string:${selector}`)
await switch.click()
```

और [क्लास चेन](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton'
const button = await $(`-ios class chain:${selector}`)
await button.click()
```

### Accessibility ID

`accessibility id` लोकेटर रणनीति को यूआई तत्व के लिए एक विशिष्ट पहचानकर्ता को पढ़ने के लिए डिज़ाइन किया गया है। इसका स्थानीयकरण या किसी अन्य प्रक्रिया के दौरान नहीं बदलने का लाभ है जो पाठ को बदल सकता है। इसके अलावा, यह क्रॉस-प्लेटफ़ॉर्म परीक्षण बनाने में सहायता कर सकता है, यदि तत्व जो कार्यात्मक रूप से समान हैं, उनकी समान पहुंच आईडी है।

- IOS के लिए यह `accessibility identifier` है जिसे Apple [यहाँ](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html)द्वारा निर्धारित किया गया है।
- एंड्रॉइड के लिए `accessibility id` तत्व के लिए `content-description` पर मैप करता है, जैसा कि [यहां](https://developer.android.com/training/accessibility/accessible-app.html)वर्णित है।

दोनों प्लेटफार्मों के लिए, उनकी `accessibility id` द्वारा एक तत्व (या एकाधिक तत्व) प्राप्त करना आमतौर पर सबसे अच्छी विधि है। यह बहिष्कृत `name` रणनीति पर भी पसंदीदा तरीका है।

```js
const elem = await $('~my_accessibility_identifier')
await elem.click()
```

### कक्षा का नाम

`class name` रणनीति एक `string` है जो वर्तमान दृश्य पर UI तत्व का प्रतिनिधित्व करती है।

- IOS के लिए यह [UIAutomation क्लास](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html)का पूरा नाम है, और `UIA-`से शुरू होगा, जैसे टेक्स्ट फ़ील्ड के लिए `UIATextField`। पूरा संदर्भ [यहां](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation)पाया जा सकता है
- Android के लिए यह [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [class](https://developer.android.com/reference/android/widget/package-summary.html)का पूरी तरह से योग्य नाम है, जैसे `android.widget.EditText` टेक्स्ट फ़ील्ड के लिए। पूरा संदर्भ [यहां](https://developer.android.com/reference/android/widget/package-summary.html)पाया जा सकता है
- Youi.tv के लिए यह Youi.tv वर्ग का पूरा नाम है, और `CYI-`के साथ होगा, जैसे कि एक पुश बटन तत्व के लिए `CYIPushButtonView`। पूरा संदर्भ [You.i इंजन ड्राइवर के GitHub पेज](https://github.com/YOU-i-Labs/appium-youiengine-driver)पर पाया जा सकता है

```js
// iOS example
await $('UIATextField').click()
// Android example
await $('android.widget.DatePicker').click()
// Youi.tv example
await $('CYIPushButtonView').click()
```

## चेन चयनकर्ता

यदि आप अपनी क्वेरी में अधिक विशिष्ट होना चाहते हैं, तो आप चयनकर्ताओं को तब तक चेन कर सकते हैं जब तक आपको सही तत्व नहीं मिल जाता। यदि आप अपने वास्तविक आदेश से पहले `element` को कॉल करते हैं, तो WebdriverIO उस तत्व से क्वेरी प्रारंभ करता है।

उदाहरण के लिए, यदि आपके पास DOM संरचना है जैसे:

```html
<div class="row">
  <div class="entry">
    <label>Product A</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product B</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product C</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
</div>
```

और आप उत्पाद बी को कार्ट में जोड़ना चाहते हैं, केवल सीएसएस चयनकर्ता का उपयोग करके ऐसा करना मुश्किल होगा।

चयनकर्ता श्रृंखलन के साथ, यह आसान है। वांछित तत्व को चरण दर चरण संक्षिप्त करें:

```js
await $('.row .entry:nth-child(2)').$('button*=Add').click()
```

### एपियम छवि चयनकर्ता

`image` लोकेटर रणनीति का उपयोग करके, एपियम को उस तत्व का प्रतिनिधित्व करने वाली एक छवि फ़ाइल भेजना संभव है जिसे आप एक्सेस करना चाहते हैं।

समर्थित फ़ाइल स्वरूप `jpg, png, gif, bmp, svg`

पूरा संदर्भ [यहां](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md)पाया जा सकता है

```js
const elem = await $('./file/path/of/image/test.jpg')
await elem.click()
```

**नोट**: जिस तरह से ऐपियम इस चयनकर्ता के साथ काम करता है वह आंतरिक रूप से एक (ऐप) स्क्रीनशॉट बनाएगा और यह सत्यापित करने के लिए कि क्या तत्व उस (ऐप) स्क्रीनशॉट में पाया जा सकता है, प्रदान की गई छवि चयनकर्ता का उपयोग करेगा।

इस तथ्य से अवगत रहें कि एपियम आपके (एप) स्क्रीन के सीएसएस-आकार से मिलान करने के लिए लिए गए (एप) स्क्रीनशॉट का आकार बदल सकता है (यह आईफोन पर होगा लेकिन रेटिना डिस्प्ले वाली मैक मशीनों पर भी होगा क्योंकि डीपीआर बड़ा है 1 से अधिक)। इसके परिणामस्वरूप मिलान नहीं मिलेगा क्योंकि प्रदान किया गया छवि चयनकर्ता मूल स्क्रीनशॉट से लिया गया हो सकता है। आप ऐपियम सर्वर सेटिंग्स को अपडेट करके इसे ठीक कर सकते हैं, सेटिंग्स के लिए [ऐपियम डॉक्स](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md#related-settings) और विस्तृत विवरण पर [यह टिप्पणी](https://github.com/webdriverio/webdriverio/issues/6097#issuecomment-726675579) देखें।

## प्रतिक्रिया चयनकर्ता

WebdriverIO घटक नाम के आधार पर प्रतिक्रिया घटकों का चयन करने का एक तरीका प्रदान करता है। ऐसा करने के लिए, आपके पास दो आदेशों का विकल्प है: `react$` और `react$$`।

ये आदेश आपको [रिएक्ट वर्चुअलडोम](https://reactjs.org/docs/faq-internals.html) से घटकों का चयन करने की अनुमति देते हैं और या तो एक WebdriverIO तत्व या तत्वों की एक सरणी (किस फ़ंक्शन का उपयोग किया जाता है) के आधार पर लौटाते हैं।

**नोट**: आदेश `react$` और `react$ $` कार्यक्षमता में समान हैं, सिवाय इसके कि `react$$` वेबड्राइवरियो तत्वों की एक सरणी के रूप में *सभी* मिलान उदाहरण लौटाएंगे, और `react$` वापस आ जाएगी पहला उदाहरण मिला।

#### मूल उदाहरण

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
    return (
        <div>
            MyComponent
        </div>
    )
}

function App() {
    return (<MyComponent />)
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

उपरोक्त कोड में एप्लिकेशन के अंदर एक साधारण `MyComponent` उदाहरण है, जो रिएक्ट HTML तत्व के अंदर `id="root"`के साथ प्रस्तुत कर रहा है।

`browser.react$` कमांड के साथ, आप `MyComponent`का एक उदाहरण चुन सकते हैं:

```js
const myCmp = await browser.react$('MyComponent')
```

अब जब आपके पास WebdriverIO तत्व `myCmp` चर में संग्रहीत है, तो आप इसके विरुद्ध तत्व आदेश निष्पादित कर सकते हैं।

#### फ़िल्टरिंग घटक

लाइब्रेरी जो WebdriverIO आंतरिक रूप से उपयोग करती है, आपके चयन को प्रोप और/या घटक की स्थिति द्वारा फ़िल्टर करने की अनुमति देती है। ऐसा करने के लिए, आपको प्रॉप्स के लिए दूसरा तर्क और/या राज्य के लिए ब्राउज़र कमांड के लिए तीसरा तर्क पास करना होगा।

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent(props) {
    return (
        <div>
            Hello { props.name || 'World' }!
        </div>
    )
}

function App() {
    return (
        <div>
            <MyComponent name="WebdriverIO" />
            <MyComponent />
        </div>
    )
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

यदि आप `MyComponent` का उदाहरण चुनना चाहते हैं जिसमें प्रोप `name` `WebdriverIO`के रूप में है, तो आप इस तरह से कमांड निष्पादित कर सकते हैं:

```js
const myCmp = await browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

यदि आप हमारे चयन को राज्य द्वारा फ़िल्टर करना चाहते हैं, तो `browser` कमांड कुछ ऐसा दिखाई देगा:

```js
const myCmp = await browser.react$('MyComponent', {
    state: { myState: 'some value' }
})
```

#### `React.Fragment`से डील करना

प्रतिक्रिया [टुकड़े](https://reactjs.org/docs/fragments.html)का चयन करने के लिए `react$` कमांड का उपयोग करते समय, WebdriverIO घटक के नोड के रूप में उस घटक के पहले बच्चे को वापस कर देगा। यदि आप `react$$`का उपयोग करते हैं, तो आपको चयनकर्ता से मेल खाने वाले टुकड़ों के अंदर सभी HTML नोड्स वाली एक सरणी प्राप्त होगी।

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
    return (
        <React.Fragment>
            <div>
                MyComponent
            </div>
            <div>
                MyComponent
            </div>
        </React.Fragment>
    )
}

function App() {
    return (<MyComponent />)
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

उपरोक्त उदाहरण को देखते हुए, आदेश इस प्रकार काम करेंगे:

```js
await browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
await browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**नोट:** यदि आपके पास `MyComponent` के कई उदाहरण हैं और आप इन खंड घटकों का चयन करने के लिए `react$$` का उपयोग करते हैं, तो आपको सभी नोड्स की एक आयामी सरणी वापस कर दी जाएगी। दूसरे शब्दों में, यदि आपके पास 3 `<MyComponent />` उदाहरण हैं, तो आपको छह WebdriverIO तत्वों के साथ एक सरणी वापस कर दी जाएगी।

## कस्टम चयनकर्ता रणनीतियाँ

यदि आपके ऐप को तत्वों को लाने के लिए एक विशिष्ट तरीके की आवश्यकता है तो आप स्वयं को एक कस्टम चयनकर्ता रणनीति परिभाषित कर सकते हैं जिसका उपयोग आप `custom$` और `custom$$`के साथ कर सकते हैं। इसके लिए परीक्षण की शुरुआत में एक बार अपनी रणनीति दर्ज करें:

```js reference
https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/customStrategy.js#L2-L11
```

निम्नलिखित HTML स्निपेट को देखते हुए:

```html reference
https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/example.html#L8-L12
```

फिर कॉल करके इसका इस्तेमाल करें:

```js reference
https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/customStrategy.js#L16-L19
```

**नोट:** यह केवल एक वेब वातावरण में काम करता है जिसमें [`execute`](/docs/api/browser/execute) कमांड चलाया जा सकता है।
