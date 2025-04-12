---
id: element
title: Das Element-Objekt
---

Ein Element-Objekt ist ein Objekt, das ein Element auf dem Remote-User-Agent repräsentiert, z.B. ein [DOM-Knoten](https://developer.mozilla.org/en-US/docs/Web/API/Element) bei der Ausführung einer Sitzung in einem Browser oder [ein mobiles Element](https://developer.apple.com/documentation/swift/sequence/element) für mobile Anwendungen. Es kann über einen der vielen Elementabfragebefehle empfangen werden, z. [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) oder [`shadow$`](/docs/api/element/shadow$).

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
Ein Element-Objekt stellt alle Methoden aus dem Protokollabschnitt bereit, z.B. [WebDriver](/docs/api/webdriver) Protokoll sowie Befehle, die im Element-Abschnitt aufgeführt sind. Verfügbare Protokollbefehle hängen vom Sitzungstyp ab. Wenn Sie eine automatisierte Browsersitzung ausführen, wird keines der Appium [Befehle](/docs/api/appium) verfügbar sein und umgekehrt.

Zusätzlich stehen folgende Befehle zur Verfügung:

| Namen              | Parameter                                                             | Details                                                                                                                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Ermöglicht die Definition benutzerdefinierter Befehle, die aus dem Browser-Objekt für Kompositionszwecke aufgerufen werden können. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands)                                                                        |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Ermöglicht das Überschreiben aller Browserbefehle mit benutzerdefinierten Funktionen. Verwenden Sie diese Funktionalität sorgfältig, da es Framework-Benutzer verwirren kann. Lesen Sie mehr in der [Benutzerdefinierte Anleitung](/docs/customcommands#overwriting-native-commands) |

## Bemerkungen

### Elementketten

Bei der Arbeit mit Elementen bietet WebdriverIO eine spezielle Syntax, um die Abfrage von Elementen zu vereinfachen und komplexe verschachtelte Element-Lookups zusammenzusetzen. Da Elementobjekte es dir erlauben, Elemente in ihrem Zweig mit gemeinsamen Abfragemethoden zu finden, können Benutzer verschachtelte Elemente wie folgt abrufen:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // gibt "I am a headline" aus
```

Bei tiefen verschachtelten Strukturen kann die Zuweisung eines verschachtelten Elements an ein Array sehr detailliert sein. Daher hat WebdriverIO das Konzept der verketteten Elementabfragen, die es ermöglichen, verschachtelte Elemente wie folgt abzurufen:

```js
console.log(await $('#header').$('#headline').getText())
```

Dies funktioniert auch beim Abrufen einer Reihe von Elementen, z. B.:

```js
// erhalte den Text der 3. Überschrift im 2. Header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

Bei der Arbeit mit einer Reihe von Elementen kann dies besonders nützlich sein, wenn Sie mit ihnen interagieren möchten. Anstatt also:

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

gleich wie:

```js
const divs = await $$('div')
const location = await divs.map((el) => el.getLocation())
```

WebdriverIO verwendet eine benutzerdefinierte Implementierung, die asynchrone Iteratoren unter der Haube unterstützt, so dass alle Befehle aus ihrer API auch für diese Anwendungsfälle unterstützt werden.

__Hinweis:__ Alle asynchronen Iteratoren geben ein Promise zurück, auch wenn Ihr Callback keines zurückgibt, z.B.:

```ts
const divs = await $$('div')
console.log(divs.map((div) => div.selector)) // ❌ gibt "Promise<string>[]" zurück
console.log(await divs.map((div) => div.selector)) // ✅ gibt "string[]" zurück
```

### Benutzerdefinierte Befehle

Sie können benutzerdefinierte Befehle dem Browser Objekt hinzufügen, um Workflows, die häufig verwendet werden, in einzelne Befehle zu verpacken. Schauen Sie sich unsere Anleitung unter [Benutzerdefinierte Befehle](/docs/customcommands#adding-custom-commands) für weitere Informationen an.
