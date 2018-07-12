# Page Object Example

This directory demonstrates a simple setup for a wdio test suite with page objects. There is a page object for each page that gets tested + a parent page (`page.js`) object that contains all important selectors and methods each page object should inherit from. As you can see the page objects are created using `Object.create` in order to enable easy inheritance between pages and their selectors.

The goal behind this pattern is to abstract any page information away from the actual tests. Ideally you should store all selectors or specific instructions that are unique for a certain page in a page controller, so that you still can run your test after you've completely redesigned your page and fixed all selectors in the page object.

The examples works without any 3rd party dependencies for assertions. These can be added if desired to make the test even more readable. The code is written using [JavaScript classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes). In order to be able to run the code make sure you run a Node.JS version that supports it or integrate [Babel](https://babeljs.io/) as compiler.

To run the test, change into this directory:

```sh
$ cd ./examples/pageobject
```

And run the demo:

```sh
$ npm test
```
