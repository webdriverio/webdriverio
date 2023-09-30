---
id: babel
title: Babel-Setup
---

Um Tests mit neuartigen JavaScript-Funktionen zu schreiben, können Sie [Babel](https://babeljs.io) verwenden, um Ihre Testdateien zu kompilieren.

Installieren Sie dazu zunächst die notwendigen Babel-Abhängigkeiten:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Stellen Sie sicher, dass Ihre [`babel.config.js`](https://babeljs.io/docs/en/config-files) richtig konfiguriert ist.

Das einfachste Setup, das Sie verwenden können, ist:

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

Sobald dies eingerichtet ist, kümmert sich WebdriverIO um den Rest.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables).
