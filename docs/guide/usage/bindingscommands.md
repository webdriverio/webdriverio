name: bindingscommands
category: usage
tags: guide
index: 2
title: WebdriverIO - Bindings & Commands
---

Bindings & Commands
=====================

WebdriverIO differentiates between two different method types: protocol bindings and commands. Protocol bindings are the exact representation of the JSONWire protocol interface. They expect the same parameters as described in the [protocol docs](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol).

```js
console.log(browser.url());
 /**
  * returns:
  *
  * { state: null,
  *   sessionId: '684cb251-f0bd-4910-a43d-f3413206e652',
  *   hCode: 2611472,
  *   value: 'http://webdriver.io',
  *   class: 'org.openqa.selenium.remote.Response',
  *   status: 0 } }
  *
  */
});
```

WebdriverIO supports all JSONWire protocol bindings (including the new ones from the Webdriver spec) implemented and even a whole bunch of [Appium](http://appium.io/) specific ones for mobile testing.

All other methods like `getValue` or `dragAndDrop` using these commands to provide handy functions who simplify your tests to look more concise and expressive. So instead of doing this:

```js
var element = browser.element('#myElem');
var res = browser.elementIdCssProperty(element.value.ELEMENT, 'width');
assert(res.value === '100px');
});
```

you can simply do this:

```js
var width = browser.getCssProperty('#myElem', 'width')
assert(width.parsed.value === 100);
/**
 * console.log(width) returns:
 *
 * { property: 'width',
 *   value: '100px',
 *   parsed: { type: 'number', string: '100px', unit: 'px', value: 100 } }
 */
});
```

It not only shortens your code it also makes the return value testable. You don't have to worry about how to combine the JSONWire bindings to achieve a certain action, just use the command methods.

When you call a command WebdriverIO automatically tries to propagate the prototype to the result. This of course only works if the result prototype can be modified (e.g. for objects). This allows the developer to chain commands like this:

```js
browser.click('#elem1').click('#elem2');
```

It also enables the ability to call commands on element results. The browser instance remembers the last result of each command and can propagate it as a parameter for the next command. This way you can call commands directly on element results:

```html
<div id="elem1" onClick="document.getElementById('elem1').innerHTML = 'some new text'">some text</div>
```

```js
var element = browser.element('#elem1');
console.log(element.getText()); // outputs: "some text"
element.click();
console.log(element.getText()); // outputs: "some new text"
```

With this method you can seamlessly encapsulate your page information into a [page object](http://webdriver.io/guide/testrunner/pageobjects.html) which will allow you to write highly expressive tests like:

```js
var expect = require('chai').expect;
var FormPage = require('../pageobjects/form.page');

describe('auth form', function () {
    it('should deny access with wrong creds', function () {
        FormPage.open();
        FormPage.username.setValue('foo');
        FormPage.password.setValue('bar');
        FormPage.submit();

        expect(FormPage.flash.getText()).to.contain('Your username is invalid!');
    });
});
```

Check out the documentation page on [page objects](http://webdriver.io/guide/testrunner/pageobjects.html) or have a look on our [examples](https://github.com/webdriverio/webdriverio/tree/master/examples/pageobject)
