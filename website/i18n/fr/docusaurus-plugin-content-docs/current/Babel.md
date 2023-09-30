---
id: babel
title: Configuration de Babel
---

Pour écrire des tests en utilisant des fonctionnalités JavaScript de nouvelle génération, vous pouvez utiliser [Babel](https://babeljs.io) pour compiler vos fichiers de test.

Pour ce faire, installez d'abord les dépendances Babel nécessaires :

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Assurez-vous que votre [`babel.config.js`](https://babeljs.io/docs/en/config-files) est configuré correctement.

La configuration la plus simple que vous pouvez utiliser est :

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

Une fois que cela est mis en place, WebdriverIO s'occupera du reste.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables).
