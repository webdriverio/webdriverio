---
id: element
title: Об'єкт Element
---

An Element Object is an object representing an element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. Він може бути отриманий за допомогою однієї з багатьох команд для пошуку елементів, наприклад, [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) або [`shadow$`](/docs/api/element/shadow$).

## Властивості

Об'єкт елементу має наступні властивості:

| Ім'я        | Тип      | Опис                                                                                                                                                                                                                                                     |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | Id сесії, в якій було знайдено цей елемент. Призначається сервером.                                                                                                                                                                                      |
| `elementId` | `String` | Посилання на [елемент](https://w3c.github.io/webdriver/#elements), яке можна використовувати для взаємодії з елементом на рівні протоколу                                                                                                                |
| `selector`  | `String` | [Селектор](/docs/selectors) який був використаний для запиту елемента.                                                                                                                                                                                   |
| `parent`    | `Object` | Об'єкт [браузера](/docs/api/browser), коли елемент був отриманий з нього (наприклад, `const elem = browser.('selector')`) або [Об'єкт елементу](/docs/api/element) якщо його було отримано пошуком від іншого елементу (наприклад, `elem.$('selector')`) |
| `options`   | `Object` | WebdriverIO [параметри](/docs/configuration) залежно від того, як було створено об’єкт браузера. Дізнатися більше можна переглянувши [параметри](/docs/setuptypes).                                                                                      |

## Методи
An element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. Доступні команди протоколу залежать від типу сесії. Наприклад, якщо ви запускаєте браузерну сесію, жодна з команд Appium [](/docs/api/appium) не буде доступною, і навпаки.

Також доступні такі команди:

| Ім'я               | Параметри                                                             | Опис                                                                                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Дозволяє додати власні команди, які можна викликати в об’єкта браузера для кращої композиції. Докладніше читайте в розділі [Власні команди](/docs/customcommands).                                                                                |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Дозволяє перезаписувати будь-яку команду браузера власною логікою. Будьте обережні! Це може збити з пантелику того хто буде використовувати код. Докладніше читайте в розділі [Власні команди](/docs/customcommands#overwriting-native-commands). |

## Примітки

### Ланцюги елементів

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element lookups. Об’єкти елементів дозволяють шукати вкладені елементи за допомогою звичайних методів пошуку, наприклад:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

З великими деревами елементів, зберігання кожного проміжного елементу до змінної для його подальшого використання може бути занадто розлого. Therefore WebdriverIO has the concept of chained element queries that allow fetching nested elements like this:

```js
console.log(await $('#header').$('#headline').getText())
```

Це також можна використовувати для отримання масиву елементів, наприклад:

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

Можна викликати методи масиву напряму на ланцюгу елементів:

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

### Власні команди

Ви можете додати власні команди до об'єкта браузера, щоб абстрагувати дії які часто використовуються. Ознайомтеся з нашим розділом про [Власні Команди](/docs/customcommands#adding-custom-commands), щоб дізнатися більше.
