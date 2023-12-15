---
id: element
title: Das Element-Objekt
---

An Element Object is an object representing an element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. Es kann über einen der vielen Elementabfragebefehle empfangen werden, z. [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) oder [`shadow$`](/docs/api/element/shadow$).

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
An element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. Verfügbare Protokollbefehle hängen vom Sitzungstyp ab. Wenn Sie eine automatisierte Browsersitzung ausführen, wird keines der Appium [Befehle](/docs/api/appium) verfügbar sein und umgekehrt.

Zusätzlich stehen folgende Befehle zur Verfügung:

| Namen              | Parameter                                                             | Details                                                                                                                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Ermöglicht die Definition benutzerdefinierter Befehle, die aus dem Browser-Objekt für Kompositionszwecke aufgerufen werden können. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands)                                                                        |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Ermöglicht das Überschreiben aller Browserbefehle mit benutzerdefinierten Funktionen. Verwenden Sie diese Funktionalität sorgfältig, da es Framework-Benutzer verwirren kann. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands#overwriting-native-commands) |

## Bemerkungen

### Elementketten

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element lookups. Da Elementobjekte es dir erlauben, Elemente in ihrem Zweig mit gemeinsamen Abfragemethoden zu finden, können Benutzer verschachtelte Elemente wie folgt abrufen:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

Bei tiefen verschachtelten Strukturen kann die Zuweisung eines verschachtelten Elements an ein Array sehr detailliert sein. Therefore WebdriverIO has the concept of chained element queries that allow fetching nested elements like this:

```js
console.log(await $('#header').$('#headline').getText())
```

Dies funktioniert auch beim Abrufen einer Reihe von Elementen, z. B.:

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

Können Sie Array-Methoden direkt auf der Elementkette aufrufen, z.B.:

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

### Benutzerdefinierte Befehle

Sie können benutzerdefinierte Befehle dem Browser Objekt hinzufügen, um Workflows, die häufig verwendet werden, in einzelne Befehle zu verpacken. Schauen Sie sich unsere Anleitung unter [Benutzerdefinierte Befehle](/docs/customcommands#adding-custom-commands) für weitere Informationen an.
