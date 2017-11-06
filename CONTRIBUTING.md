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
  $ java -jar selenium-server-standalone-3.4.0.jar
  ```

  or install it with npm package [selenium-standalone](https://github.com/vvo/selenium-standalone)
  ```sh
  $ npm install -g selenium-standalone phantomjs-prebuilt
  $ selenium-standalone install
  $ selenium-standalone start
  ```

2. Make sure you have all the dependencies installed

  ```sh
  $ npm install && npm run build
  $ cd test/site/www && bower install && cd ../../../
  ```
3. In order to run the tests, you must [install the latest ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/downloads),
which can also be installed via `brew install chromedriver` or
`npm -g install chromedriver`.

4. Depending on your feature/fix/patch make sure it gets covered by a test. To ensure that you can run one of the following commands:

  ```sh
  # if your patch is browser specific
  # (e.g. upload files)
  npm run test:desktop

  # if your patch is mobile specific
  # (e.g. flick or swipe tests)
  npm run test:mobile
  # or to run each individually
  npm run test:ios
  npm run test:android


  # if your patch is functional and doesn't have anything to do with Selenium
  # (e.g. library specific fixes like changes within EventHandler.js)
  npm run test:functional

  # changes to multibrowser functionality
  # (e.g. actually only changes to /lib/multibrowser.js)
  npm run test:multibrowser

  # wdio test runner changes
  # (e.g. any changes that reflect the behavior of the test runner e.g. in lib/launcher.js)
  npm run test:wdio

  # anything else unittestable
  # (e.g. changes to utils and classes)
  npm run test:unit
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
 * @return {String|String[]}             the element's tag name, as a lowercase string
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

6. **Return:** Identifies the data type returned and a short description.

7. **Throws:** Identifies common exceptions that may be thrown.


When you have completed your updates to the documentation, push to your fork and submit a pull request.


### Adding new framework, services or reporters

If you've created a plugin for WebdriverIO please add your documentation to our docs section so we can deploy this to the website. There are three different types of plugins in WebdriverIO: framework adapters, services and reporters.

If you published a new (well tested) framework adapter, please add some decent information about it to `/docs/guide/testrunner/frameworks.md`. It should explain how to write tests and what kind of options it supports (if not already documented in the actual framework).

For reporters or services please create a new markdown file in `/docs/guide/(services|reporters)` that has the name of the plugin and contains the information of the project readme. The file should be introduced with a header section that looks like this:

```
name: <plugin-name>
category: <services|reporter>
tags: guide
index: <a new index number>
title: WebdriverIO - <plugin title>
---
```

Make sure you apply a new index property to it so we can keep a sane ordering. Checkout other markdown pages for reporter or services to get a better idea of how this looks like.

Last but not least make sure you've added the plugin to our cli configurator. For that open `/lib/cli.js` and add your plugin to the dedicated list of frameworks, reporters or services. Please apply the same structure as other plugins.
