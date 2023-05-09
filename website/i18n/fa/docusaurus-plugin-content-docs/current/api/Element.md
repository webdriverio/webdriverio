---
id: element
title: شی Element
---

یک Element Object شیئی است که یک Element یا عنصر را در remote user agent نشان می دهد، به عنوان مثال یک نود [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Element) در یک session داخل یک مرورگر یا [یک element موبایل](https://developer.apple.com/documentation/swift/sequence/element) برای تلفن همراه. می توان آن را با استفاده از یکی از دستورات دریافت عناصر متعدد نیز دریافت کرد، به عنوان مثال [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) یا [`shadow$`](/docs/api/element/shadow$).

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

یک شیء element همه متود ها را از بخش پروتکل ارائه می کند، به عنوان مثال پروتکل [WebDriver](/docs/api/webdriver) و همچنین دستورات فهرست شده در بخش element. دستورات پروتکل موجود به نوع session بستگی دارد. اگر یک session از مرورگر خودکار را اجرا کنید، هیچ یک از دستورات Appium [](/docs/api/appium) در دسترس نخواهد بود و بالعکس.

علاوه بر آن دستورات زیر نیز موجود است:

| نام                | پارامترها                                                             | جزئیات                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to define custom commands that can be called from the browser object for composition purposes. در راهنمای [Custom Command](/docs/customcommands) بیشتر بخوانید.                                                       |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to overwrite any browser command with custom functionality. با دقت استفاده شود زیرا می تواند کاربران فریمورک را گیج کند. در راهنمای [Custom Command](/docs/customcommands#overwriting-native-commands) بیشتر بخوانید. |

## ملاحظات

### زنجیره Element

هنگام کار با عناصر، WebdriverIO فرمان خاصی را برای ساده کردن درخواست آنها و جستجوی عناصر تو در تو ی پیچیده ارائه می دهد. از آنجایی که اشیاء element این امکان را می دهد که عناصر را در داخل شاخه خود با استفاده از روش های رایج درخواست پیدا کنید، کاربران می توانند عناصر تودرتو را به صورت زیر درخواست کنند:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

هنگامی که ساختار عمیقا تو در تو باشد، اختصاص دادن هر عنصر تو در تو به یک آرایه ممکن است بسیار مفصل باشد. بنابراین WebdriverIO مفهوم درخواست های element زنجیره ای را دارد که امکان دریافت element های تودرتو مانند زیر را فراهم می کند:

```js
console.log(await $('#header').$('#headline').getText())
```

این موضوع همچنین هنگام دریافت مجموعه ای از عناصر کار می کند، به عنوان مثال:

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

هنگام کار با مجموعه‌ای از element ها، این امر می‌تواند به‌ویژه هنگام تلاش برای تعامل با آنها مفید باشد، بنابراین به جای انجام:

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

WebdriverIO از [`p-iteration`](https://www.npmjs.com/package/p-iteration#api) در بطن خود استفاده می کند، بنابراین تمام دستورات API آنها نیز برای استفاده پشتیبانی می شوند.

### دستورات سفارشی

می‌توانید دستورات سفارشی را در محدوده browser تنظیم کنید تا کار هایی که به طور مرتب استفاده می‌شود را در جایی دور انتزاعی کنید. برای اطلاعات بیشتر راهنمای ما در مورد [دستورات سفارشی](/docs/customcommands#adding-custom-commands) را بررسی کنید.
