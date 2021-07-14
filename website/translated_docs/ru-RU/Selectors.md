---
id: selectors
title: Селекторы
---

JsonWireProtocol предлагает несколько стратегий селектора для получения элемента. WebdriverIO упрощает их, чтобы упростить подбор элементов. Поддерживаются следующие типы селекторов:

## По CSS селектору

```js
const elem = $('h2.subheading a');
elem.click();
```

## По тексту ссылки

Для получения элемента ссылки со определенным текстом в нем, запрос должен начинаться с символа равенства (=) и последующим искомым текстом. Например:

```html
<a href="http://webdriver.io">WebdriverIO</a>
```

Этот элемент можно получить выполнив запрос:

```js
const link = $('=WebdriverIO');
console.log(link.getText()); // возвращает: "WebdriverIO"
console.log(link.getAttribute('href')); // возвращает: "http://webdriver.io"
```

## По частичному тексту ссылки

Чтобы найти элемент ссылки, чей видимый текст частино соответствует вашему запросу, выполняйте запрос добавив значение `*=` перед вашей строкой запроса (пример `*=driver`)

```html
<a href="http://webdriver.io">WebdriverIO</a>
```

Этот элемент можно получить выполнив запрос:

```js
const link = $('*=driver');
console.log(link.getText()); // возвращает: "WebdriverIO"
```

## Поиск элемента с определенным текстом

Та же техника может быть использована и для других элементов, например получение заглавия первого уровня с текстом "Welcome to my Page":

```html
<h1 alt="welcome-to-my-page">Welcome to my Page</h1>
```

Этот элемент можно получить выполнив запрос:

```js
const header = $('h1=Welcome to my Page');
console.log(header.getText()); // возвращает: "Welcome to my Page"
console.log(header.getTagName()); // возвращает: "h1"
```

или с помощью частичного текста

```js
const header = $('h1*=Welcome');
console.log(header.getText()); // возвращает: "Welcome to my Page"
```

То же работает для id и имен классов:

```html
<i class="someElem" id="elem">WebdriverIO is the best</i>
```

Этот элемент можно получить выполнив запрос:

```js
const classNameAndText = $('.someElem=WebdriverIO is the best');
console.log(classNameAndText.getText()); // возвращает: "WebdriverIO is the best"

const idAndText = $('#elem=WebdriverIO is the best');
console.log(idAndText.getText()); // возвращает: "WebdriverIO is the best"

const classNameAndPartialText = $('.someElem*=WebdriverIO');
console.log(classNameAndPartialText.getText()); // возвращает: "WebdriverIO is the best"

const idAndPartialText = $('#elem*=WebdriverIO');
console.log(idAndPartialText.getText()); // возвращает: "WebdriverIO is the best"
```

## По имени тэга

Для получения элемента со специфическим именем тэга используйте `<tag>` или `<tag />`

```html
<my-element>WebdriverIO is the best</my-element>
```

Этот элемент можно получить выполнив запрос:

```js
const classNameAndText = $('<my-element />');
console.log(classNameAndText.getText()); // возвращает: "WebdriverIO is the best"
```

## По xPath

Так же можно получить элемент используя спецификацию [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath). Селектор должен иметь формат `//BODY/DIV[6]/DIV[1]/SPAN[1]`.

```html
<html>
    <body>
        <p>foobar</p>
        <p>barfoo</p>
    </body>
</html>
```

Вы можете получить второй параграф таким образом:

```js
const paragraph = $('//BODY/P[1]');
console.log(paragraph.getText()); // возвращает: "barfoo"
```

Можно использовать xPath так же для прохода вверх и вниз по DOM tree. Пример:

```js
const parent = paragraph.$('..');
console.log(parent.getTagName()); // возвращает: "body"
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