name: bindingscommands
category: usage
tags: guide
index: 2
title: WebdriverIO - Bindings & Commands
---

Bindings & Commands
=====================

WebdriverIO differentiates between two different method types: protocol bindings and commands. Protocol bindings
are the exact representation of the JSONWire protocol interface. They expect the same parameters as described
in the [protocol docs](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Command_Detail) and all of these
return an error object and a result object.

```js
client.element(function(err,res) {
     console.log(res);

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

With version `2.0.0` WebdriverIO has all JSONWire protocol bindings implemented and even a whole bunch of [Appium](http://appium.io/)
specific ones for mobile testing.

All other methods like `getCssProperty` or `dragAndDrop` using these commands to provide handy functions who simplify
your tests to look more concise and expressive. So instead of doing this:

```js
client.element('#myElem', function(err, res) {
    assert(err === null);

    client.elementIdCssProperty(res.value.ELEMENT, 'width', function(err, res) {
        assert(err === null);
        assert(res.value === '100px');
    });

});
```

you can simply do this:

```js
client.getCssProperty('#myElem', 'width', function(err, width) {
    assert(err === null);
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

It not only shortens your code it also makes the return value testable. You don't have to worry about how to combine
the JSONWire bindings to achieve a certain action, just use the command methods.

These commands always return three values: an error object, a sanitized result object and all server responses of the
protocol bindings used in this command.

```js
client.getCssProperty('#myElem', 'width', function(err, width, responses) {
    console.log(responses);

    /**
     * returns:
     *
     * {
     *   elements: {
     *     state: null,
     *     sessionId: 'f8b6e580-24e4-4686-8d95-9f87ab68d158',
     *     hCode: 1719905558,
     *     value: [ { ELEMENT: '0' } ],
     *     class: 'org.openqa.selenium.remote.Response',
     *     status: 0
     *  },
     *  elementIdCssProperty: [{
     *     state: null,
     *     sessionId: 'f8b6e580-24e4-4686-8d95-9f87ab68d158',
     *     hCode: 1516567568,
     *     value: '100px',
     *     class: 'org.openqa.selenium.remote.Response',
     *     status: 0
     *   }]
     * }
     */
})
```
