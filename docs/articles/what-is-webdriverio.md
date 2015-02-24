layout: empty
title: What is WebdriverIO?
tags: index
class: whatis
---

## What is WebdriverIO?

WebdriverIO lets you control a browser or a mobile application with just a few
lines of code. Your test code will look simple, concise and easy to read. Creating
automated tests is as easy as:

```js
var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };

webdriverio
    .remote(options)
    .init()
    .url('http://www.google.com')
    .title(function(err, res) {
        console.log('Title was: ' + res.value);
        // outputs: "Title was: Google"
    })
    .end();
```
