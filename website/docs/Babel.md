---
id: babel
title: Babel Setup
---

To write tests using next-generation JavaScript features, you can use [Babel](https://babeljs.io) to compile your test files.

To do so, first install the necessary Babel dependencies:

```
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Make sure your [`babel.config.js`](https://babeljs.io/docs/en/config-files) is configured properly.

The simplest setup you can use is:

```js
module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 12
            }
        }]
    ]
}
```

Once this is set up WebdriverIO will take care of the rest.
