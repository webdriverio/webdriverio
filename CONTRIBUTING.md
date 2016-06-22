# Contributing

## Code

We love pull requests. Here's a quick guide:

1. Fork the repo.

2. Run the tests. We only take pull requests with passing tests, and it's great
to know that you have a clean state.

3. Add a test for your change. Only refactoring and documentation changes require no new tests. If you are adding functionality or fixing a bug, we need a test!

4. Make the test pass.

5. Push to your fork and submit a pull request.

### How to run tests

1. Download and install the latest Selenium [standalone server](http://selenium-release.storage.googleapis.com/index.html) and run it via

  ```sh
  $ java -jar selenium-server-standalone-2.53.0.jar
  ```

  or install it with npm package [selenium-standalone](https://github.com/vvo/selenium-standalone)
  ```sh
  $ npm install -g selenium-standalone phantomjs
  $ selenium-standalone install
  $ selenium-standalone start
  ```

2. Make sure you have all the dependencies installed

  ```sh
  $ npm install
  $ cd test/site/www && bower install && cd ../../../
  ```
3. Depending on your feature/fix/patch make sure it gets covered by a test. To ensure that you can run one of the following commands:

  ```sh
  # if your patch is browser specific
  # (e.g. upload files)
  grunt test:desktop

  # if your patch is mobile specific
  # (e.g. flick or swipe tests)
  grunt test:ios test:android

  # if your patch is functional and hasn't something to do with Selenium
  # (e.g. library specific fixes like changes within EventHandler.js)
  grunt test:functional

  # changes to multibrowser functionality
  # (e.g. actually only changes to /lib/multibrowser.js)
  grunt test:functional

  # wdio test runner changes
  # (e.g. any changes that reflect the behavior of the test runner e.g. in lib/launcher.js)
  grunt test:wdio

  # anything else unittestable
  # (e.g. changes to utils and classes)
  grunt test:unit
  ```

### Syntax rules

At this point you're waiting on us. We like to at least comment on, if not accept, pull requests within three business days (and, typically, one business day). We may suggest some changes or improvements or alternatives.

Please pay attention on the following syntax rules:

* Four spaces, no tabs.
* No trailing whitespace. Blank lines should not have any space.
* Prefer &&/|| over and/or.
* a = b and not a=b.
* Follow the conventions you see used in the source already.

And in case we didn't emphasize it enough: we love tests!

------------------------------------------

## Documentation

For convenience and ease of maintenance, our project's documentation pages are generated partly from markdown files in the `docs/` directory and partly from comments in the source code.  

As with code contributions, your first step should be to fork the repo.

### Markdown Pages

Pages in the `docs/` directory follow a common markdown syntax.  In lieu of detailed definitions of this syntax, it's easiest to imitate the format in the existing pages.  Some page attributes can be defined in a YAML block at the beginning of each document, terminated with three or more dashes (i.e. a horizontal line in markdown), for example:

```
layout: guide
name: guide
title: WebdriverIO - Developer Guide
---
```

### API Methods

The source code for various API methods is located in the `lib/` folder.  To find the source of any API method listed on http://webdriver.io/api.html, you can find the corresponding `.js` file.  For example the [dragAndDrop](http://webdriver.io/api/action/dragAndDrop.html) method is defined in the `lib/commands/dragAndDrop.js` file.  The documentation for each method is generated from documentation blocks in each file.  The syntax relies on block-level comments (e.g. `/** multi-line comment */`, comment-tags for the parameters (e.g. `@param {String=} windowHandle the window to change focus to`), and code samples contained in example tags, (e.g. `<example>...</example>`).  As with the markdown pages, it's easiest to imitate the format of the existing documents.  For example:

```js
/**
 *
 * Get tag name of a DOM-element found by given selector.
 *
 * <example>
    :index.html
    <div id="elem">Lorem ipsum</div>

    :getTagName.js
    client.getTagName('#elem').then(function(tagName) {
        console.log(tagName); // outputs: "div"
    });
 * </example>
 *
 * @param   {String}           selector   element with requested tag name
 * @returns {String|String[]}             the element's tag name, as a lowercase string
 *
 * @uses protocol/elements, protocol/elementIdName
 * @type property
 *
 */
```

Here's a quick cheat-sheet:

1. **Description:** The first few lines of the comment are typically used to provide a concise description of the method.

2. **Examples:** The `<example>` block omits asterisks (`*`) -- see above example.

3. **File Names:** For examples that reference multiple files, infer the file name in the `<example>` block by prefixing its name with a colon.  See `:index.html` and `:getTagName.js` in the above example.

4. **Parameters:** Parameters should type-hint using curly braces, e.g. `{String}` or `{Number}` and may include default arguments following and equals sign, e.g. `{Number=42}`

5. **Type:** The `@type` attribute corresponds to the sections on the API page.  Currently in use are `action`, `appium`, `cookie`, `mobile`, `property`, `protocol`, `state`, `utility`, `window`.  You probably will not ever need to change this.

6. **Returns:** Identifies the data type returned and a short description.


When you have completed your updates to the documentation, push to your fork and submit a pull request.
