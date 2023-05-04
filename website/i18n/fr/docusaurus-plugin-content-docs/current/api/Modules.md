---
id: modules
title: Modules
---

WebdriverIO publie divers modules sur NPM et d'autres registres que vous pouvez utiliser pour créer votre propre framework d'automatisation. Voir plus de documentation sur les types de configuration WebdriverIO [ici](/docs/setuptypes).

## `webdriver` et `devtools`

Les packages de protocole ([`webdriver`](https://www.npmjs.com/package/webdriver) et [`devtools`](https://www.npmjs.com/package/devtools)) exposent une classe avec les fonctions statiques suivantes attachées qui vous permettent de lancer des sessions :

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

Démarre une nouvelle session avec des fonctionnalités spécifiques. Sur la base de la session, des commandes de réponse provenant de différents protocoles seront fournies.

##### Paramètres

- `options`: [Options WebDriver](/docs/configuration#webdriver-options)
- `modifier`: fonction qui permet de modifier l'instance client avant qu'elle ne soit renvoyée
- `userPrototype`: objet de propriétés qui permet d'étendre le prototype d'instance
- `customCommandWrapper`: fonction qui permet d'envelopper la fonctionnalité autour des appels de fonction

##### Retours

- [Browser](/docs/api/browser) objet

##### Exemple

```js
const client = await WebDriver.newSession({
    capabilities: { browserName: 'chrome' }
})
```

#### `attachSession(attachInstance, modifier, userPrototype, customCommandWrapper)`

Attache à une session WebDriver ou DevTools en cours d'exécution.

##### Paramètres

- `attachInstance`: instance pour attacher une session à au moins un objet avec une propriété `sessionId` (par exemple `{ sessionId: 'xxx' }`)
- `modifier`: fonction qui permet de modifier l'instance client avant qu'elle ne soit renvoyée
- `userPrototype`: objet de propriétés qui permet d'étendre le prototype d'instance
- `customCommandWrapper`: fonction qui permet d'envelopper la fonctionnalité autour des appels de fonction

##### Retours

- [Browser](/docs/api/browser) object

##### Exemple

```js
const client = await WebDriver.newSession({...})
const clonedClient = await WebDriver.attachSession(client)
```

#### `reloadSession(instance)`

Recharge une session en fonction de l'instance fournie.

##### Paramètres

- `instance`: instance de package à recharger

##### Exemple

```js
const client = await WebDriver.newSession({...})
await WebDriver.reloadSession(client)
```

## `webdriverio`

Comme pour les packages de protocole (`webdriver` et `devtools`), vous pouvez également utiliser les API du package WebdriverIO pour gérer les sessions. Les API peuvent être importées à l'aide de `import { remote, attach, multiremote } depuis 'webdriverio` et contiennent les fonctionnalités suivantes :

#### `remote(options, modifier)`

Démarre une session WebdriverIO. L'instance contient toutes les commandes en tant que package de protocole mais avec des fonctions supplémentaires d'ordre supérieur, voir [docs API](/docs/api).

##### Paramètres

- `options`: [Options WebDriver](/docs/configuration#webdriverio)
- `modifier`: fonction qui permet de modifier l'instance client avant qu'elle ne soit renvoyée

##### Retours

- [Browser](/docs/api/browser) objet

##### Exemple

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})
```

#### `attach(attachOptions)`

Attache à une session WebDriver ou DevTools en cours d'exécution.

##### Paramètres

- `attachInstance`: instance pour attacher une session à au moins un objet avec une propriété `sessionId` (par exemple `{ sessionId: 'xxx' }`)

##### Retours

- [Browser](/docs/api/browser) objet

##### Exemple

```js
import { remote, attach } from 'webdriverio'

const browser = await remote({...})
const newBrowser = await attach(browser)
```

#### `multiremote(multiremoteOptions)`

Initie une instance multidistant qui vous permet de contrôler plusieurs sessions au sein d'une seule instance. Consultez nos [exemples multiremote](https://github.com/webdriverio/webdriverio/tree/main/examples/multiremote) pour des cas d'utilisation concrets.

##### Paramètres

- `multiremoteOptions`: un objet avec des clés représentant le nom du navigateur et ses [options WebdriverIO](/docs/configuration#webdriverio).

##### Retours

- [Browser](/docs/api/browser) objet

##### Exemple

```js
import { multiremote } from 'webdriverio'

const matrix = await multiremote({
    myChromeBrowser: {
        capabilities: { browserName: 'chrome' }
    },
    myFirefoxBrowser: {
        capabilities: { browserName: 'firefox' }
    }
})
await matrix.url('http://json.org')
await matrix.getInstance('browserA').url('https://google.com')

console.log(await matrix.getTitle())
// returns ['Google', 'JSON']
```

## `@wdio/cli`

Au lieu d'appeler la commande `wdio` , vous pouvez également inclure le lanceur de test en tant que module et l'exécuter dans un environnement arbitraire. Pour cela, vous aurez besoin du package `@wdio/cli` comme module, comme ceci :

<Tabs
  defaultValue="esm"
  values={[
    {label: 'EcmaScript Modules', value: 'esm'},
 {label: 'CommonJS', value: 'cjs'}
 ]
}>
<TabItem value="esm">

```js
import Launcher from '@wdio/cli'
```

</TabItem>
<TabItem value="cjs">

```js
const Launcher = require('@wdio/cli').default
```

</TabItem>
</Tabs>

Après cela, créez une instance du lanceur et exécutez le test.

#### `Launcher(configPath, opts)`

Le constructeur de la classe `Launcher` attend l'URL du fichier de configuration et un objet `opts` avec des paramètres qui écraseront ceux du fichier config.

##### Paramètres

- `configPath`: chemin vers le `wdio.conf.js` à exécuter
- `opte` : arguments ([`<RunCommandArguments>`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/types.ts#L51-L77)) pour écraser les valeurs du fichier de configuration

##### Exemple

```js
const wdio = new Launcher(
    '/path/to/my/wdio.conf.js',
    { spec: '/path/to/a/single/spec.e2e.js' }
)

wdio.run().then((exitCode) => {
    process.exit(exitCode)
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace)
    process.exit(1)
})
```

La commande `run` renvoie une promesse [](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). Il est résolu si les tests ont réussi ou échoué, et il est rejeté si le lanceur n'a pas pu démarrer l'exécution des tests.

## `@wdio/browser-runner`

Lors de l'exécution de tests unitaires ou de composants à l'aide du navigateur [de WebdriverIO](/docs/runner#browser-runner) vous pouvez importer des utilitaires factices pour vos tests, par exemple :

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

Les exports nommés suivants sont disponibles :

#### `fn`

Fonction simulée, voir plus dans les docs officiels [Vitest](https://vitest.dev/api/mock.html#mock-functions).

#### `spyOn`

Fonction espion, voir plus dans les docs officiels [Vitest](https://vitest.dev/api/mock.html#mock-functions).

#### `mock`

Méthode pour simuler un fichier ou un module de dépendance.

##### Paramètres

- `moduleName`: soit un chemin relatif vers le fichier à simuler soit un nom de module.
- `factory`: fonction pour retourner la valeur simulée (facultatif)

##### Exemple

```js
mock('../src/constants.ts', () => ({
    SOME_DEFAULT: 'mocked out'
}))

mock('lodash', (origModuleFactory) => {
    const origModule = await origModuleFactory()
    return {
        ...origModule,
        pick: fn()
    }
})
```

#### `unmock`

Démoquez la dépendance définie dans le répertoire manual mock (`__mocks__`).

##### Paramètres

- `moduleName`: nom du module à démoquer.

##### Exemple

```js
unmock('lodash')
```
