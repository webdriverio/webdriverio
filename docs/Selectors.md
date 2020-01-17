---
id: selectors
title: Selectors
---

The [WebDriver Protocol](https://w3c.github.io/webdriver/) provides several selector strategies to query an element. WebdriverIO simplifies them to keep selecting elements simple. Please note that even though the command to query elements is called `$` and `$$`, they have nothing to do with jQuery or the [Sizzle Selector Engine](https://github.com/jquery/sizzle). The following selector types are supported:

## CSS Query Selector

```js
const elem = $('h2.subheading a')
elem.click()
```

## Link Text

To get an anchor element with a specific text in it, query the text starting with an equals (`=`) sign.

For example:

```html
<a href="https://webdriver.io">WebdriverIO</a>
```

You can query this element by calling:

```js
const link = $('=WebdriverIO')
console.log(link.getText()) // outputs: "WebdriverIO"
console.log(link.getAttribute('href')) // outputs: "https://webdriver.io"
```

## Partial Link Text

To find a anchor element whose visible text partially matches your search value,
query it by using `*=` in front of the query string (e.g. `*=driver`).

```html
<a href="https://webdriver.io">WebdriverIO</a>
```

You can query this element by calling:

```js
const link = $('*=driver')
console.log(link.getText()) // outputs: "WebdriverIO"
```

__Note:__ You can't mix multiple selector stratgies in one selector. Use multiple chained element queries to reach the same goal, e.g.:

```js
const elem = $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = $('header').$('*=driver')
```

## Element with certain text

The same technique can be applied to elements as well.

For example, here's a query for a level 1 heading with the text "Welcome to my Page":

```html
<h1 alt="welcome-to-my-page">Welcome to my Page</h1>
```

You can query this element by calling:

```js
const header = $('h1=Welcome to my Page')
console.log(header.getText()) // outputs: "Welcome to my Page"
console.log(header.getTagName()) // outputs: "h1"
```

Or using query partial text:

```js
const header = $('h1*=Welcome')
console.log(header.getText()) // outputs: "Welcome to my Page"
```

The same works for `id` and `class` names:

```html
<i class="someElem" id="elem">WebdriverIO is the best</i>
```

You can query this element by calling:

```js
const classNameAndText = $('.someElem=WebdriverIO is the best')
console.log(classNameAndText.getText()) // outputs: "WebdriverIO is the best"

const idAndText = $('#elem=WebdriverIO is the best')
console.log(idAndText.getText()) // outputs: "WebdriverIO is the best"

const classNameAndPartialText = $('.someElem*=WebdriverIO')
console.log(classNameAndPartialText.getText()) // outputs: "WebdriverIO is the best"

const idAndPartialText = $('#elem*=WebdriverIO')
console.log(idAndPartialText.getText()) // outputs: "WebdriverIO is the best"
```

__Note:__ You can't mix multiple selector stratgies in one selector. Use multiple chained element queries to reach the same goal, e.g.:

```js
const elem = $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = $('header').$('h1*=Welcome')
```

## Tag Name

To query an element with a specific tag name, use `<tag>` or `<tag />`.

```html
<my-element>WebdriverIO is the best</my-element>
```

You can query this element by calling:

```js
const classNameAndText = $('<my-element />')
console.log(classNameAndText.getText()) // outputs: "WebdriverIO is the best"
```

## xPath

It is also possible to query elements via a specific [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath).

An xPath selector has a format like `//body/div[6]/div[1]/span[1]`.

```html
<html>
    <body>
        <p>foobar</p>
        <p>barfoo</p>
    </body>
</html>
```

You can query the second paragraph by calling:

```js
const paragraph = $('//body/p[2]')
console.log(paragraph.getText()) // outputs: "barfoo"
```

You can use xPath to also traverse up and down the DOM tree:

```js
const parent = paragraph.$('..')
console.log(parent.getTagName()) // outputs: "body"
```
## id

Finding element by id has no specific syntax in WebDriver and one should use either CSS selectors (`#<my element ID>`) or xPath (`//*[@id="<my element ID>"]`).

However some drivers (e.g. [Appium You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) might still [support](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) this selector.

## JS Function

You can also use Javascript functions to fetch elements using web native APIs. Of course, you can only do this inside a web context (e.g., `browser`, or web context in mobile).

Given the following HTML structure:

```html
<html>
    <body>
        <p id="elem">foobar</p>
        <p>barfoo</p>
    </body>
</html>
```

You can query the sibling element of `#elem` as follows:

```js
const elem = $('#elem') // or $(() => document.getElementById('elem'))
elem.$(function () { return this.nextSibling.nextSibling }) // (first sibling is #text with value ("↵"))
```

## Mobile Selectors

For hybrid mobile testing, it's important that the automation server is in the correct *context* before executing commands. For automating gestures, the driver ideally should be set to native context. But to select elements from the DOM, the driver will need to be set to the platform's webview context. Only *then* can the methods mentioned above can be used.

For native mobile testing, there is no switching between contexts, as you have to use mobile strategies and use the underlying device automation technology directly. This is especially useful when a test needs some fine-grained control over finding elements.

### Android UiAutomator

Android’s UI Automator framework provides a number of ways to find elements. You can use the [UI Automator API](https://developer.android.com/tools/testing-support-library/index.html#uia-apis), in particular the [UiSelector class](https://developer.android.com/reference/android/support/test/uiautomator/UiSelector.html) to locate elements. In Appium you send the Java code, as a string, to the server, which executes it in the application’s environment, returning the element or elements.

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")'
const Button = $(`android=${selector}`)
Button.click()
```

### Android DataMatcher (Espresso only)

Android's DataMatcher strategy provides a way to find elements by [Data Matcher](https://developer.android.com/reference/android/support/test/espresso/DataInteraction)

```js
const menuItem = $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"]
})
menuItem.click()
```

### iOS UIAutomation

When automating an iOS application, Apple’s [UI Automation framework](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) can be used to find elements.

This JavaScript [API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) has methods to access to the view and everything on it.

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
const Button = $(`ios=${selector}`)
Button.click()
```

You can also use predicate searching within iOS UI Automation in Appium to refine element selection even further. See [here](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) for details.

### iOS XCUITest predicate strings and class chains

With iOS 10 and above (using the `XCUITest` driver), you can use [predicate strings](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules):

```js
const selector = `type == 'XCUIElementTypeSwitch' && name CONTAINS 'Allow'`
const Switch = $(`-ios predicate string:${selector}`)
Switch.click()
```

And [class chains](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton'
const Button = $(`-ios class chain:${selector}`)
Button.click()
```

### Accessibility ID

The `accessibility id` locator strategy is designed to read a unique identifier for a UI element. This has the benefit of not changing during localization or any other process that might change text. In addition, it can be an aid in creating cross-platform tests, if elements that are functionally the same have the same accessibility id.

- For iOS this is the `accessibility identifier` laid out by Apple [here](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html).
- For Android the `accessibility id` maps to the `content-description` for the element, as described [here](https://developer.android.com/training/accessibility/accessible-app.html).

For both platforms, getting an element (or multiple elements) by their `accessibility id` is usually the best method. It is also the preferred way over the deprecated `name` strategy.

```js
const elem = $('~my_accessibility_identifier')
elem.click()
```

### Class Name

The `class name` strategy is a `string` representing a UI element on the current view.

- For iOS it is the full name of a [UIAutomation class](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html), and will begin with `UIA-`, such as `UIATextField` for a text field. A full reference can be found [here](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- For Android it is the fully qualified name of a [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [class](https://developer.android.com/reference/android/widget/package-summary.html), such `android.widget.EditText` for a text field. A full reference can be found [here](https://developer.android.com/reference/android/widget/package-summary.html).
- For Youi.tv it is the full name of a Youi.tv class, and will being with `CYI-`, such as `CYIPushButtonView` for a push button element. A full reference can be found at [You.i Engine Driver's GitHub page](https://github.com/YOU-i-Labs/appium-youiengine-driver)

```js
// iOS example
$('UIATextField').click()
// Android example
$('android.widget.DatePicker').click()
// Youi.tv example
$('CYIPushButtonView').click()
```

## Chain Selectors

If you want to be more specific in your query, you can chain selectors until you've found the right
element. If you call `element` before your actual command, WebdriverIO starts the query from that element.

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
$('.row .entry:nth-child(2)').$('button*=Add').click()
```

## React Selectors

WebdriverIO provides a way to select React components based on the component name. To do this, you have a choice of two commands: `react$` and `react$$`.

These commands allow you to select components off the [React VirtualDOM](https://reactjs.org/docs/faq-internals.html) and return either a single WebdriverIO Element or an array of elements (depending on which function is used).

**Note**: The commands `react$` and `react$$` are similar in fuctionality, except that `react$$` will return *all* matching instances as an array of WebdriverIO elements, and `react$` will return the first found instance.

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
const myCmp = browser.react$('MyComponent')
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
const myCmp = browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

If you wanted to filter our selection by state, the `browser` command would looks something like so:

```js
const myCmp = browser.react$('MyComponent', {
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
browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**Note:** If you have multiple instances of `MyComponent` and you use `react$$` to select these fragment components, you will be returned an one-dimensional array of all the nodes. In other words, if you have 3 `<MyComponent />` instances, you will be returned an array with six WebdriverIO elements.

## Custom Selector Strategies

If your app requires a specific way to fetch elements you can define yourself a custom selector strategy that you can use with `custom$` and `custom$$`. For that register your strategy once in the beginning of the test:

```js
browser.addLocatorStrategy('myCustomStrategy', (selector) => {
    return document.querySelectorAll(selector)
})
```

The use it by calling:

```js
browser.url('https://webdriver.io')
const pluginWrapper = browser.custom$$('myStrat', '.pluginWrapper')
console.log(pluginWrapper.length) // 4
```

**Note:** this only works in an web environment in which the [`execute`](/docs/api/browser/execute.html) command can be run.
