# Page Object Example

This directory demonstrates a simple setup for a wdio test suite with page objects. There is a page object for each page that gets tested + a parent page (`demo.page.js`) object that contains all important selectors and methods each page object should inherit from. As you can see the page objects are created using `Object.create` in order to enable easy inheritance between pages and their selectors.

Since WebdriverIO v4 you don't need to specify a selector when using a command that acts on a certain element on the page. That allows an interesting, intuitive and easy to read syntax. For example:

```js
MyPageObject.input.setValue('foo');
// is the same as
browser.setValue('#input', 'foo');
```

The goal behind this pattern is to abstract any page information away from the actual tests. Ideally you should store all selectors or specific instructions that are unique for a certain page in a page controller, so that you still can run your test after you've completely redesigned your page and fixed all selectors in the page object.
