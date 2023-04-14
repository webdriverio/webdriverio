---
id: element
title: Das Element-Objekt
---

Ein Elementobjekt ist ein Objekt, das ein Element auf dem Remote-User-Agent, z.B. eine [DOM-Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) darstellt, wenn im Browser ausgeführt oder [eines mobiles Element](https://developer.apple.com/documentation/swift/sequence/element) wenn die Session ein mobiles Endgerät steuert. Es kann über einen der vielen Elementabfragebefehle empfangen werden, z. [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) oder [`shadow$`](/docs/api/element/shadow$).

## Eigenschaften

Ein Element-Objekt hat folgende Eigenschaften:

| Namen       | Typ      | Details                                                                                                                                                                                                                                                                 |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | Session-Id vom Remote-Server zugewiesen.                                                                                                                                                                                                                                |
| `elementId` | `String` | Verknüpfte [Web-Element-Referenz](https://w3c.github.io/webdriver/#elements) die verwendet werden kann, um mit dem Element auf der Protokollebene zu interagieren                                                                                                       |
| `selector`  | `String` | [Selector](/docs/selectors) wird verwendet, um das Element abzufragen.                                                                                                                                                                                                  |
| `parent`    | `Object` | Entweder ein [Browser Object](/docs/api/browser) wenn das Element direct vom Browser aus gefunden wurde (z.B. `const elem = browser.$('selector')`) oder ein [Element-Objekt](/docs/api/element) wenn es von ein Element aus (z.B. `elem.$('selector')`) gesucht wurde. |
| `options`   | `Object` | WebdriverIO [Optionen](/docs/configuration) je nachdem, wie das Browserobjekt erstellt wurde. Weitere [Setup-Typen](/docs/setuptypes).                                                                                                                                  |

## Methoden

A element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. Available protocol commands depend on the type of session. If you run an automated browser session, none of the Appium [commands](/docs/api/appium) will be available and vice versa.

In addition to that the following commands are available:

| Name               | Parameters                                                            | Details                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to define custom commands that can be called from the browser object for compisition purposes. Read more in the [Custom Command](/docs/customcommands) guide.                                          |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to overwite any browser command with custom functionality. Use carefully as it can confuse framework users. Read more in the [Custom Command](/docs/customcommands#overwriting-native-commands) guide. |

## Remarks

### Element Chain

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element look ups. As element objects allow you to find elements within their tree branch using common query methods, users can fetch nested elements as follows:

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
