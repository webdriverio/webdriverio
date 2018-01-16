name: dot
category: reporters
tags: guide
index: 0
title: WebdriverIO - Dot Reporter
---

Dot Reporter
============

The dot reporter is the default reporter for the WDIO test runner. It's therefore a dependency of WebdriverIO and doesn't need to get downloaded. To use the dot reporter just add `'dot'` to the `reporters` array:

```js
// wdio.conf.js
module.exports = {
  // ...
  reporters: ['dot'],
  // ...
};
```

The dot reporter prints a dot for each test spec. If colors are enabled on your machine, you will see three different colors for dots. A yellow dot means that at least one browser has executed that spec. A green dot means that all browsers have passed that spec. A red dot means that at least one browser has failed that spec.

![Dot Reporter](/images/dot.png "Dot Reporter")
