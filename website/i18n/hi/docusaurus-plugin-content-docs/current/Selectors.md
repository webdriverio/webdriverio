---
id: selectors
title: Selectors
---

The [WebDriver Protocol](https://w3c.github.io/webdriver/) provides several selector strategies to query an element. WebdriverIO simplifies them to keep selecting elements simple. Please note that even though the command to query elements is called `$` and `$$`, they have nothing to do with jQuery or the [Sizzle Selector Engine](https://github.com/jquery/sizzle).

While there are so many different selectors available, only a few of them provide a resilient way to find the right element. For example, given the following button:

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

We __do__ and __do not__ recommend the following selectors:

| Selector                                      | Recommended  | Notes                                                       |
| --------------------------------------------- | ------------ | ----------------------------------------------------------- |
| `$('button')`                                 | 🚨 Never      | Worst - too generic, no context.                            |
| `$('.btn.btn-large')`                         | 🚨 Never      | Bad. Coupled to styling. Highly subject to change.          |
| `$('#main')`                                  | ⚠️ Sparingly | Better. But still coupled to styling or JS event listeners. |
| `$(() => document.queryElement('button'))` | ⚠️ Sparingly | Effective querying, complex to write.                       |
| `$('button[name="submission"]')`              | ⚠️ Sparingly | Coupled to the `name` attribute which has HTML semantics.   |
| `$('button[data-testid="submit"]')`           | ✅ Good       | Requires additional attribute, not connected to a11y.       |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ Always     | Best. Resembles how the user interacts with the page.       |

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

Given the following HTML structure:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/js.html
```

You can query the sibling element of `#elem` as follows:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L139-L143
```

## Deep Selectors

Many frontend applications heavily rely on elements with [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM). It is technically impossible to query elements within the shadow DOM without workarounds. The [`shadow$`](https://webdriver.io/docs/api/element/shadow$) and [`shadow$$`](https://webdriver.io/docs/api/element/shadow$$) have been such workarounds that had their [limitations](https://github.com/Georgegriff/query-selector-shadow-dom#how-is-this-different-to-shadow). With the deep selector you can now query all elements within any shadow DOM using the common query command.

Given we have an application with the following structure:

![Chrome Example](https://github.com/Georgegriff/query-selector-shadow-dom/raw/main/Chrome-example.png "Chrome Example")

With this selector you can query the `<button />` element that is nested within another shadow DOM, e.g.:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L147-L149
```

## Mobile Selectors

For hybrid mobile testing, it's important that the automation server is in the correct *context* before executing commands. For automating gestures, the driver ideally should be set to native context. But to select elements from the DOM, the driver will need to be set to the platform's webview context. Only *then* can the methods mentioned above can be used.

For native mobile testing, there is no switching between contexts, as you have to use mobile strategies and use the underlying device automation technology directly. This is especially useful when a test needs some fine-grained control over finding elements.

### Android UiAutomator

Android’s UI Automator framework provides a number of ways to find elements. You can use the [UI Automator API](https://developer.android.com/tools/testing-support-library/index.html#uia-apis), in particular the [UiSelector class](https://developer.android.com/reference/androidx/test/uiautomator/UiSelector) to locate elements. In Appium you send the Java code, as a string, to the server, which executes it in the application’s environment, returning the element or elements.

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")'
const button = await $(`android=${selector}`)
await button.click()
```

### Android DataMatcher and ViewMatcher (Espresso only)

Android's DataMatcher strategy provides a way to find elements by [Data Matcher](https://developer.android.com/reference/android/support/test/espresso/DataInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"]
})
await menuItem.click()
```

And similarly [View Matcher](https://developer.android.com/reference/android/support/test/espresso/ViewInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"],
  "class": "androidx.test.espresso.matcher.ViewMatchers"
})
await menuItem.click()
```

### Android View Tag (Espresso only)

The view tag strategy provides a convenient way to find elements by their [tag](https://developer.android.com/reference/android/support/test/espresso/matcher/ViewMatchers.html#withTagValue%28org.hamcrest.Matcher%3Cjava.lang.Object%3E%29).

```js
const elem = await $('-android viewtag:tag_identifier')
await elem.click()
```

### iOS UIAutomation

When automating an iOS application, Apple’s [UI Automation framework](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) can be used to find elements.

This JavaScript [API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) has methods to access to the view and everything on it.

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
const button = await $(`ios=${selector}`)
await button.click()
```

You can also use predicate searching within iOS UI Automation in Appium to refine element selection even further. See [here](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) for details.

### iOS XCUITest predicate strings and class chains

With iOS 10 and above (using the `XCUITest` driver), you can use [predicate strings](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules):

```js
const selector = `type == 'XCUIElementTypeSwitch' && name CONTAINS 'Allow'`
const switch = await $(`-ios predicate string:${selector}`)
await switch.click()
```

And [class chains](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton'
const button = await $(`-ios class chain:${selector}`)
await button.click()
```

### Accessibility ID

The `accessibility id` locator strategy is designed to read a unique identifier for a UI element. This has the benefit of not changing during localization or any other process that might change text. In addition, it can be an aid in creating cross-platform tests, if elements that are functionally the same have the same accessibility id.

- For iOS this is the `accessibility identifier` laid out by Apple [here](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html).
- For Android the `accessibility id` maps to the `content-description` for the element, as described [here](https://developer.android.com/training/accessibility/accessible-app.html).

For both platforms, getting an element (or multiple elements) by their `accessibility id` is usually the best method. It is also the preferred way over the deprecated `name` strategy.

```js
const elem = await $('~my_accessibility_identifier')
await elem.click()
```

### Class Name

The `class name` strategy is a `string` representing a UI element on the current view.

- For iOS it is the full name of a [UIAutomation class](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html), and will begin with `UIA-`, such as `UIATextField` for a text field. A full reference can be found [here](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- For Android it is the fully qualified name of a [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [class](https://developer.android.com/reference/android/widget/package-summary.html), such `android.widget.EditText` for a text field. A full reference can be found [here](https://developer.android.com/reference/android/widget/package-summary.html).
- For Youi.tv it is the full name of a Youi.tv class, and will being with `CYI-`, such as `CYIPushButtonView` for a push button element. A full reference can be found at [You.i Engine Driver's GitHub page](https://github.com/YOU-i-Labs/appium-youiengine-driver)

```js
// iOS example
await $('UIATextField').click()
// Android example
await $('android.widget.DatePicker').click()
// Youi.tv example
await $('CYIPushButtonView').click()
```

## Chain Selectors

If you want to be more specific in your query, you can chain selectors until you've found the right element. If you call `element` before your actual command, WebdriverIO starts the query from that element.

For example, if you have a DOM structure like:

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

And you want to add product B to the cart, it would be difficult to do that just by using the CSS selector.

With selector chaining, it's way easier. Simply narrow down the desired element step by step:

```js
await $('.row .entry:nth-child(2)').$('button*=Add').click()
```

### Appium Image Selector

Using the  `-image` locator strategy, it is possible to send an Appium an image file representing an element you want to access.

Supported file formats `jpg,png,gif,bmp,svg`

Full reference can be found [here](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md)

```js
const elem = await $('./file/path/of/image/test.jpg')
await elem.click()
```

**Note**: The way how Appium works with this selector is that it will internally make a (app)screenshot and use the provided image selector to verify if the element can be found in that (app)screenshot.

Be aware of the fact that Appium might resize the taken (app)screenshot to make it match the CSS-size of your (app)screen (this will happen on iPhones but also on Mac machines with a Retina display because the DPR is bigger than 1). This will result in not finding a match because the provided image selector might have been taken from the original screenshot. You can fix this by updating the Appium Server settings, see the [Appium docs](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md#related-settings) for the settings and [this comment](https://github.com/webdriverio/webdriverio/issues/6097#issuecomment-726675579) on a detailed explanation.

## React Selectors

WebdriverIO provides a way to select React components based on the component name. To do this, you have a choice of two commands: `react$` and `react$$`.

These commands allow you to select components off the [React VirtualDOM](https://reactjs.org/docs/faq-internals.html) and return either a single WebdriverIO Element or an array of elements (depending on which function is used).

**Note**: The commands `react$` and `react$$` are similar in functionality, except that `react$$` will return *all* matching instances as an array of WebdriverIO elements, and `react$` will return the first found instance.

#### Basic example

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

In the above code there is a simple `MyComponent` instance inside the application, which React is rendering inside a HTML element with `id="root"`.

With the `browser.react$` command, you can select an instance of `MyComponent`:

```js
const myCmp = await browser.react$('MyComponent')
```

Now that you have the WebdriverIO element stored in `myCmp` variable, you can execute element commands against it.

#### Filtering components

The library that WebdriverIO uses internally allows to filter your selection by props and/or state of the component. To do so, you need to pass a second argument for props and/or a third argument for state to the browser command.

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

If you want to select the instance of `MyComponent` that has a prop `name` as `WebdriverIO`, you can execute the command like so:

```js
const myCmp = await browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

If you wanted to filter our selection by state, the `browser` command would looks something like so:

```js
const myCmp = await browser.react$('MyComponent', {
    state: { myState: 'some value' }
})
```

#### Dealing with `React.Fragment`

When using the `react$` command to select React [fragments](https://reactjs.org/docs/fragments.html), WebdriverIO will return the first child of that component as the component's node. If you use `react$$`, you will receive an array containing all the HTML nodes inside the fragments that match the selector.

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

Given the above example, this is how the commands would work:

```js
await browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
await browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**Note:** If you have multiple instances of `MyComponent` and you use `react$$` to select these fragment components, you will be returned an one-dimensional array of all the nodes. In other words, if you have 3 `<MyComponent />` instances, you will be returned an array with six WebdriverIO elements.

## Custom Selector Strategies

If your app requires a specific way to fetch elements you can define yourself a custom selector strategy that you can use with `custom$` and `custom$$`. For that register your strategy once in the beginning of the test:

```js
browser.addLocatorStrategy('myCustomStrategy', (selector, root) => {
    /**
     * scope should be document if called on browser object
     * and `root` if called on an element object
     */
    const scope = root ? root : document
    return scope.querySelectorAll(selector)
})
```

Given the following HTML snippet:

```html
<div class="foobar" id="first">
    <div class="foobar" id="second">
        barfoo
    </div>
</div>
```

Then use it by calling:

```js
const elem = await browser.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "first"
const nestedElem = await elem.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "second"
```

**Note:** this only works in an web environment in which the [`execute`](/docs/api/browser/execute) command can be run.
