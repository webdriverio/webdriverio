---
id: element
title: எலிமெண்ட் ஆப்ஜெக்ட்
---

எலிமென்ட் ஆப்ஜெக்ட் என்பது ரிமோட் யூசர் ஏஜெண்டில் உள்ள எலிமென்டைக் குறிக்கும் ஒரு ஆப்ஜெக்டாகும், எ.கா. [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) ஒரு பிரௌசரில் அமர்வை இயக்கும் போது அல்லது மொபைலில் [a mobile element](https://developer.apple.com/documentation/swift/sequence/element). [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) அல்லது [`shadow$`](/docs/api/element/shadow$)போன்ற பல எலிமென்ட் வினவல் கட்டளைகளில் ஒன்றைப் பயன்படுத்தி அதைப் பெறலாம்.

## பண்புகள்

பிரௌசர் ஆப்ஜெக்ட் பின்வரும் பண்புகளைக் கொண்டுள்ளது:

| பெயர்       | வகை      | விவரங்கள்                                                                                                                                                                                                                                            |
| ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | ரிமோட் சர்வரில் இருந்து அமர்வு ஐடி ஒதுக்கப்பட்டது.                                                                                                                                                                                                   |
| `elementId` | `String` | தொடர்புடைய [web element reference](https://w3c.github.io/webdriver/#elements), இது நெறிமுறை மட்டத்தில் உள்ள எலிமென்டுடன் தொடர்பு கொள்ள பயன்படுகிறது                                                                                                  |
| `selector`  | `String` | [Selector](/docs/selectors) எலிமென்டைக் வினவப் பயன்படுகிறது.                                                                                                                                                                                         |
| `parent`    | `Object` | [Browser Object](/docs/api/browser) அதிலிருந்து எலிமென்டைப் பெறும்போது (எ.கா. `const elem = browser.$('selector')`) அல்லது [Element Object](/docs/api/element) அது ஒரு எலிமென்ட் ஸ்கோப்பிலிருந்து எடுக்கப்பட்டிருந்தால் (எ.கா. `elem.$('selector')`) |
| `options`   | `Object` | பிரௌசர் ஆப்ஜெக்ட் எவ்வாறு உருவாக்கப்பட்டது என்பதைப் பொறுத்து WebdriverIO [options](/docs/configuration). See more [setup types](/docs/setuptypes).                                                                                                   |

## மெத்தெடுகள்

ஒரு எலிமென்ட் ஆப்ஜெக்ட் நெறிமுறை பிரிவிலிருந்து அனைத்து மெத்தெடுகளையும் வழங்குகிறது, எ.கா. [WebDriver](/docs/api/webdriver) நெறிமுறை மற்றும் எலிமென்ட் பிரிவில் பட்டியலிடப்பட்ட கட்டளைகள். கிடைக்கும் நெறிமுறை கட்டளைகள் அமர்வு வகையைப் பொறுத்தது. நீங்கள் ஒரு தானியங்கு பிரௌசர் அமர்வை இயக்கினால், Appium [commands](/docs/api/appium) எதுவும் கிடைக்காது மற்றும் நேர்மாறாகவும் இருக்கும்.

கூடுதலாக, பின்வரும் கட்டளைகள் கிடைக்கின்றன:

| பெயர்              | பாராமீட்டர்கள்                                                        | விவரங்கள்                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | கலவை நோக்கங்களுக்காகப் பிரௌசர் பொருளிலிருந்து அழைக்கப்படும் தனிப்பயன் கட்டளைகளை வரையறுக்க அனுமதிக்கிறது. [Custom Command](/docs/customcommands) வழிகாட்டியில் மேலும் படிக்கவும்.                                                                         |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | தனிப்பயன் செயல்பாட்டுடன் எந்த பிரௌசர் கட்டளையையும் மேலெழுத அனுமதிக்கிறது. பிரேம்வர்கைப் பயன்படுத்துபவர்களைக் குழப்பக்கூடும் என்பதால் கவனமாகப் பயன்படுத்தவும். Read more in the [Custom Command](/docs/customcommands#overwriting-native-commands) guide. |

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
