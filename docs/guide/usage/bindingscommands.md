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
browser.element().then(function (result) {
     console.log(result);
 
     /**
      * returns:
      *
      * { state: null,
      *   sessionId: '684cb251-f0bd-4910-a43d-f3413206e652',
      *   hCode: 2611472,
      *   value: { ELEMENT: '0' },
      *   class: 'org.openqa.selenium.remote.Response',
      *   status: 0 } }
      *
      */
});
```

Since version `2.0.0` WebdriverIO has all JSONWire protocol bindings implemented and even a whole bunch of [Appium](http://appium.io/) specific ones for mobile testing.

All other methods like `getValue` or `dragAndDrop` using these commands to provide handy functions who simplify your tests to look more concise and expressive. So instead of doing this:

```js
browser.element('#myElem').then(function (res) {
    return browser.elementIdCssProperty(res.value.ELEMENT, 'width').then(function (res) {
        assert(res.value === '100px');
    });
});
```

you can simply do this:

```js
browser.getCssProperty('#myElem', 'width').then(function (width) {
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
