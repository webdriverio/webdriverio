---
id: element
title: L'objet élément
---

Un objet élément est un objet représentant un élément sur l'agent utilisateur distant, par exemple un nœud [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Element) lors de l'exécution d'une session dans un navigateur ou [un élément mobile](https://developer.apple.com/documentation/swift/sequence/element) pour mobile. Il peut être reçu en utilisant l'une des nombreuses commandes de requête d'élément, par exemple [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) ou [`shadow$`](/docs/api/element/shadow$).

## Propriétés

Un objet `element` possède les propriétés suivantes:

| Nom         | Type     | Détails                                                                                                                                                                                                                                                             |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | Id de session attribué à partir du serveur distant.                                                                                                                                                                                                                 |
| `elementId` | `String` | Référence de l'élément Web associé pouvant être utilisé pour interagir avec l'élément au niveau du protocole                                                                                                                                                    |
| `selector`  | `String` | [Sélecteur](/docs/selectors) utilisé pour interroger l'élément.                                                                                                                                                                                                     |
| `parent`    | `Object` | Soit le [L'objet Browser](/docs/api/browser) lorsque l'élément a été extrait de celui-ci (par exemple `const elem = browser.$('selector')`) ou un [Objet element](/docs/api/element) s'il a été extrait d'une portée d'élément (par exemple `elem.$( 'sélecteur')`) |
| `options`   | `Object` | Permet de définir des commandes personnalisées pouvant être appelées depuis l'objet `browser` à des fins de composition. Pour en savoir plus, consultez le guide [Commande personnalisée](/docs/customcommands).                                                    |

## Méthodes

Un objet élément fournit toutes les méthodes de la section protocole, par exemple le protocole [WebDriver](/docs/api/webdriver) ainsi que les commandes répertoriées dans la section élément. Les commandes de protocole disponibles dépendent du type de session. Si vous exécutez une session de navigateur automatisée, aucune des commandes Appium [](/docs/api/appium) ne sera disponible et vice versa.

En plus de cela, les commandes suivantes sont disponibles :

| Nom                | Paramètres                                                            | Détails                                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Permet de définir des commandes personnalisées qui peuvent être appelées à partir de l'objet navigateur à des fins de composition. Consultez notre guide sur [Commandes personnalisées](/docs/customcommands#adding-custom-commands) pour plus d'informations.                                            |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Permet d'écraser n'importe quelle commande de navigateur avec des fonctionnalités personnalisées. Utilisez-le avec précaution car cela peut perturber les utilisateurs du framework . Pour en savoir plus, consultez le guide [Commande personnalisée](/docs/customcommands#overwriting-native-commands). |

## Remarques

### Chaîne d'éléments

Lorsque vous travaillez avec des éléments, WebdriverIO fournit une syntaxe spéciale pour simplifier leur interrogation et les recherches d'éléments imbriqués complexes. Comme les objets d'élément vous permettent de trouver des éléments dans leur branche d'arborescence à l'aide de méthodes de requête courantes, les utilisateurs peuvent récupérer des éléments imbriqués comme suit:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

Avec des structures imbriquées profondes, assigner n'importe quel élément imbriqué à un tableau pour ensuite l'utiliser peut être assez verbeux. À cet effet, WebdriverIO a le concept de requêtes d'éléments chaînés qui permettent de récupérer des éléments imbriqués comme ceci:

```js
console.log(await $('#header').$('#headline').getText())
```

Cela fonctionne également lors de la récupération d'un ensemble d'éléments, par exemple :

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

Lorsque vous travaillez avec un ensemble d'éléments, cela peut être particulièrement utile lorsque vous essayez d'interagir avec eux, donc au lieu de faire :

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

WebdriverIO utilise [`p-itération`](https://www.npmjs.com/package/p-iteration#api) afin que toutes les commandes de leur API soient également prises en charge pour ces cas d'utilisation.

### Commandes personnalisées

Vous pouvez définir des commandes personnalisées sur la portée du navigateur pour abstraire les workflows qui sont couramment utilisés. Consultez notre guide sur [Commandes personnalisées](/docs/customcommands#adding-custom-commands) pour plus d'informations.
