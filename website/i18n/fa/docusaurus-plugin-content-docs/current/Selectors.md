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

![مثال کروم](https://github.com/Georgegriff/query-selector-shadow-dom/raw/main/Chrome-example.png "مثال کروم")

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

برای هر دو پلتفرم، دریافت یک عنصر (یا چندین عنصر) با `شناسه دسترسی پذیری` معمولاً بهترین روش است. همچنین این روش نسبت به استراتژی منسوخ `name` ترجیح داده می‌شود.

```js
const elem = await $('~my_accessibility_identifier')
await elem.click()
```

### نام کلاس

استراتژی `نام کلاس` یک `رشته` است که نشان دهنده یک عنصر UI در view فعلی است.

- برای iOS این نام کامل یک کلاس [UIAutomation](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) است و با `UIA-`شروع می شود، مانند `UIATextField` برای یک فیلد متنی. مرجع کامل را می توان در [اینجا](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation) یافت.
- برای Android، این نام کاملاً واجد شرایط یک [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [class](https://developer.android.com/reference/android/widget/package-summary.html) است، مانند `android.widget.EditText` برای یک فیلد متنی. مرجع کامل را می توان در [اینجا](https://developer.android.com/reference/android/widget/package-summary.html) یافت.
- برای Youi.tv نام کامل یک کلاس Youi.tv است و دارای `CYI-`است، مانند `CYIPushButtonView` برای عنصر push button. مرجع کامل را می توان در صفحه [You.i Engine Driver's GitHub](https://github.com/YOU-i-Labs/appium-youiengine-driver) یافت

```js
// iOS example
await $('UIATextField').click()
// Android example
await $('android.widget.DatePicker').click()
// Youi.tv example
await $('CYIPushButtonView').click()
```

## انتخابگرهای زنجیره ای

اگر می‌خواهید در جستجوی خود دقیق‌تر باشید، می‌توانید انتخابگرها را تا زمانی که عنصر مناسب را پیدا کنید، زنجیره‌ای کنید. اگر قبل از دستور واقعی خود `عنصر` را فراخوانی کنید، WebdriverIO درخواست را از آن عنصر شروع می کند.

به عنوان مثال، اگر شما یک ساختار DOM مانند زیر داشته باشید:

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

و شما می خواهید محصول B را به سبد خرید اضافه کنید، انجام این کار فقط با استفاده از انتخابگر CSS دشوار خواهد بود.

با زنجیر کردن انتخابگر، این کار بسیار ساده‌تر است. به سادگی عنصر مورد نظر را مرحله به مرحله محدود کنید:

```js
await $('.row .entry:nth-child(2)').$('button*=Add').click()
```

### انتخابگر تصویر Appium

با استفاده از استراتژی مکان یاب  `-image` ، می توان یک فایل تصویری به Appium ارسال کرد که نشان دهنده عنصری است که می خواهید به آن دسترسی داشته باشید.

فرمت های فایل پشتیبانی شده `jpg، png، gif، bmp، svg`

مرجع کامل را می توان در [اینجا](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md) یافت

```js
const elem = await $('./file/path/of/image/test.jpg')
await elem.click()
```

**نکته**: نحوه عملکرد Appium با این انتخابگر به این صورت است که به صورت داخلی یک اسکرین شات (برنامه) می گیرد و از انتخابگر تصویر ارائه شده برای بررسی اینکه آیا عنصر را می توان در آن اسکرین شات (برنامه) پیدا کرد، استفاده می کند.

به این واقعیت توجه داشته باشید که Appium ممکن است اندازه اسکرین شات (برنامه) گرفته شده را تغییر دهد تا با اندازه CSS صفحه (برنامه) شما مطابقت داشته باشد (این اتفاق در آیفون ها و همچنین در دستگاه های مک با صفحه نمایش رتینا رخ می دهد زیرا DPR آنها بزرگتر 1) است. این موضوع منجر به عدم مطابقت می شود زیرا انتخابگر تصویر ارائه شده ممکن است از اسکرین شات اصلی گرفته شده باشد. می‌توانید با به‌روزرسانی تنظیمات سرور Appium این مشکل را برطرف کنید، [Appium Docs](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md#related-settings) برای تنظیمات و [این نظر](https://github.com/webdriverio/webdriverio/issues/6097#issuecomment-726675579) را برای توضیح مفصل تر ببینید.

## انتخابگرهای React

WebdriverIO راهی برای انتخاب اجزای React بر اساس نام کامپوننت ارائه می دهد. برای انجام این کار، دو دستور در اختیار دارید: `react$` و `react$$`.

این دستورات به شما امکان می‌دهند اجزای [React VirtualDOM](https://reactjs.org/docs/faq-internals.html) را انتخاب کنید و یک عنصر WebdriverIO یا آرایه‌ای از عناصر را برگردانید (بسته به اینکه از کدام تابع استفاده می‌کنید).

**نکته**: دستورات `react$` و `react$` از نظر عملکرد مشابه هستند، با این تفاوت که `react$$` *تمام* موارد منطبق را به عنوان آرایه ای از عناصر WebdriverIO برمی گرداند و `react$` اولین نمونه پیدا شده.

#### مثال پایه ای

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

در کد بالا یک نمونه ساده `MyComponent` در داخل برنامه وجود دارد که React آن را در یک عنصر HTML با `id="root"` رندر می کند.

با دستور `browser.react$` ، می توانید نمونه ای از `MyComponent`را انتخاب کنید:

```js
const myCmp = await browser.react$('MyComponent')
```

اکنون که عنصر WebdriverIO را در متغیر `myCmp` ذخیره کرده اید، می توانید دستورات عنصر ها را بر روی آن اجرا کنید.

#### فیلتر کردن اجزا

کتابخانه ای که WebdriverIO به صورت داخلی از آن استفاده می کند، اجازه می دهد تا انتخاب شما را بر اساس props و/یا state کامپوننت فیلتر کند. برای انجام این کار، باید یک آرگومان دوم برای props و/یا یک آرگومان سوم برای state با دستور browser ارسال کنید.

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

اگر می خواهید نمونه `MyComponent` را که دارای prop `name` است به عنوان `WebdriverIO`انتخاب کنید، می توانید دستور را به این صورت اجرا کنید:

```js
const myCmp = await browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

اگر می خواهید انتخاب را بر اساس state فیلتر کنید، دستور `browser` چیزی شبیه به این خواهد بود:

```js
const myCmp = await browser.react$('MyComponent', {
    state: { myState: 'some value' }
})
```

#### برخورد با `React.Fragment`

هنگام استفاده از دستور `react$` برای انتخاب React [fragments](https://reactjs.org/docs/fragments.html)، WebdriverIO اولین فرزند آن کامپوننت را به عنوان نود کامپوننت برمی گرداند. اگر از `react$$`استفاده کنید، یک آرایه حاوی تمام نود های HTML داخل fragment بدست می‌آورید که با انتخابگر مطابقت دارند.

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

با توجه به مثال بالا، دستورات به این صورت عمل می کنند:

```js
await browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
await browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**توجه:** اگر چندین نمونه از `MyComponent` دارید و از `react$$` برای انتخاب این اجزای fragment استفاده می کنید، یک آرایه یک بعدی از همه نود ها به شما برگردانده می شود. به عبارت دیگر، اگر 3 `<MyComponent/>` نمونه داشته باشید، یک آرایه با شش عنصر WebdriverIO به شما برگردانده می شود.

## استراتژی های انتخاب کننده سفارشی

اگر برنامه شما به روش خاصی برای دریافت عناصر نیاز دارد، می‌توانید یک استراتژی انتخاب‌کننده سفارشی برای خود تعریف کنید که می‌توانید از `custom$` و `custom$$`استفاده کنید. برای این منظور استراتژی خود را یک بار در ابتدای تست ثبت کنید:

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

تکه کد HTML زیر را فرض کنید:

```html
<div class="foobar" id="first">
    <div class="foobar" id="second">
        barfoo
    </div>
</div>
```

سپس با فرمان زیر از آن استفاده کنید:

```js
const elem = await browser.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "first"
const nestedElem = await elem.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "second"
```

**توجه:** این مثال فقط در یک محیط وبی کار می کند که در آن دستور [`execute`](/docs/api/browser/execute) می تواند اجرا شود.
