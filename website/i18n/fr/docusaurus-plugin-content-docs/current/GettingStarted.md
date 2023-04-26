---
id: gettingstarted
title: Premiers pas
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CreateProjectAnimation from '@site/src/pages/components/CreateProjectAnimation.js';

Bienvenue sur la documentation de WebdriverIO. Cela vous aidera à démarrer rapidement. Si vous rencontrez des problèmes, vous pouvez trouver de l'aide et des réponses sur notre [Discord Support Server](https://discord.webdriver.io) ou vous pouvez me contacter sur [Twitter](https://twitter.com/webdriverio).

:::info
Ce sont les documents de la dernière version (__>=8.x__) de WebdriverIO. Si vous utilisez toujours une version plus ancienne, veuillez visiter les [anciens sites de documentation](/versions)!
:::

## Lancer une installation WebdriverIO

Pour ajouter une configuration WebdriverIO complète à un projet existant ou nouveau à l'aide de [WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio), exécutez :

Si vous êtes dans le répertoire racine d'un projet existant, exécutez :

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio .
```

or if you want to create a new project:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```sh
yarn create wdio .

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio .
```sh
pnpm create wdio .

</TabItem>
</Tabs>

Cette commande unique télécharge l'outil CLI WebdriverIO et exécute un assistant de configuration qui vous aide à configurer votre suite de tests.

<CreateProjectAnimation />

L'assistant vous demandera une série de questions qui vous guideront à travers l'installation. You can pass a `--yes` parameter to pick a default set up which will use Mocha with Chrome using the \[Page Object\](https://martinfowler.com/bliki/PageObject.html) pattern.

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio . --yes
```

</TabItem>
</Tabs>

## Lancer un test

Vous pouvez démarrer votre suite de tests en utilisant la commande `run` et en pointant vers la configuration WebdriverIO que vous venez de créer :

```sh
npx wdio run ./wdio.conf.js
```

Si vous souhaitez exécuter des fichiers de test spécifiques, vous pouvez ajouter un paramètre `--spec`:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

ou définissez des suites dans votre fichier de configuration et exécutez uniquement les fichiers de test définis par dans une suite :

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## Exécuter dans un script

Si vous souhaitez utiliser WebdriverIO comme moteur d'automatisation en [mode autonome](/docs/setuptypes#standalone-mode) dans un script Node.JS, vous pouvez également installer directement WebdriverIO et l'utiliser en tant que package, par exemple pour générer une capture d'écran d'un site Web :

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__Remarque :__ toutes les commandes WebdriverIO sont asynchrones et doivent être correctement gérées à l'aide de [`async/wait`](https://javascript.info/async-await).

## Enregistrer les tests

WebdriverIO fournit des outils pour vous aider à démarrer en enregistrant vos actions de test à l'écran et en générant automatiquement des scripts de test WebdriverIO. Voir [Tests de l'enregistreur avec Chrome DevTools Recorder](/docs/record) pour plus d'informations.

## Configuration système requise

Vous aurez besoin de [Node.js](http://nodejs.org) installé.

- Installez au moins la version v16.x ou supérieur car il s'agit de la plus ancienne version LTS active
- Seules les versions qui sont ou deviendront une version LTS sont officiellement prises en charge

Si Node n'est pas installé sur votre système, nous suggérons d'utiliser un outil tel que [NVM](https://github.com/creationix/nvm) ou [Volta](https://volta.sh/) pour vous aider à gérer plusieurs versions de Node.js. NVM est un choix populaire, tandis que Volta est également une bonne alternative.
