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

Ein Element-Objekt liefert alle Methoden aus dem verfügbaren Automatisierungsprotokollen, z.B. [WebDriver](/docs/api/webdriver) Protokoll sowie Befehle, die im Elementbereich aufgelistet sind. Verfügbare Protokollbefehle hängen vom Sitzungstyp ab. Wenn Sie eine automatisierte Browsersitzung ausführen, wird keines der Appium [Befehle](/docs/api/appium) verfügbar sein und umgekehrt.

Zusätzlich stehen folgende Befehle zur Verfügung:

| Namen              | Parameter                                                             | Details                                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to define custom commands that can be called from the browser object for composition purposes. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands)                                                                                  |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to overwrite any browser command with custom functionality. Verwenden Sie diese Funktionalität sorgfältig, da es Framework-Benutzer verwirren kann. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands#overwriting-native-commands) |

## Bemerkungen

### Elementketten

Bei der Arbeit mit Elementen bietet WebdriverIO eine spezielle Syntax, die das Abfragen vereinfacht und das Suchen komplexer verschachtelter Elemente Variationen kombiniert. Da Elementobjekte es dir erlauben, Elemente in ihrem Zweig mit gemeinsamen Abfragemethoden zu finden, können Benutzer verschachtelte Elemente wie folgt abrufen:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

Bei tiefen verschachtelten Strukturen kann die Zuweisung eines verschachtelten Elements an ein Array sehr detailliert sein. Dafür hat WebdriverIO das Konzept der verketteten Element-Abfragen, mit denen verschachtelte Elemente wie folgt abgerufen werden können:

```js
console.log(await $('#header').$('#headline').getText())
```

Dies funktioniert auch beim Abrufen einer Reihe von Elementen, z. B.:

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

Bei der Arbeit mit Element Arrays kann dies besonders nützlich sein, wenn versucht wird, mit ihnen zu interagieren. Anstatt folgendes zu tun:

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

WebdriverIO verwendet [`p-iteration`](https://www.npmjs.com/package/p-iteration#api) unter der Haube, so dass alle Befehle von ihrer API auch für diese Anwendungsfälle unterstützt werden.

### Benutzerdefinierte Befehle

Sie können benutzerdefinierte Befehle dem Browser Objekt hinzufügen, um Workflows, die häufig verwendet werden, in einzelne Befehle zu verpacken. Schauen Sie sich unsere Anleitung unter [Benutzerdefinierte Befehle](/docs/customcommands#adding-custom-commands) für weitere Informationen an.
