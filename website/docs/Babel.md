---
id: babel
title: Babel Setup
---

To write tests using next-generation JavaScript features, you can use [Babel](https://babeljs.io) to compile your test files.

To do so, first install the necessary Babel dependencies:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Make sure your [`babel.config.js`](https://babeljs.io/docs/en/config-files) is configured properly.

The simplest setup you can use is:

```js title="babel.config.js"
module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: '20' // update with the target you are aiming for
            }
        }]
    ]
}
```

When using Babel in a monorepo things can get complicated if you do not follow the documentation steps, so make sure you read the [Babel documentation](https://babeljs.io/docs/config-files#monorepos) thoroughly.

To give you some guidance, here's some things to keep in mind:
- You have to create a (root `babel.config.json`)[https://babeljs.io/docs/config-files#root-babelconfigjson-file]
- After you have done so and the project is correctly configured according to the documentation, you will have to make Babel look for the config by updating your wdio config files by adding the example found below.

```js
require("@babel/register")({
  rootMode: "upward",
});
```

This will make Babel look for the closest `babel.config.json` that it can find upwards.

Once this is set up WebdriverIO will take care of the rest.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables).
