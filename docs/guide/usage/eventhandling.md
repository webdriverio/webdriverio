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
browser.on('error', function(e) {
    // will be executed everytime an error occurred
    // e.g. when element couldn't be found
    console.log(e.body.value.class);   // -> "org.openqa.selenium.NoSuchElementException"
    console.log(e.body.value.message); // -> "no such element ..."
})
```

Use the `log()` event to log arbitrary data, which can then be logged or displayed by a reporter:

```js
browser
    .init()
    .emit('log', 'Before my method')
    .click('h2.subheading a')
    .emit('log', 'After my method', {more: 'data'})
    .end();
```

All commands are chainable, so you can use them while chaining your commands

```js
var cnt;

browser
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

Note that you can't execute any WebdriverIO commands or any other async operation within the listener function. Event handling comes handy when you want to log certain information but is not considered to be used to do action on certain events like taking a screenshot if an error happens. For use the `onError` hook in your wdio test runner configuration file.
