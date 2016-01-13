name: eventhandling
category: usage
tags: guide
index: 6
title: WebdriverIO - Eventhandling
---

Eventhandling
=============

The following functions are supported: `on`,`once`,`emit`,`removeListener`,`removeAllListeners`.
They behave exactly as described in the official NodeJS [docs](http://nodejs.org/api/events.html).
There are some predefined events (`error`,`init`,`end`, `command`, `log`) which cover important
WebdriverIO events.

## Examples

```js
client.on('error', function(e) {
    // will be executed everytime an error occured
    // e.g. when element couldn't be found
    console.log(e.body.value.class);   // -> "org.openqa.selenium.NoSuchElementException"
    console.log(e.body.value.message); // -> "no such element ..."
})
```

Use the `log()` event to log arbitrary data, which can then be logged or displayed by a reporter:
```js
client
    .init()
    .emit('log', 'Before my method')
    .click('h2.subheading a')
    .emit('log', 'After my method', {more: 'data'})
    .end();
```

All commands are chainable, so you can use them while chaining your commands

```js
var cnt;
&nbsp;
client
    .init()
    .once('countme', function(e) {
        console.log(e.elements.length, 'elements were found');
    })
    .elements('.myElem').then(function(res) {
        cnt = res.value;
    })
    .emit('countme', cnt)
    .end();
```
