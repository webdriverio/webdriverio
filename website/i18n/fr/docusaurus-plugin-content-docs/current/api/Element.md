---
id: element
title: L'objet élément
---

Un objet élément est un objet représentant un élément sur l'agent utilisateur distant, par exemple un nœud [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Element) lors de l'exécution d'une session dans un navigateur ou [un élément mobile](https://developer.apple.com/documentation/swift/sequence/element) pour mobile. Il peut être reçu en utilisant l'une des nombreuses commandes de requête d'élément, par exemple [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) ou [`shadow$`](/docs/api/element/shadow$).

## Propriétés

Un objet `element` possède les propriétés suivantes :

Référence</a> de l'élément Web associé pouvant être utilisé pour interagir avec l'élément au niveau du protocole</td> </tr> 

</tbody> </table> 



## Méthodes

Un objet élément fournit toutes les méthodes de la section protocole, par exemple le protocole [WebDriver](/docs/api/webdriver) ainsi que les commandes répertoriées dans la section élément. Les commandes de protocole disponibles dépendent du type de session. Si vous exécutez une session de navigateur automatisée, aucune des commandes Appium [](/docs/api/appium) ne sera disponible et vice versa.

En plus de cela, les commandes suivantes sont disponibles :

| Nom                | Paramètres                                                            | Détails                                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Permet de définir des commandes personnalisées pouvant être appelées depuis l'objet `browser` à des fins de composition. Pour en savoir plus, consultez le guide [Commande personnalisée](/docs/customcommands).                                                                                          |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Permet d'écraser n'importe quelle commande de navigateur avec des fonctionnalités personnalisées. Utilisez-le avec précaution car cela peut perturber les utilisateurs du framework . Pour en savoir plus, consultez le guide [Commande personnalisée](/docs/customcommands#overwriting-native-commands). |




## Remarques



### Chaîne d'éléments

Lorsque vous travaillez avec des éléments, WebdriverIO fournit une syntaxe spéciale pour simplifier leur interrogation et les recherches d'éléments imbriqués complexes. Comme les objets d'élément vous permettent de trouver des éléments dans leur branche d'arborescence à l'aide de méthodes de requête courantes, les utilisateurs peuvent récupérer des éléments imbriqués comme suit :



```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```


With deep nested structures assigning any nested element to an array to then use it can be quite verbose. Therefor WebdriverIO has the concept of chained element queries that allow to fetch nested elements like this:



```js
console.log(await $('#header').$('#headline').getText())
```


This also works when fetching a set of elements, e.g.:



```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```


When working with a set of elements this can especially useful when trying to interact with them, so instead of doing:



```js
const elems = await $$('div')
const locations = await Promise.all(
    elems.map((el) => el.getLocation())
)
```


You can directly call Array methods on the element chain, e.g.:



```js
const location = await $$('div').map((el) => el.getLocation())
```


WebdriverIO uses [`p-iteration`](https://www.npmjs.com/package/p-iteration#api) under the hood so all commands from their API are also supported for these use cases.



### Custom Commands

You can set custom commands on the browser scope to abstract away workflows that are commonly used. Check out our guide on [Custom Commands](/docs/customcommands#adding-custom-commands) for more information.
