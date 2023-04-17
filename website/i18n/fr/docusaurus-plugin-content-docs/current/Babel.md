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
                node: '14'
            }
        }]
    ]
}
```

Une fois que cela est mis en place, WebdriverIO s'occupera du reste.

Vous pouvez également configurer comment @babel/register est exécuté à travers les variables d'environnement pour [@babel/register](Babel.md) ou en utilisant la section [autoCompileOpts de wdio](ConfigurationFile.md).
