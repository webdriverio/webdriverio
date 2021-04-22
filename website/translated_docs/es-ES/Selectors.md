---
id: selectors
title: Selectors
---

El JsonWireProtocol proporciona varias estrategias de selección para consultar un elemento. WebdriverIO los simplifica para mantener la selección de elementos simple. The following selector types are supported:

## CSS Query Selector

```js
const elem = $('h2.subheading a');
elem.click();
```

## Link Text

To get an anchor element with a specific text in it, query the text starting with an equal (=) sign. For example:

```html
<a href="http://webdriver.io">WebdriverIO</a>
```

You can query this element by calling:

```js
const link = $('=WebdriverIO');
console.log(link.getText()); // outputs: "WebdriverIO"
console.log(link.getAttribute('href')); // outputs: "http://webdriver.io"
```

## Partial Link Text

To find a anchor element whose visible text partially matches your search value, query it by using `*=` in front of the query string (e.g. `*=driver`)

```html
<a href="http://webdriver.io">WebdriverIO</a>
```

You can query this element by calling:

```js
const link = $('*=driver');
console.log(link.getText()); // outputs: "WebdriverIO"
```

## Element with certain text

The same technique can be applied to elements as well, e.g. query a level 1 heading with the text "Welcome to my Page":

```html
<h1 alt="welcome-to-my-page">Welcome to my Page</h1>
```

You can query this element by calling:

```js
const header = $('h1=Welcome to my Page');
console.log(header.getText()); // outputs: "Welcome to my Page"
console.log(header.getTagName()); // outputs: "h1"
```

or using query partial text

```js
const header = $('h1*=Welcome');
console.log(header.getText()); // outputs: "Welcome to my Page"
```

The same works for ids and class names:

```html
<i class="someElem" id="elem">WebdriverIO is the best</i>
```

You can query this element by calling:

```js
const classNameAndText = $('.someElem=WebdriverIO is the best');
console.log(classNameAndText.getText()); // outputs: "WebdriverIO is the best"

const idAndText = $('#elem=WebdriverIO is the best');
console.log(idAndText.getText()); // outputs: "WebdriverIO is the best"

const classNameAndPartialText = $('.someElem*=WebdriverIO');
console.log(classNameAndPartialText.getText()); // outputs: "WebdriverIO is the best"

const idAndPartialText = $('#elem*=WebdriverIO');
console.log(idAndPartialText.getText()); // outputs: "WebdriverIO is the best"
```

## Tag Name

To query an element with a specific tag name use `<tag>` or `<tag />`

```html
<my-element>WebdriverIO is the best</my-element>
```

You can query this element by calling:

```js
const classNameAndText = $('<my-element />');
console.log(classNameAndText.getText()); // outputs: "WebdriverIO is the best"
```

## xPath

It is also possible to query elements via a specific [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath). The selector has to have a format like `//BODY/DIV[6]/DIV[1]/SPAN[1]`.

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
const paragraph = $('//BODY/P[1]');
console.log(paragraph.getText()); // outputs: "barfoo"
```

You can use xPath to also traverse up and down the DOM tree, e.g.

```js
const parent = paragraph.$('..');
console.log(parent.getTagName()); // outputs: "body"
```

## JS Function

You can also use JS functions to fetch elements using web native APIs. This of course is only supported in a web environment (e.g. browser or web context in mobile). Given the following HTML structure:

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
elem.$(() => this.nextSibling.nextSibling) // (first sibling is #text with value ("↵"))
```

## Mobile Selectors

For (hybrid/native) mobile testing you have to use mobile strategies and use the underlying device automation technology directly. This is especially useful when a test needs some fine-grained control over finding elements.

### Android UiAutomator

Android’s UI Automator framework provides a number of ways to find elements. You can use the [UI Automator API](https://developer.android.com/tools/testing-support-library/index.html#uia-apis), in particular the [UiSelector class](https://developer.android.com/reference/android/support/test/uiautomator/UiSelector.html) to locate elements. In Appium you send the Java code, as a string, to the server, which executes it in the application’s environment, returning the element or elements.

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")';
const Button = $(`android=${selector}`);
Button.click();
```

### iOS UIAutomation

When automating an iOS application, Apple’s [UI Automation framework](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) can be used to find elements. This JavaScript [API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) has methods to access to the view and everything on it.

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]';
const Button = $(`ios=${selector}`);
Button.click();
```

You can also use predicate searching within iOS UI Automation in Appium, to control element finding even further. See [here](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) for details.

### iOS XCUITest predicate strings and class chains

With iOS 10 and above (using the XCUITest driver), you can use [predicate strings](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules):

```js
const selector = 'type == \'XCUIElementTypeSwitch\' && name CONTAINS \'Allow\'';
const Switch = $(`ios=predicate=${selector}`);
Switch.click();
```

And [class chains](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton';
const Button = $(`ios=chain=${selector}`);
Button.click();
```

### Accessibility ID

The `accessibility id` locator strategy is designed to read a unique identifier for a UI element. This has the benefit of not changing during localization or any other process that might change text. In addition, it can be an aid in creating cross-platform tests, if elements that are functionally the same have the same accessibility id.

- For iOS this is the `accessibility identifier` laid out by Apple [here](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html).
- For Android the `accessibility id` maps to the `content-description` for the element, as described [here](https://developer.android.com/training/accessibility/accessible-app.html).

For both platforms getting an element, or multiple elements, by their `accessibility id` is usually the best method. It is also the preferred way, in replacement of the deprecated `name` strategy.

```js
const elem = $('~my_accessibility_identifier');
elem.click();
```

### Class Name

The `class name` strategy is a `string` representing a UI element on the current view.

- For iOS it is the full name of a [UIAutomation class](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html), and will begin with `UIA-`, such as `UIATextField` for a text field. A full reference can be found [here](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- For Android it is the fully qualified name of a [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [class](https://developer.android.com/reference/android/widget/package-summary.html), such `android.widget.EditText` for a text field. A full reference can be found [here](https://developer.android.com/reference/android/widget/package-summary.html).

```js
// iOS example
$('UIATextField').click();
// Android example
$('android.widget.DatePicker').click();
```

## Chain Selectors

If you want to be more specific in your query, you can chain your selector until you've found the right element. If you call element before your actual command, WebdriverIO starts query from that element. For example if you have a DOM structure like:

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

And you want to add product B to the cart it would be difficult to do that just by using the CSS selector. With selector chaining it gets way easier as you can narrow down the desired element step by step:

```js
$('.row .entry:nth-child(1)').$('button*=Add').click();
```