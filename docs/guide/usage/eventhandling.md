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
There are some predefined events (`error`,`init`,`end`, `command`) which cover important
WebdriverIO events.

## Example

```js
client.on('error', function(e) {
    // will be executed everytime an error occured
    // e.g. when element couldn't be found
    console.log(e.body.value.class);   // -> "org.openqa.selenium.NoSuchElementException"
    console.log(e.body.value.message); // -> "no such element ..."
})
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
