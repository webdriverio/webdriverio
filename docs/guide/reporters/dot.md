name: dot
category: reporters
tags: guide
index: 0
title: WebdriverIO - Dot Reporter
---

Dot Reporter
============

The dot reporter is the default reporter for the WDIO test runner. It's therefor a dependency of WebdriverIO and doesn't need to get downloaded. To use the dot reporter just add `'dot'` to the `reporters` array:

```js
// wdio.conf.js
module.exports = {
  // ...
  reporters: ['dot'],
  // ...
};
```

The dot reporter prints for each test spec a dot. If colors are enabled on your machine you will see three different colors for dots. Yellow dots mean that at least one browser has executed that spec. A green dot means all browser passed that spec and a red to means that at least one browser failed that spec.

![Dot Reporter](/images/dot.png "Dot Reporter")
