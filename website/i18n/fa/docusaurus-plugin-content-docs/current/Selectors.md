---
id: selectors
title: گزینشگر ها (selectors)
---

پروتکل [WebDriver](https://w3c.github.io/webdriver/) چندین استراتژی گزینشگر برای درخواست یک عنصر فراهم می کند. WebdriverIO آنها را برای ساده نگه داشتن انتخاب عناصر ساده می کند. لطفاً توجه داشته باشید که با وجود اینکه دستور درخواست عناصر `$` و `$$`نامیده می شوند، آنها هیچ ارتباطی با jQuery یا موتور [Sizzle Selector](https://github.com/jquery/sizzle) ندارند.

در حالی که انتخاب‌کننده‌های مختلف بسیار زیادی وجود دارد، تنها تعداد کمی از آنها راه مستحکم و انعطاف پذیری را برای یافتن عنصر مناسب ارائه می‌دهند. به عنوان مثال، دکمه زیر را در نظر بگیرید:

```html
<button
  id="main"
  class="btn btn-large"
  name="submission"
  role="button"
  data-testid="submit"
>
  Submit
</button>
```

ما __انجام دهید__ و __انجام ندهید__ های زیر را برای انتخاب گزینشگر توصیه می کنیم:

| گزینشگر                                       | پیشنهاد      | یادداشت‌ها                                                  |
| --------------------------------------------- | ------------ | ----------------------------------------------------------- |
| `$('button')`                                 | 🚨 هرگز       | بدترین - بیش از حد عمومی، بدون زمینه.                       |
| `$('.btn.btn-large')`                         | 🚨 هرگز       | بد. وابسته به ظاهر. به شدت در معرض تغییر.                   |
| `$('#main')`                                  | ⚠️ با احتیاط | بهتر. اما همچنان با استایل یا شنوندگان رویداد JS همراه است. |
| `$(() => document.queryElement('button'))` | ⚠️ با احتیاط | درخواست مؤثر، اما پیچیده برای نوشتن.                        |
| `$('button[name="submission"]')`              | ⚠️ با احتیاط | همراه با ویژگی `name` که دارای معنای HTML است.              |
| `$('button[data-testid="submit"]')`           | ✅خوب         | به ویژگی اضافی نیاز دارد که به a11y متصل نیست.              |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ همیشه      | بهترین. شبیه نحوه تعامل کاربر با صفحه است.                  |

## انتخابگر درخواست CSS

اگر غیر از این مشخص نشده باشد، WebdriverIO عناصر را با استفاده از الگوی انتخابگر [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) درخواست می کند، به عنوان مثال:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L7-L8
```

## متن لینک

برای به دست آوردن یک عنصر انکر با یک متن خاص در آن، متنی را که با علامت تساوی (`=`) شروع می شود درخواست کنید.

برای مثال:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L3
```

می توانید این عنصر را با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L16-L18
```

## متن پیوند جزئی

برای یافتن یک عنصر انکر که متن قابل مشاهده آن تا حدی با مقدار جستجوی شما مطابقت دارد، با استفاده از `*=` در جلوی رشته جستجو (به عنوان مثال `*=driver`) آن را پرس و جو کنید.

شما می توانید عنصر مثال بالا را همچنین با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L24-L26
```

__نکته:__ شما نمی‌توانید چند استراتژی انتخابگر را در یک انتخابگر ترکیب کنید. برای رسیدن به یک هدف، از درخواست های چند عنصر زنجیره ای استفاده کنید، به عنوان مثال:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('*=driver')
```

## عنصر با متن خاص

همین تکنیک را می توان برای عناصر نیز به کار برد.

به عنوان مثال، در اینجا یک درخواست برای عنوان سطح 1 با متن "به صفحه من خوش آمدید" وجود دارد:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L2
```

می توانید این عنصر را با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L35-L36
```

یا با استفاده از درخواست بخشی از متن:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L42-L43
```

همین کار برای `id` و `نام کلاس` هم کار می کند:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L4
```

می توانید این عنصر را با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L45-L55
```

__نکته:__ شما نمی‌توانید چند استراتژی انتخابگر را در یک انتخابگر ترکیب کنید. برای رسیدن به یک هدف، از درخواست های چند عنصر زنجیره ای استفاده کنید، به عنوان مثال:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('h1*=Welcome')
```

## نام برچسب

برای پرس و جو از یک عنصر با نام تگ خاص، از `<tag>` یا `<tag/>`استفاده کنید.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L5
```

می توانید این عنصر را با فراخوانی فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L61-L62
```

## ویژگی نام

برای جست‌وجوی عناصر با ویژگی نام خاص، می‌توانید از یک انتخابگر معمولی CSS3 یا استراتژی نام ارائه شده از [JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) با ارسال چیزی مانند [name="some-name"] به عنوان پارامتر انتخابگر استفاده کنید:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L68-L69
```

__نکته:__ این استراتژی انتخابگر منسوخ شده است و فقط در مرورگرهای قدیمی که توسط پروتکل JSONWireProtocol یا با استفاده از Appium اجرا می شوند کار می کند.

## xPath

امکان درخواست از عناصر از طریق یک [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath) خاص نیز وجود دارد.

انتخابگر xPath دارای قالبی مانند `//body/div[6]/div[1]/span[1]` است.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/xpath.html
```

می توانید پاراگراف دوم را با فرمان زیر درخواست کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L75-L76
```

می‌توانید از xPath برای پیمایش درخت DOM به بالا و پایین استفاده کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L78-L79
```

## انتخابگر نام دسترسی پذیری

عناصر را با نام دسترسی پذیری آنها جستجو کنید. نام دسترسی پذیری چیزی است که توسط یک صفحه خوان هنگامی که بر آن عنصر تمرکز می‌شود، اعلام می شود. مقدار نام دسترسی پذیری می تواند محتوای بصری یا متن پنهان باشد.

:::info

شما می توانید در مورد این انتخابگر در [پست بلاگ ما](/blog/2022/09/05/accessibility-selector) بیشتر بخوانید

:::

### دریافت توسط `aria-label`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L1
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L86-L87
```

### دریافت توسط `aria-labelledby`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L2-L3
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L93-L94
```

### دریافت بر اساس محتوا

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L4
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L100-L101
```

### دریافت بر اساس عنوان

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L5
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L107-L108
```

### دریافت با ویژگی `alt`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L114-L115
```

## ویژگی Aria - Role

برای جست و جوی عناصر بر اساس [ARIA Role](https://www.w3.org/TR/html-aria/#docconformance)، می توانید مستقیماً نقش عنصر را مانند `[role=button]` به عنوان پارامتر انتخابگر مشخص کنید:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L13
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L131-L132
```

## ویژگی ID

استراتژی مکان یاب "id" در پروتکل WebDriver پشتیبانی نمی شود، به جای آن باید از استراتژی های انتخابگر CSS یا xPath برای یافتن عناصر با استفاده از ID استفاده کرد.

با این حال برخی از درایورها (مثلاً [Appium You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) ممکن است همچنان از این انتخابگر [پشتیبانی](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) کنند.

نحوهای انتخابگر پشتیبانی شده فعلی برای ID عبارتند از:

```js
//css locator
const button = await $('#someid')
//xpath locator
const button = await $('//*[@id="someid"]')
//id strategy
// Note: works only in Appium or similar frameworks which supports locator strategy "ID"
const button = await $('id=resource-id/iosname')
```

## تابع JS

همچنین می توانید از توابع جاوا اسکریپت برای دریافت عناصر با استفاده از API های بومی وب استفاده کنید. البته، شما فقط می توانید این کار را در یک زمینه وب (به عنوان مثال، `browser`، یا وب در تلفن همراه) انجام دهید.

ساختار HTML زیر را فرض کنید:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/js.html
```

می توانید عنصر خواهر و برادر `#elem` را به صورت زیر جستجو کنید:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L139-L143
```

## انتخابگرهای عمیق

بسیاری از برنامه های فرانت اند به شدت به عناصر دارای [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) متکی هستند. از نظر فنی امکان درخواست عناصر در Shadow DOM بدون راه حل های خاص وجود ندارد. [`shadow$`](https://webdriver.io/docs/api/element/shadow$) و [`shadow$$`](https://webdriver.io/docs/api/element/shadow$$) راه حل هایی بوده اند که [محدودیت](https://github.com/Georgegriff/query-selector-shadow-dom#how-is-this-different-to-shadow) خود را داشتند. با انتخابگر عمیق، اکنون می توانید با استفاده از دستور query مشترک، همه عناصر را در هر DOM سایه ای درخواست کنید.

فرض کنید یک برنامه با ساختار زیر داریم:

![Chrome Example](https://github.com/Georgegriff/query-selector-shadow-dom/raw/main/Chrome-example.png "Chrome Example")

با استفاده از این انتخابگر می توانید عنصر `<button />` را که در یک Shadow DOM دیگر قرار دارد، جستجو کنید، به عنوان مثال:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L147-L149
```

## انتخابگرهای موبایل

برای آزمایش موبایل هیبریدی، مهم است که سرور اتوماسیون قبل از اجرای دستورها در *context* صحیحی باشد. برای خودکار کردن حرکات، درایور در حالت ایده‌آل باید روی بافت بومی تنظیم شود. اما برای انتخاب عناصر از DOM، درایور باید روی زمینه وب‌نمای پلتفرم تنظیم شود. فقط *بعد از آن* می توان از روش های ذکر شده در بالا استفاده کرد.

برای تست بومی موبایل، هیچ تغییری بین زمینه‌ها وجود ندارد، زیرا باید از استراتژی‌های تلفن همراه استفاده کنید و مستقیماً از فناوری اتوماسیون زیربنای دستگاه استفاده کنید. این امر به ویژه زمانی مفید است که یک تست به کنترل دقیقی بر یافتن عناصر نیاز دارد.

### Android UiAutomator

فریم ورک UI Automator اندروید راه های زیادی برای یافتن عناصر ارائه می دهد. شما می توانید از [UI Automator API](https://developer.android.com/tools/testing-support-library/index.html#uia-apis)، به ویژه کلاس [UiSelector](https://developer.android.com/reference/androidx/test/uiautomator/UiSelector) برای مکان یابی عناصر استفاده کنید. در Appium شما کد جاوا را به صورت رشته ای به سرور ارسال می کنید که آن را در محیط برنامه اجرا می کند و عنصر یا عناصر را برمی گرداند.

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")'
const button = await $(`android=${selector}`)
await button.click()
```

### Android DataMatcher و ViewMatcher (فقط Espresso)

استراتژی DataMatcher اندروید راهی برای یافتن عناصر توسط [Data Matcher](https://developer.android.com/reference/android/support/test/espresso/DataInteraction) فراهم می کند

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"]
})
await menuItem.click()
```

و به طور مشابه [View Matcher](https://developer.android.com/reference/android/support/test/espresso/ViewInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"],
  "class": "androidx.test.espresso.matcher.ViewMatchers"
})
await menuItem.click()
```

### تگ View اندروید (فقط Espresso)

استراتژی تگ view یک راه راحت برای یافتن عناصر با [برچسب](https://developer.android.com/reference/android/support/test/espresso/matcher/ViewMatchers.html#withTagValue%28org.hamcrest.Matcher%3Cjava.lang.Object%3E%29) آنها ارائه می دهد.

```js
const elem = await $('-android viewtag:tag_identifier')
await elem.click()
```

### iOS UIAutomation

هنگام خودکارسازی یک برنامه iOS، از فریم ورک [UI Automation](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) اپل می توان برای یافتن عناصر استفاده کرد.

این جاوا اسکریپت [API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) دارای روش هایی برای دسترسی به view و همه چیز بر روی آن است.

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
const button = await $(`ios=${selector}`)
await button.click()
```

همچنین می‌توانید از جستجوی گزاره ای در iOS UI Automation در Appium برای بهبود انتخاب عنصر استفاده کنید. برای جزئیات [اینجا](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) را ببینید.

### iOS XCUITtest رشته های گزاره ای و زنجیره کلاس

با iOS 10 و بالاتر (با استفاده از درایور `XCUITest`)، می توانید از [رشته گزاره ای](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules) استفاده کنید:

```js
const selector = `type == 'XCUIElementTypeSwitch' && name CONTAINS 'Allow'`
const switch = await $(`-ios predicate string:${selector}`)
await switch.click()
```

[زنجیره کلاس](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton'
const button = await $(`-ios class chain:${selector}`)
await button.click()
```

### Accessibility ID

استراتژی مکان یاب `شناسه دسترسی پذیری` برای خواندن یک شناسه منحصر به فرد برای یک عنصر UI طراحی شده است. مزیت آن این است که در طول بومی سازی یا هر فرآیند دیگری که ممکن است متن را تغییر دهد تغییر نمی کند. علاوه بر این، اگر عناصری که از نظر عملکردی یکسان هستند، شناسه دسترسی یکسانی داشته باشند، می‌تواند در ایجاد تست‌های بین پلتفرمی کمک کننده باشد.

- برای iOS، این شناسه `دسترسی پذیری` است که توسط Apple [در اینجا](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html) ارائه شده است.
- برای Android، `شناسه دسترسی پذیری` به `content-description` برای عنصر، همانطور که در [اینجا](https://developer.android.com/training/accessibility/accessible-app.html) توضیح داده شده است، نگاشت می شود.

For both platforms, getting an element (or multiple elements) by their `accessibility id` is usually the best method. It is also the preferred way over the deprecated `name` strategy.

```js
const elem = await $('~my_accessibility_identifier')
await elem.click()
```

### Class Name

The `class name` strategy is a `string` representing a UI element on the current view.

- For iOS it is the full name of a [UIAutomation class](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html), and will begin with `UIA-`, such as `UIATextField` for a text field. A full reference can be found [here](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- For Android it is the fully qualified name of a [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [class](https://developer.android.com/reference/android/widget/package-summary.html), such `android.widget.EditText` for a text field. A full reference can be found [here](https://developer.android.com/reference/android/widget/package-summary.html).
- For Youi.tv it is the full name of a Youi.tv class, and will being with `CYI-`, such as `CYIPushButtonView` for a push button element. A full reference can be found at [You.i Engine Driver's GitHub page](https://github.com/YOU-i-Labs/appium-youiengine-driver)

```js
// iOS example
await $('UIATextField').click()
// Android example
await $('android.widget.DatePicker').click()
// Youi.tv example
await $('CYIPushButtonView').click()
```

## Chain Selectors

If you want to be more specific in your query, you can chain selectors until you've found the right element. If you call `element` before your actual command, WebdriverIO starts the query from that element.

For example, if you have a DOM structure like:

```html
<div class="row">
  <div class="entry">
    <label>Product A</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product B</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product C</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
</div>
```

And you want to add product B to the cart, it would be difficult to do that just by using the CSS selector.

With selector chaining, it's way easier. Simply narrow down the desired element step by step:

```js
await $('.row .entry:nth-child(2)').$('button*=Add').click()
```

### Appium Image Selector

Using the  `-image` locator strategy, it is possible to send an Appium an image file representing an element you want to access.

Supported file formats `jpg,png,gif,bmp,svg`

Full reference can be found [here](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md)

```js
const elem = await $('./file/path/of/image/test.jpg')
await elem.click()
```

**Note**: The way how Appium works with this selector is that it will internally make a (app)screenshot and use the provided image selector to verify if the element can be found in that (app)screenshot.

Be aware of the fact that Appium might resize the taken (app)screenshot to make it match the CSS-size of your (app)screen (this will happen on iPhones but also on Mac machines with a Retina display because the DPR is bigger than 1). This will result in not finding a match because the provided image selector might have been taken from the original screenshot. You can fix this by updating the Appium Server settings, see the [Appium docs](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md#related-settings) for the settings and [this comment](https://github.com/webdriverio/webdriverio/issues/6097#issuecomment-726675579) on a detailed explanation.

## React Selectors

WebdriverIO provides a way to select React components based on the component name. To do this, you have a choice of two commands: `react$` and `react$$`.

These commands allow you to select components off the [React VirtualDOM](https://reactjs.org/docs/faq-internals.html) and return either a single WebdriverIO Element or an array of elements (depending on which function is used).

**Note**: The commands `react$` and `react$$` are similar in functionality, except that `react$$` will return *all* matching instances as an array of WebdriverIO elements, and `react$` will return the first found instance.

#### Basic example

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
    return (
        <div>
            MyComponent
        </div>
    )
}

function App() {
    return (<MyComponent />)
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

In the above code there is a simple `MyComponent` instance inside the application, which React is rendering inside a HTML element with `id="root"`.

With the `browser.react$` command, you can select an instance of `MyComponent`:

```js
const myCmp = await browser.react$('MyComponent')
```

Now that you have the WebdriverIO element stored in `myCmp` variable, you can execute element commands against it.

#### Filtering components

The library that WebdriverIO uses internally allows to filter your selection by props and/or state of the component. To do so, you need to pass a second argument for props and/or a third argument for state to the browser command.

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent(props) {
    return (
        <div>
            Hello { props.name || 'World' }!
        </div>
    )
}

function App() {
    return (
        <div>
            <MyComponent name="WebdriverIO" />
            <MyComponent />
        </div>
    )
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

If you want to select the instance of `MyComponent` that has a prop `name` as `WebdriverIO`, you can execute the command like so:

```js
const myCmp = await browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

If you wanted to filter our selection by state, the `browser` command would looks something like so:

```js
const myCmp = await browser.react$('MyComponent', {
    state: { myState: 'some value' }
})
```

#### Dealing with `React.Fragment`

When using the `react$` command to select React [fragments](https://reactjs.org/docs/fragments.html), WebdriverIO will return the first child of that component as the component's node. If you use `react$$`, you will receive an array containing all the HTML nodes inside the fragments that match the selector.

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
    return (
        <React.Fragment>
            <div>
                MyComponent
            </div>
            <div>
                MyComponent
            </div>
        </React.Fragment>
    )
}

function App() {
    return (<MyComponent />)
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

Given the above example, this is how the commands would work:

```js
await browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
await browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**Note:** If you have multiple instances of `MyComponent` and you use `react$$` to select these fragment components, you will be returned an one-dimensional array of all the nodes. In other words, if you have 3 `<MyComponent />` instances, you will be returned an array with six WebdriverIO elements.

## Custom Selector Strategies

If your app requires a specific way to fetch elements you can define yourself a custom selector strategy that you can use with `custom$` and `custom$$`. For that register your strategy once in the beginning of the test:

```js
browser.addLocatorStrategy('myCustomStrategy', (selector, root) => {
    /**
     * scope should be document if called on browser object
     * and `root` if called on an element object
     */
    const scope = root ? root : document
    return scope.querySelectorAll(selector)
})
```

Given the following HTML snippet:

```html
<div class="foobar" id="first">
    <div class="foobar" id="second">
        barfoo
    </div>
</div>
```

Then use it by calling:

```js
const elem = await browser.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "first"
const nestedElem = await elem.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "second"
```

**Note:** this only works in an web environment in which the [`execute`](/docs/api/browser/execute) command can be run.
