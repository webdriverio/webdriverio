---
id: element
title: شی Element
---

An Element Object is an object representing an element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. می توان آن را با استفاده از یکی از دستورات دریافت عناصر متعدد نیز دریافت کرد، به عنوان مثال [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) یا [`shadow$`](/docs/api/element/shadow$).

## ویژگی ها

یک شی element دارای ویژگی های زیر است:

| نام         | نوع      | جزئیات                                                                                                                                                                                                                            |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | Session id که از سرور remote اختصاص داده شده است.                                                                                                                                                                                 |
| `elementId` | `String` | مرجعی از [Web element refrence](https://w3c.github.io/webdriver/#elements) که می تواند برای تعامل با element در سطح پروتکل استفاده شود                                                                                            |
| `selector`  | `String` | [انتخابگر](/docs/selectors) برای درخواست element استفاده می شود.                                                                                                                                                                  |
| `parent`    | `Object` | یا شیء [browser](/docs/api/browser) هنگامی که عنصر از آن واکشی شده است (مثلاً `const elem = browser.$('selector')`) یا یک شی [element](/docs/api/element) اگر از دامنه element درخواست شده باشد (مثلاً `elemenet.$( "selector")`) |
| `options`   | `Object` | [options](/docs/configuration) های WebdriverIO که به این بستگی دارد که شئ browser چگونه ایجاد شده است. اطلاعات بیشتر در [راه اندازی types](/docs/setuptypes).                                                                     |

## متود ها(توابع)
An element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. دستورات پروتکل موجود به نوع session بستگی دارد. اگر یک session از مرورگر خودکار را اجرا کنید، هیچ یک از دستورات Appium [](/docs/api/appium) در دسترس نخواهد بود و بالعکس.

علاوه بر آن دستورات زیر نیز موجود است:

| نام                | پارامترها                                                             | جزئیات                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to define custom commands that can be called from the browser object for composition purposes. در راهنمای [Custom Command](/docs/customcommands) بیشتر بخوانید.                                                       |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to overwrite any browser command with custom functionality. با دقت استفاده شود زیرا می تواند کاربران فریمورک را گیج کند. در راهنمای [Custom Command](/docs/customcommands#overwriting-native-commands) بیشتر بخوانید. |

## ملاحظات

### زنجیره Element

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element lookups. از آنجایی که اشیاء element این امکان را می دهد که عناصر را در داخل شاخه خود با استفاده از روش های رایج درخواست پیدا کنید، کاربران می توانند عناصر تودرتو را به صورت زیر درخواست کنند:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

هنگامی که ساختار عمیقا تو در تو باشد، اختصاص دادن هر عنصر تو در تو به یک آرایه ممکن است بسیار مفصل باشد. Therefore WebdriverIO has the concept of chained element queries that allow fetching nested elements like this:

```js
console.log(await $('#header').$('#headline').getText())
```

این موضوع همچنین هنگام دریافت مجموعه ای از عناصر کار می کند، به عنوان مثال:

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

می توانید مستقیماً متدهای Array را در زنجیره element فراخوانی کنید، به عنوان مثال:

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

### دستورات سفارشی

می‌توانید دستورات سفارشی را در محدوده browser تنظیم کنید تا کار هایی که به طور مرتب استفاده می‌شود را در جایی دور انتزاعی کنید. برای اطلاعات بیشتر راهنمای ما در مورد [دستورات سفارشی](/docs/customcommands#adding-custom-commands) را بررسی کنید.
