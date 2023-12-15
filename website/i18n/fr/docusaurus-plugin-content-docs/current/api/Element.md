---
id: element
title: L'objet élément
---

An Element Object is an object representing an element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. Il peut être reçu en utilisant l'une des nombreuses commandes de requête d'élément, par exemple [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) ou [`shadow$`](/docs/api/element/shadow$).

## Propriétés

Un objet `element` possède les propriétés suivantes :

| Nom         | Type     | Détails                                                                                                                                                                                                                                                             |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | Id de session attribué à partir du serveur distant.                                                                                                                                                                                                                 |
| `elementId` | `String` | Référence</a> de l'élément Web associé pouvant être utilisé pour interagir avec l'élément au niveau du protocole                                                                                                                                                    |
| `selector`  | `String` | [Sélecteur](/docs/selectors) utilisé pour interroger l'élément.                                                                                                                                                                                                     |
| `parent`    | `Object` | Soit le [L'objet Browser](/docs/api/browser) lorsque l'élément a été extrait de celui-ci (par exemple `const elem = browser.$('selector')`) ou un [Objet element](/docs/api/element) s'il a été extrait d'une portée d'élément (par exemple `elem.$( 'sélecteur')`) |
| `options`   | `Object` | Permet de définir des commandes personnalisées pouvant être appelées depuis l'objet `browser` à des fins de composition. Pour en savoir plus, consultez le guide [Commande personnalisée](/docs/customcommands).                                                    |

## Méthodes
An element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. Les commandes de protocole disponibles dépendent du type de session. Si vous exécutez une session de navigateur automatisée, aucune des commandes Appium [](/docs/api/appium) ne sera disponible et vice versa.

En plus de cela, les commandes suivantes sont disponibles :

| Nom                | Paramètres                                                            | Détails                                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Permet de définir des commandes personnalisées qui peuvent être appelées à partir de l'objet navigateur à des fins de composition. Consultez notre guide sur [Commandes personnalisées](/docs/customcommands#adding-custom-commands) pour plus d'informations.                                            |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Permet d'écraser n'importe quelle commande de navigateur avec des fonctionnalités personnalisées. Utilisez-le avec précaution car cela peut perturber les utilisateurs du framework . Pour en savoir plus, consultez le guide [Commande personnalisée](/docs/customcommands#overwriting-native-commands). |

## Remarques

### Chaîne d'éléments

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element lookups. Comme les objets d'élément vous permettent de trouver des éléments dans leur branche d'arborescence à l'aide de méthodes de requête courantes, les utilisateurs peuvent récupérer des éléments imbriqués comme suit :

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

Avec des structures imbriquées profondes, assigner n'importe quel élément imbriqué à un tableau pour ensuite l'utiliser peut être assez verbeux. Therefore WebdriverIO has the concept of chained element queries that allow fetching nested elements like this:

```js
console.log(await $('#header').$('#headline').getText())
```

Cela fonctionne également lors de la récupération d'un ensemble d'éléments, par exemple :

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

When working with a set of elements this can be especially useful when trying to interact with them, so instead of doing:

```js
const elems = await $$('div')
const locations = await Promise.all(
    elems.map((el) => el.getLocation())
)
```

Vous pouvez appeler directement les méthodes Array sur la chaîne d'éléments, par exemple :

```js
const location = await $$('div').map((el) => el.getLocation())
```

same as:

```js
const divs = await $$('div')
const location = await divs.map((el) => el.getLocation())
```

WebdriverIO uses a custom implementation that supports asynchronous iterators under the hood so all commands from their API are also supported for these use cases.

__Note:__ all async iterators return a promise even if your callback doesn't return one, e.g.:

```ts
const divs = await $$('div')
console.log(divs.map((div) => div.selector)) // ❌ returns "Promise<string>[]"
console.log(await divs.map((div) => div.selector)) // ✅ returns "string[]"
```

### Commandes personnalisées

Vous pouvez définir des commandes personnalisées sur la portée du navigateur pour abstraire les workflows qui sont couramment utilisés. Consultez notre guide sur [Commandes personnalisées](/docs/customcommands#adding-custom-commands) pour plus d'informations.
