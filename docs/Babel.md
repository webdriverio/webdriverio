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

There are multiple ways to setup Babel using the WDIO testrunner. 

If you are running Jasmine tests, you just need to register Babel in the `before` hook of your config file:

```js
before: function() {
    require('@babel/register')
},
```

If you run Mocha or Cucumber tests, you can use internal `require` to register Babel:

```js
mochaOpts: {
    ui: 'bdd',
    require: ['@babel/register', './test/helpers/common.js']
},
```

```js
cucumberOpts: {
    requireModule: ['@babel/register'],
    require: ['./test/helpers/common.js']
},
```
