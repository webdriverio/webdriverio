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

There are multiple ways to setup Babel using the WDIO testrunner depending on the test framework you are using:

<!--DOCUSAURUS_CODE_TABS-->
<!--Mocha-->
```js
// wdio.conf.js
exports.config = {
    // ...
    mochaOpts: {
        ui: 'bdd',
        require: ['@babel/register', './test/helpers/common.js'],
        // ...
    },
    // ...
}
```
<!--Jasmine-->
```js
// wdio.conf.js
exports.config = {
    // ...
    jasmineNodeOpts: {
        // Jasmine default timeout
	    helpers: [require.resolve('@babel/register')],
        // ...
    },
    // ...
}
```
<!--Cucumber-->
```js
// wdio.conf.js
exports.config = {
    // ...
    cucumberOpts: {
        requireModule: ['@babel/register'],
        require: ['./test/helpers/common.js'],
        // ...
    },
    // ...
}
```
<!--END_DOCUSAURUS_CODE_TABS-->
