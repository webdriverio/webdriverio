---
id: element
title: The Element Object
---

An Element Object is an object representing a Element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. It can be received using one of the many element query commands, e.g. [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) or [`shadow$`](/docs/api/element/shadow$).

## Properties

An element object has the following properties:

| Name | Type | Details |
| ---- | ---- | ------- |
| `sessionId` | `String` | Session id assigned from the remote server. |
| `elementId` | `String` | Associated [web element reference](https://w3c.github.io/webdriver/#elements) that can be used to interact with the element on the protocol level |
| `selector` | `String` | [Selector](http://localhost:3000/docs/selectors) used to query the element. |
| `parent` | `Object` | Either the [Browser Object](/docs/api/browser) when element was fetched from the it (e.g. `const elem = browser.$('selector')`) or an [Element Object](/docs/api/element) if it was fetched from an element scope (e.g. `elem.$('selector')`) |
| `options` | `Object` | WebdriverIO [options](/docs/configuration) depending on how the browser object was created. See more [setup types](http://localhost:3000/docs/setuptypes). |

## Methods

A element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. Available protocol commands depend on the type of session. If you run an automated browser session, none of the Appium [commands](/docs/api/appium) will be available vice versa.

In addition to that the following commands are available:

| Name | Parameters | Details |
| ---- | ---------- | ------- |
| `addCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to define custom commands that can be called from the browser object for compisition purposes. Read more in the [Custom Command](/docs/customcommands) guide. |
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
