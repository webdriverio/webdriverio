---
id: selectors
title: گزینشگر ها (selectors)
---

پروتکل [WebDriver](https://w3c.github.io/webdriver/) چندین استراتژی گزینشگر برای درخواست یک عنصر فراهم می کند. WebdriverIO آنها را برای ساده نگه داشتن انتخاب عناصر ساده می کند. لطفاً توجه داشته باشید که با وجود اینکه دستور درخواست عناصر `$` و `$$`نامیده می شوند، آنها هیچ ارتباطی با jQuery یا موتور [Sizzle Selector](https://github.com/jquery/sizzle) ندارند.

در حالی که انتخاب‌کننده‌های مختلف بسیار زیادی وجود دارد، تنها تعداد کمی از آنها راه مستحکم و انعطاف پذیری را برای یافتن عنصر مناسب ارائه می‌دهند. به عنوان مثال، دکمه زیر را در نظر بگیرید:

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

ما __انجام دهید__ و __انجام ندهید__ های زیر را برای انتخاب گزینشگر توصیه می کنیم:

| گزینشگر                                       | پیشنهاد      | یادداشت‌ها                                                  |
| --------------------------------------------- | ------------ | ----------------------------------------------------------- |
| `$('button')`                                 | 🚨 هرگز       | بدترین - بیش از حد عمومی، بدون زمینه.                       |
| `$('.btn.btn-large')`                         | 🚨 هرگز       | بد. وابسته به ظاهر. به شدت در معرض تغییر.                   |
| `$('#main')`                                  | ⚠️ با احتیاط | بهتر. اما همچنان با استایل یا شنوندگان رویداد JS همراه است. |
| `$(() => document.queryElement('button'))` | ⚠️ با احتیاط | درخواست مؤثر، اما پیچیده برای نوشتن.                        |
| `$('button[name="submission"]')`              | ⚠️ با احتیاط | همراه با ویژگی `name` که دارای معنای HTML است.              |
| `$('button[data-testid="submit"]')`           | ✅خوب         | به ویژگی اضافی نیاز دارد که به a11y متصل نیست.              |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ همیشه      | بهترین. شبیه نحوه تعامل کاربر با صفحه است.                  |

## انتخابگر درخواست CSS

اگر غیر از این مشخص نشده باشد، WebdriverIO عناصر را با استفاده از الگوی انتخابگر [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) درخواست می کند، به عنوان مثال:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L7-L8
```

## متن لینک

برای به دست آوردن یک عنصر انکر با یک متن خاص در آن، متنی را که با علامت تساوی (`=`) شروع می شود درخواست کنید.

برای مثال:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L3
```

می توانید این عنصر را با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L16-L18
```

## متن پیوند جزئی

برای یافتن یک عنصر انکر که متن قابل مشاهده آن تا حدی با مقدار جستجوی شما مطابقت دارد، با استفاده از `*=` در جلوی رشته جستجو (به عنوان مثال `*=driver`) آن را پرس و جو کنید.

شما می توانید عنصر مثال بالا را همچنین با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L24-L26
```

__نکته:__ شما نمی‌توانید چند استراتژی انتخابگر را در یک انتخابگر ترکیب کنید. برای رسیدن به یک هدف، از درخواست های چند عنصر زنجیره ای استفاده کنید، به عنوان مثال:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('*=driver')
```

## عنصر با متن خاص

همین تکنیک را می توان برای عناصر نیز به کار برد.

به عنوان مثال، در اینجا یک درخواست برای عنوان سطح 1 با متن "به صفحه من خوش آمدید" وجود دارد:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L2
```

می توانید این عنصر را با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L35-L36
```

یا با استفاده از درخواست بخشی از متن:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L42-L43
```

همین کار برای `id` و `نام کلاس` هم کار می کند:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L4
```

می توانید این عنصر را با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L45-L55
```

__نکته:__ شما نمی‌توانید چند استراتژی انتخابگر را در یک انتخابگر ترکیب کنید. برای رسیدن به یک هدف، از درخواست های چند عنصر زنجیره ای استفاده کنید، به عنوان مثال:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('h1*=Welcome')
```

## نام برچسب

برای پرس و جو از یک عنصر با نام تگ خاص، از `<tag>` یا `<tag/>`استفاده کنید.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L5
```

می توانید این عنصر را با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L61-L62
```

## ویژگی نام

برای جست‌وجوی عناصر با ویژگی نام خاص، می‌توانید از یک انتخابگر معمولی CSS3 یا استراتژی نام ارائه شده از [JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) با ارسال چیزی مانند [name="some-name"] به عنوان پارامتر انتخابگر استفاده کنید:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L68-L69
```

__نکته:__ این استراتژی انتخابگر منسوخ شده است و فقط در مرورگرهای قدیمی که توسط پروتکل JSONWireProtocol یا با استفاده از Appium اجرا می شوند کار می کند.

## xPath

امکان درخواست از عناصر از طریق یک [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath) خاص نیز وجود دارد.

انتخابگر xPath دارای قالبی مانند `//body/div[6]/div[1]/span[1]` است.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/xpath.html
```

می توانید پاراگراف دوم را با فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L75-L76
```

می‌توانید از xPath برای پیمایش درخت DOM به بالا و پایین استفاده کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L78-L79
```

## انتخابگر نام دسترسی پذیری

عناصر را با نام دسترسی پذیری آنها جستجو کنید. نام دسترسی پذیری چیزی است که توسط یک صفحه خوان هنگامی که بر آن عنصر تمرکز می‌شود، اعلام می شود. مقدار نام دسترسی پذیری می تواند محتوای بصری یا متن پنهان باشد.

:::info

شما می توانید در مورد این انتخابگر در [پست بلاگ ما](/blog/2022/09/05/accessibility-selector) بیشتر بخوانید

:::

### دریافت توسط `aria-label`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L1
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L86-L87
```

### دریافت توسط `aria-labelledby`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L2-L3
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L93-L94
```

### دریافت بر اساس محتوا

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L4
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L100-L101
```

### دریافت بر اساس عنوان

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L5
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L107-L108
```

### دریافت با ویژگی `alt`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L114-L115
```

## ویژگی Aria - Role

برای جست و جوی عناصر بر اساس [ARIA Role](https://www.w3.org/TR/html-aria/#docconformance)، می توانید مستقیماً نقش عنصر را مانند `[role=button]` به عنوان پارامتر انتخابگر مشخص کنید:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L13
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L131-L132
```

## ویژگی ID

استراتژی مکان یاب "id" در پروتکل WebDriver پشتیبانی نمی شود، به جای آن باید از استراتژی های انتخابگر CSS یا xPath برای یافتن عناصر با استفاده از ID استفاده کرد.

با این حال برخی از درایورها (مثلاً [Appium You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) ممکن است همچنان از این انتخابگر [پشتیبانی](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) کنند.

نحوهای انتخابگر پشتیبانی شده فعلی برای ID عبارتند از:

```js
//css locator
const button = await $('#someid')
//xpath locator
const button = await $('//*[@id="someid"]')
//id strategy
// Note: works only in Appium or similar frameworks which supports locator strategy "ID"
const button = await $('id=resource-id/iosname')
```

## تابع JS

You can also use JavaScript functions to fetch elements using web native APIs. Of course, you can only do this inside a web context (e.g., `browser`, or web context in mobile).

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
