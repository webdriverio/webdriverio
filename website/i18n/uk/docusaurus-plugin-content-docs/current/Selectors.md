---
id: selectors
title: Селектори
---

[WebDriver протокол](https://w3c.github.io/webdriver/) надає кілька типів селекторів для пошуку елемента. WebdriverIO спрощує їх, щоб зробити пошук елементів простішим. Зауважте, що попри те, що команди для пошуку елементів називаються `$` та `$$`, вони не мають нічого спільного з jQuery або [Sizzle Selector Engine](https://github.com/jquery/sizzle).

Зауважте, що не всі із великої кількості типів селекторів можуть забезпечити, надійний пошук потрібного вам елемента. Наприклад, маючи таку кнопку:

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

Ми __рекомендуємо__ і __не рекомендуємо__ наступні селектори:

| Селектор                                      | Використовувати | Роз'яснення                                                     |
| --------------------------------------------- | --------------- | --------------------------------------------------------------- |
| `$('button')`                                 | 🚨 Ніколи        | Найгірше – надто загальне, без контексту.                       |
| `$('.btn.btn-large')`                         | 🚨 Ніколи        | Поганий. Зв'язаний зі стилями. Дуже схильний до змін.           |
| `$('#main')`                                  | ⚠️ Обережно     | Краще. Але все ще зв'язаний зі стилями або слухачами подій JS.  |
| `$(() => document.queryElement('button'))` | ⚠️ Обережно     | Ефективний, проте занадто складний для написання.               |
| `$('button[name="submission"]')`              | ⚠️ Обережно     | Зв'язаний із атрибутом `name`, який має семантику HTML.         |
| `$('button[data-testid="submit"]')`           | ✅ Можна         | Вимагає додаткових атрибутів, не пов'язаних із доступністю.     |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ Завжди        | Найкращий. Демонструє те, як користувач взаємодіє зі сторінкою. |

## CSS селектори

Якщо не вказано інше, WebdriverIO шукатиме елементи за допомогою [CSS селекторів](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors), наприклад:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L7-L8
```

## Текст посилання

Щоб отримати елемент посилання із певним текстом у ньому, вкажіть текст, починаючи зі знака рівності (`=`).

Наприклад:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L3
```

Ви можете знайти цей елемент, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L16-L18
```

## Частковий текст посилання

Щоб знайти елемент посилання, текст якого частково містить текст що ви шукаєте, використайте `*=` перед вашим текстом (наприклад `*=driver`).

Ви можете знайти елемент із прикладу вище, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L24-L26
```

__Примітка:__ Ви не можете поєднувати кілька типів пошуку в одному селекторі. Використовуйте кілька послідовних пошуків елементів для досягнення цієї мети, наприклад:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('*=driver')
```

## Елемент з певним текстом

Цю ж техніку можна застосувати і до елементів.

Наприклад, ось запит для заголовка рівня 1 із текстом "Welcome to my Page":

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L2
```

Ви можете знайти цей елемент, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L35-L36
```

Або використовуючи пошук за частковим збігом тексту:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L42-L43
```

Те саме працює для атрибутів `id` та `class`:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L4
```

Ви можете знайти цей елемент, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L45-L55
```

__Примітка:__ Ви не можете поєднувати кілька типів пошуку в одному селекторі. Використовуйте кілька послідовних пошуків елементів для досягнення цієї мети, наприклад:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('h1*=Welcome')
```

## Назва тегу

Щоб знайти елемент із певною назвою тегу, використовуйте `<tag>` або `<tag />`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L5
```

Ви можете знайти цей елемент, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L61-L62
```

## Атрибут name

Для запиту елементів із певним атрибутом name ви можете використовувати звичайний CSS селектор або спеціальний тип пошуку за цим атрибутом, що реалізований у [JSONWire протоколі](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol), вказавши щось на зразок `[name="some-name"]` у своєму селекторі:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L68-L69
```

__Примітка:__ Цей тип пошуку застарів та працює лише в старих браузерах, які працюють із JSONWire протоколом або з Appium.

## xPath

Отримати доступ до елемента можна також через [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath).

Селектор xPath має такий формат: `//body/div[6]/div[1]/span[1]`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/xpath.html
```

Ви можете знайти другий абзац, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L75-L76
```

Ви також можете використовувати xPath для переходу вгору та вниз DOM деревом:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L78-L79
```

## Ім'я доступності

Шукайте елементи за їхніми іменами доступності. The accessible name is what is announced by a screen reader when that element receives focus. The value of the accessible name can be both visual content or hidden text alternatives.

:::info

You can read more about this selector in our [release blog post](/blog/2022/09/05/accessibility-selector)

:::

### Fetch by `aria-label`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L1
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L86-L87
```

### Fetch by `aria-labelledby`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L2-L3
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L93-L94
```

### Fetch by content

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L4
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L100-L101
```

### Fetch by title

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L5
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L107-L108
```

### Fetch by `alt` property

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L114-L115
```

## ARIA - Role Attribute

For querying elements based on [ARIA roles](https://www.w3.org/TR/html-aria/#docconformance), you can directly specify role of the element like `[role=button]` as selector parameter:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L13
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L131-L132
```

## ID Attribute

Locator strategy "id" is not supported in WebDriver protocol, one should use either CSS or xPath selector strategies instead to find elements using ID.

However some drivers (e.g. [Appium You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) might still [support](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) this selector.

Current supported selector syntaxes for ID are:

```js
//css locator
const button = await $('#someid')
//xpath locator
const button = await $('//*[@id="someid"]')
//id strategy
// Note: works only in Appium or similar frameworks which supports locator strategy "ID"
const button = await $('id=resource-id/iosname')
```

## JS Function

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
