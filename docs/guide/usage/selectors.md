name: selectors
category: usage
tags: guide
index: 0
title: WebdriverIO - Selectors
---

Selectors
=========

The JsonWireProtocol provides several strategies to query an element. WebdriverIO simplifies these to make it more familiar with the common existing selector libraries like [Sizzle](http://sizzlejs.com/). The following selector types are supported:

## CSS Query Selector

```js
browser.click('h2.subheading a');
```

## Link Text

To get an anchor element with a specific text in it, query the text starting with an equal (=) sign.
For example:

```html
<a href="http://webdriver.io">WebdriverIO</a>
```

```js
console.log(browser.getText('=WebdriverIO')); // outputs: "WebdriverIO"
console.log(browser.getAttribute('=WebdriverIO', 'href')); // outputs: "http://webdriver.io"
```

## Partial Link Text

To find a anchor element whose visible text partially matches your search value, query it by using `*=`
in front of the query string (e.g. `*=driver`)

```html
<a href="http://webdriver.io">WebdriverIO</a>
```

```js
console.log(browser.getText('*=driver')); // outputs: "WebdriverIO"
```

## Element with certain text

The same technique can be applied to elements as well, e.g. query a level 1 heading with the text "Welcome to my Page":

```html
<h1 alt="welcome-to-my-page">Welcome to my Page</h1>
```

```js
console.log(browser.getText('h1=Welcome to my Page')); // outputs: "Welcome to my Page"
console.log(browser.getTagName('h1=Welcome to my Page')); // outputs: "h1"
```

or using query partial text

```js
console.log(browser.getText('h1*=Welcome')); // outputs: "Welcome to my Page"
console.log(browser.getText('h1[alt*="welcome"]')); // outputs: "Welcome to my Page"
```

The same works for ids and class names:

```html
<i class="someElem" id="elem">WebdriverIO is the best</i>
```
```js
console.log(browser.getText('.someElem=WebdriverIO is the best')); // outputs: "WebdriverIO is the best"
console.log(browser.getText('#elem=WebdriverIO is the best')); // outputs: "WebdriverIO is the best"
console.log(browser.getText('.someElem*=WebdriverIO')); // outputs: "WebdriverIO is the best"
console.log(browser.getText('#elem*=WebdriverIO')); // outputs: "WebdriverIO is the best"
```

## Tag Name

To query an element with a specific tag name use `<tag>` or `<tag />`

## Name Attribute

For querying elements with a specific name attribute you can either use a normal CSS3 selector or the
provided name strategy from the JsonWireProtocol by passing something like `[name="some-name"]` as
selector parameter

## xPath

It is also possible to query elements via a specific xPath. The selector has to have a format like
for example `//BODY/DIV[6]/DIV[1]/SPAN[1]`

In near future WebdriverIO will cover more selector features like form selector (e.g. `:password`,`:file` etc)
or positional selectors like `:first` or `:nth`.

## Mobile Selectors

For (hybrid/native) mobile testing you have to use mobile strategies and use the underlying device automation technology directly. This is especially useful when a test needs some fine-grained control over finding elements.

### Android UiAutomator

Android’s UI Automator framework provides a number of ways to find elements. You can use the [UI Automator API](https://developer.android.com/tools/testing-support-library/index.html#uia-apis), in particular the [UiSelector class](https://developer.android.com/reference/android/support/test/uiautomator/UiSelector.html) to locate elements. In Appium you send the Java code, as a string, to the server, which executes it in the application’s environment, returning the element or elements.

```js
var selector = 'new UiSelector().text("Cancel").className("android.widget.Button")';
browser.click('android=' + selector);
```

### iOS UIAutomation

When automating an iOS application, Apple’s [UI Automation framework](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) can be used to find elements. This JavaScript [API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) has methods to access to the view and everything on it.

```js
var selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
browser.click('ios=' + selector);
```

You can also use predicate searching within iOS UI Automation in Appium, to control element finding even further. See [here](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios_predicate.md) for details.

### iOS XCUITest predicate strings and class chains

With iOS 10 and above (using the XCUITest driver), you can use [predicate strings](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules):

```js
var selector = 'type == \'XCUIElementTypeSwitch\' && name CONTAINS \'Allow\'';
browser.click('ios=predicate=' + selector);
```

And [class chains](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
var selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton';
browser.click('ios=chain=' + selector);
```

### Accessibility ID

The `accessibility id` locator strategy is designed to read a unique identifier for a UI element. This has the benefit of not changing during localization or any other process that might change text. In addition, it can be an aid in creating cross-platform tests, if elements that are functionally the same have the same accessibility id.

- For iOS this is the `accessibility identifier` laid out by Apple [here](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html).
- For Android the `accessibility id` maps to the `content-description` for the element, as described [here](https://developer.android.com/training/accessibility/accessible-app.html).

For both platforms getting an element, or multiple elements, by their `accessibility id` is usually the best method. It is also the preferred way, in replacement of the deprecated `name` strategy.

```js
browser.click(`~my_accessibility_identifier`);
```

### Class Name

The `class name` strategy is a `string` representing a UI element on the current view.

- For iOS it is the full name of a [UIAutomation class](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html), and will begin with `UIA-`, such as `UIATextField` for a text field. A full reference can be found [here](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- For Android it is the fully qualified name of a [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [class](https://developer.android.com/reference/android/widget/package-summary.html), such `android.widget.EditText` for a text field. A full reference can be found [here](https://developer.android.com/reference/android/widget/package-summary.html).

```js
// iOS example
browser.click(`UIATextField`);
// Android example
browser.click(`android.widget.DatePicker`);
```

## Chain Selectors

If you want to be more specific in your query, you can chain your selector until you've found the right
element. If you call element before your actual command, WebdriverIO starts query from that element. For example
if you have a DOM structure like:

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

And you want to add product B to the cart it would be difficult to do that just by using the CSS selector.
With selector chaining it gets way easier as you can narrow down the desired element step by step:

```js
browser.element('.row .entry:nth-child(1)').click('button*=Add');
```
