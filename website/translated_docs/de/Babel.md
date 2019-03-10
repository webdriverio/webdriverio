---
id: babel
title: Babel Setup
---
To write tests using next generation JavaScript features you can add [Babel](https://babeljs.io/) as compiler for your test files. For that first, install the necessary Babel dependencies:

    npm install --save-dev @babel/cli @babel/preset-env @babel/register
    

Make sure your [`babel.config.js`](https://babeljs.io/docs/en/config-files) is configured properly. The simplest setup you can use is:

```js
module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 8
            }
        }]
    ]
}
```

There are multiple ways to setup Babel using the wdio testrunner. If you are running Cucumber or Jasmine tests, you just need to register Babel in the before hook of your config file

```js
before: function() {
    require('@babel/register');
},
```

If you run Mocha tests, you can use Mocha's internal compiler to register Babel, e.g.:

```js
mochaOpts: {
    ui: 'bdd',
    compilers: ['js:@babel/register'],
    require: ['./test/helpers/common.js']
},
```