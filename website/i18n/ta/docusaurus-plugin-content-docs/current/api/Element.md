---
id: element
title: எலிமெண்ட் ஆப்ஜெக்ட்
---

An Element Object is an object representing an element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) அல்லது [`shadow$`](/docs/api/element/shadow$)போன்ற பல எலிமென்ட் வினவல் கட்டளைகளில் ஒன்றைப் பயன்படுத்தி அதைப் பெறலாம்.

## பண்புகள்

பிரௌசர் ஆப்ஜெக்ட் பின்வரும் பண்புகளைக் கொண்டுள்ளது:

| பெயர்       | வகை      | விவரங்கள்                                                                                                                                                                                                                                            |
| ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | ரிமோட் சர்வரில் இருந்து அமர்வு ஐடி ஒதுக்கப்பட்டது.                                                                                                                                                                                                   |
| `elementId` | `String` | தொடர்புடைய [web element reference](https://w3c.github.io/webdriver/#elements), இது நெறிமுறை மட்டத்தில் உள்ள எலிமென்டுடன் தொடர்பு கொள்ள பயன்படுகிறது                                                                                                  |
| `selector`  | `String` | [Selector](/docs/selectors) எலிமென்டைக் வினவப் பயன்படுகிறது.                                                                                                                                                                                         |
| `parent`    | `Object` | [Browser Object](/docs/api/browser) அதிலிருந்து எலிமென்டைப் பெறும்போது (எ.கா. `const elem = browser.$('selector')`) அல்லது [Element Object](/docs/api/element) அது ஒரு எலிமென்ட் ஸ்கோப்பிலிருந்து எடுக்கப்பட்டிருந்தால் (எ.கா. `elem.$('selector')`) |
| `options`   | `Object` | பிரௌசர் ஆப்ஜெக்ட் எவ்வாறு உருவாக்கப்பட்டது என்பதைப் பொறுத்து WebdriverIO [options](/docs/configuration). மேலும் [setup types](/docs/setuptypes)காண்க.                                                                                                |

## மெத்தெடுகள்
An element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. கிடைக்கும் நெறிமுறை கட்டளைகள் அமர்வு வகையைப் பொறுத்தது. நீங்கள் ஒரு தானியங்கு பிரௌசர் அமர்வை இயக்கினால், Appium [commands](/docs/api/appium) எதுவும் கிடைக்காது மற்றும் நேர்மாறாகவும் இருக்கும்.

கூடுதலாக, பின்வரும் கட்டளைகள் கிடைக்கின்றன:

| பெயர்              | பாராமீட்டர்கள்                                                        | விவரங்கள்                                                                                                                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | கலவை நோக்கங்களுக்காகப் பிரௌசர் பொருளிலிருந்து அழைக்கப்படும் தனிப்பயன் கட்டளைகளை வரையறுக்க அனுமதிக்கிறது. [Custom Command](/docs/customcommands) வழிகாட்டியில் மேலும் படிக்கவும்.                                                                                  |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | தனிப்பயன் செயல்பாட்டுடன் எந்த பிரௌசர் கட்டளையையும் மேலெழுத அனுமதிக்கிறது. பிரேம்வர்கைப் பயன்படுத்துபவர்களைக் குழப்பக்கூடும் என்பதால் கவனமாகப் பயன்படுத்தவும். [Custom Command](/docs/customcommands#overwriting-native-commands) வழிகாட்டியில் மேலும் படிக்கவும். |

## குறிப்புகள்

### எலிமென்ட் செயின்

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element lookups. பொதுவான வினவல் முறைகளைப் பயன்படுத்தி, எலிமென்ட் ஆப்ஜெக்டுகள் அவற்றின் ட்ரீ பிராஞ்சில் உள்ள எலிமென்டுகளைக் கண்டறிய உங்களை அனுமதிப்பதால், பயனர்கள் நெஸ்டட் எலிமென்டுகளைப் பின்வருமாறு பெறலாம்:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

டீப் நெஸ்டட் கட்டமைப்புகள் ஒரு அரேவிற்கு எந்த நெஸ்டட் எலிமென்டையும் ஒதுக்கினால், அதைப் பயன்படுத்துவதற்கு அது மிகவும் வாய்மொழியாக இருக்கும். Therefore WebdriverIO has the concept of chained element queries that allow fetching nested elements like this:

```js
console.log(await $('#header').$('#headline').getText())
```

எலிமென்ட்சுகளின் தொகுப்பைப் பெறும்போது இதுவும் வேலை செய்கிறது, எ.கா.:

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

எலிமென்ட் சங்கிலியில் அரே மெத்தெடுகளை நீங்கள் நேரடியாக அழைக்கலாம், எ.கா.:

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

### தனிப்பயன் கட்டளைகள்

பொதுவாகப் பயன்படுத்தப்படும் பணிப்பாய்வுகளைத் தவிர்க்க, பிரவுசர் ஸ்கோப்பில் தனிப்பயன் கட்டளைகளை அமைக்கலாம். மேலும் தகவலுக்கு [தனிப்பயன் கட்டளைகள்](/docs/customcommands#adding-custom-commands) இல் உள்ள எங்கள் வழிகாட்டியைப் பார்க்கவும்.
