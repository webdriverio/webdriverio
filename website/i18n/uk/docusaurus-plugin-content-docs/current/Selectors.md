---
id: selectors
title: Селектори
---

[WebDriver протокол](https://w3c.github.io/webdriver/) надає кілька типів селекторів для пошуку елемента. WebdriverIO спрощує їх, щоб зробити пошук елементів простішим. Зауважте, що попри те, що команди для пошуку елементів називаються `$` та `$$`, вони не мають нічого спільного з jQuery або [Sizzle Selector Engine](https://github.com/jquery/sizzle).

Зауважте, що не всі із великої кількості типів селекторів можуть забезпечити, надійний пошук потрібного вам елемента. Наприклад, маючи таку кнопку:

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

Ми __рекомендуємо__ і __не рекомендуємо__ наступні селектори:

| Селектор                                      | Використовувати | Роз'яснення                                                     |
| --------------------------------------------- | --------------- | --------------------------------------------------------------- |
| `$('button')`                                 | 🚨 Ніколи        | Найгірше – надто загальне, без контексту.                       |
| `$('.btn.btn-large')`                         | 🚨 Ніколи        | Поганий. Зв'язаний зі стилями. Дуже схильний до змін.           |
| `$('#main')`                                  | ⚠️ Обережно     | Краще. Але все ще зв'язаний зі стилями або слухачами подій JS.  |
| `$(() => document.queryElement('button'))` | ⚠️ Обережно     | Ефективний, проте занадто складний для написання.               |
| `$('button[name="submission"]')`              | ⚠️ Обережно     | Зв'язаний із атрибутом `name`, який має семантику HTML.         |
| `$('button[data-testid="submit"]')`           | ✅ Можна         | Вимагає додаткових атрибутів, не пов'язаних із доступністю.     |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ Завжди        | Найкращий. Демонструє те, як користувач взаємодіє зі сторінкою. |

## CSS селектори

Якщо не вказано інше, WebdriverIO шукатиме елементи за допомогою [CSS селекторів](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors), наприклад:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L7-L8
```

## Текст посилання

Щоб отримати елемент посилання із певним текстом у ньому, вкажіть текст, починаючи зі знака рівності (`=`).

Наприклад:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L3
```

Ви можете знайти цей елемент, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L16-L18
```

## Частковий текст посилання

Щоб знайти елемент посилання, текст якого частково містить текст що ви шукаєте, використайте `*=` перед вашим текстом (наприклад `*=driver`).

Ви можете знайти елемент із прикладу вище, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L24-L26
```

__Примітка:__ Ви не можете поєднувати кілька типів пошуку в одному селекторі. Використовуйте кілька послідовних пошуків елементів для досягнення цієї мети, наприклад:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('*=driver')
```

## Елемент з певним текстом

Цю ж техніку можна застосувати і до елементів.

Наприклад, ось запит для заголовка рівня 1 із текстом "Welcome to my Page":

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L2
```

Ви можете знайти цей елемент, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L35-L36
```

Або використовуючи пошук за частковим збігом тексту:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L42-L43
```

Те саме працює для атрибутів `id` та `class`:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L4
```

Ви можете знайти цей елемент, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L45-L55
```

__Примітка:__ Ви не можете поєднувати кілька типів пошуку в одному селекторі. Використовуйте кілька послідовних пошуків елементів для досягнення цієї мети, наприклад:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('h1*=Welcome')
```

## Назва тегу

Щоб знайти елемент із певною назвою тегу, використовуйте `<tag>` або `<tag />`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L5
```

Ви можете знайти цей елемент, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L61-L62
```

## Атрибут name

Для запиту елементів із певним атрибутом name ви можете використовувати звичайний CSS селектор або спеціальний тип пошуку за цим атрибутом, що реалізований у [JSONWire протоколі](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol), вказавши щось на зразок `[name="some-name"]` у своєму селекторі:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L68-L69
```

__Примітка:__ Цей тип пошуку застарів та працює лише в старих браузерах, які працюють із JSONWire протоколом або з Appium.

## xPath

Отримати доступ до елемента можна також через [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath).

Селектор xPath має такий формат: `//body/div[6]/div[1]/span[1]`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/xpath.html
```

Ви можете знайти другий абзац, викликавши:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L75-L76
```

Ви також можете використовувати xPath для переходу вгору та вниз DOM деревом:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L78-L79
```

## Ім'я доступності

Шукайте елементи за їхніми іменами доступності. Ім'я доступності – це те, що озвучується програмою зчитування з екрана, коли цей елемент отримує фокус. Значенням імені доступності може бути як візуальний вміст, так і прихований текст.

:::info

Ви можете прочитати більше про цей селектор у нашому [блозі](/blog/2022/09/05/accessibility-selector)

:::

### Отримати за `aria-label`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L1
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L86-L87
```

### Отримати за `aria-labelledby`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L2-L3
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L93-L94
```

### Отримати за вмістом

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L4
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L100-L101
```

### Отримати за назвою

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L5
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L107-L108
```

### Отримати за `alt` атрибутом

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L114-L115
```

## ARIA - атрибут ролі

Для пошуку елементів на основі [ARIA ролей](https://www.w3.org/TR/html-aria/#docconformance)ви можете безпосередньо вказати роль елемента, як `[role=button]` у селекторі:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L13
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L131-L132
```

## Атрибут ID

Тип пошуку «id» не підтримується протоколом WebDriver, замість цього слід використовувати CSS або xPath пошук вказавши ID елемента.

Проте деякі драйвери (наприклад [Appium You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) все ще можуть [підтримувати](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) цей селектор.

Поточні підтримувані способи пошуку елемента за ID:

```js
//css locator
const button = await $('#someid')
//xpath locator
const button = await $('//*[@id="someid"]')
//id strategy
// Note: works only in Appium or similar frameworks which supports locator strategy "ID"
const button = await $('id=resource-id/iosname')
```

## JS Функція

Ви також можете використовувати функції JavaScript для пошуку елементів використовуючи вбудоване API. Звичайно, ви можете зробити це лише всередині вебконтексту (наприклад у браузері або вебконтексті на мобільному пристрої).

Маючи наступну структуру HTML:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/js.html
```

Ви можете запитати сусідній від `#elem` елемент наступним чином:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L139-L143
```

## Глибокі селектори

Багато вебзастосунків інтегрують елементи із [тіньовим DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM). Без обхідних шляхів пошук елементів у тіньовому DOM є технічно неможливим. [`shadow$`](https://webdriver.io/docs/api/element/shadow$) і [`shadow$$`](https://webdriver.io/docs/api/element/shadow$$) були такими обхідними шляхами, які мали свої [обмеження](https://github.com/Georgegriff/query-selector-shadow-dom#how-is-this-different-to-shadow). Але тепер за допомогою глибокого селектора ви можете шукати елементи всередині будь-якого тіньового DOM використовуючи стандартну функцію для пошуку.

Маючи вебзастосунок із такою структурою:

![Chrome Example](https://github.com/Georgegriff/query-selector-shadow-dom/raw/main/Chrome-example.png "Chrome Example")

За допомогою цього селектора ви можете знайти елемент `<button />`, який розташований в іншому тіньову DOM, наприклад:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L147-L149
```

## Мобільні селектори

Для гібридного мобільного тестування важливо, щоб сервер автоматизації був у потрібному *контексті* перед виконанням команд. Для автоматизації жестів драйвер в ідеалі має бути налаштований на головний контекст. Але щоб знайти елементи у DOM, драйвер потрібно налаштувати на контекст вебпереглядача. Лише *тоді* можна використовувати методи, згадані вище.

Для нативного мобільного тестування не потрібно змінювати контексти, оскільки вам потрібно використовувати спеціальні мобільні типи селекторів та використовувати безпосередньо базову технологію автоматизації пристрою. Це особливо корисно, коли тест потребує тонкого контролю над пошуком елементів.

### Android UiAutomator

Платформа Android UI Automator надає кілька типів пошуку елементів. Ви можете використовувати [UI Automator API](https://developer.android.com/tools/testing-support-library/index.html#uia-apis), зокрема [клас UiSelector](https://developer.android.com/reference/androidx/test/uiautomator/UiSelector) для пошуку елементів. В Appium ви надсилаєте рядок із Java кодом на сервер, який виконує його в середовищі мобільного додатку, повертаючи елемент або декілька елементів.

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")'
const button = await $(`android=${selector}`)
await button.click()
```

### Android DataMatcher і ViewMatcher (тільки Espresso)

Тип DataMatcher від Espresso забезпечує пошук елементів за [DataMatcher](https://developer.android.com/reference/android/support/test/espresso/DataInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"]
})
await menuItem.click()
```

І аналогічно [ViewMatcher](https://developer.android.com/reference/android/support/test/espresso/ViewInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"],
  "class": "androidx.test.espresso.matcher.ViewMatchers"
})
await menuItem.click()
```

### Android View Tag (тільки Espresso)

Тип View Tag забезпечує зручний спосіб пошуку елементів за їхнім [тегом](https://developer.android.com/reference/android/support/test/espresso/matcher/ViewMatchers.html#withTagValue%28org.hamcrest.Matcher%3Cjava.lang.Object%3E%29).

```js
const elem = await $('-android viewtag:tag_identifier')
await elem.click()
```

### iOS UIAutomation

Під час автоматизації iOS застосунків для пошуку елементів можна використовувати Apple [UI Automation фреймворк](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html).

Це JavaScript [API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) має методи доступу до представлення елемента та всього, що в ньому міститься.

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
const button = await $(`ios=${selector}`)
await button.click()
```

Ви також можете використовувати предикатний пошук з iOS UI Automation в Appium, щоб ще більш точно вибирати елементи. Дивіться [тут](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) щоб дізнатися більше.

### iOS XCUITest рядки предикатів і ланцюжки класів

З iOS 10 і вище (за допомогою драйвера `XCUITest`) ви можете використовувати [рядки предикатів](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules):

```js
const selector = `type == 'XCUIElementTypeSwitch' && name CONTAINS 'Allow'`
const switch = await $(`-ios predicate string:${selector}`)
await switch.click()
```

І [ланцюжки класів](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton'
const button = await $(`-ios class chain:${selector}`)
await button.click()
```

### Accessibility ID

Тип пошуку `accessibility id` призначена для пошуку за унікальним ідентифікатором елемента інтерфейсу користувача. Цей спосіб має перевагу, оскільки ідентифікатор не змінюється під час локалізації чи будь-якого іншого процесу. Крім того, це може бути корисно при створенні кросплатформних тестів, коли функціонально однакові елементи мають однаковий ідентифікатор доступності.

- Для iOS це `accessibility identifier` викладений Apple [тут](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html).
- Для Android `accessibility id` відповідає `content-description` елемента, як описано [тут](https://developer.android.com/training/accessibility/accessible-app.html).

Для обох платформ зазвичай найкращим методом є пошук елемента (або кількох елементів) за їхнім `accessibility id`. Використання цього типу селекторів, також є більш бажаним за використання застарілого типу `name`.

```js
const elem = await $('~my_accessibility_identifier')
await elem.click()
```

### Назва класу

Назва класу — це рядок, який представляє елемент інтерфейсу користувача у поточному контексті.

- Для iOS це повна назва класу [UIAutomation](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html), що починається з `UIA-`, наприклад `UIATextField` для текстового поля. Повну довідку можна знайти [тут](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- Для Android це повна назва [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [класу](https://developer.android.com/reference/android/widget/package-summary.html), наприклад `android.widget.EditText` для текстового поля. Повну довідку можна знайти [тут](https://developer.android.com/reference/android/widget/package-summary.html).
- Для Youi.tv це повна назва класу Youi.tv і що починається з `CYI-`, наприклад `CYIPushButtonView` для елемента кнопки. Повну довідку можна знайти на GitHub сторінці [You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver)

```js
// iOS example
await $('UIATextField').click()
// Android example
await $('android.widget.DatePicker').click()
// Youi.tv example
await $('CYIPushButtonView').click()
```

## Ланцюжок селекторів

Якщо ви хочете більше конкретизувати свій пошук, ви можете об'єднувати селектори, доки не дійдете до потрібного елементу. Якщо ви маєте інший елемент перед командою пошуку, WebdriverIO починає пошук із цього елемента.

Наприклад, якщо у вас є така структура DOM:

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

І ви хочете додати продукт B у кошик, це буде важко зробити, просто використовуючи селектор CSS.

З ланцюжком селекторів це набагато простіше. Просто конкретизуйте свій пошук крок за кроком:

```js
await $('.row .entry:nth-child(2)').$('button*=Add').click()
```

### Селектор зображень Appium

Використовуючи тип селектора `-image`, можна надіслати Appium файл зображення, що представляє елемент, до якого ви хочете отримати доступ.

Підтримувані формати файлів `jpg,png,gif,bmp,svg`

Повну довідку можна знайти [тут](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md)

```js
const elem = await $('./file/path/of/image/test.jpg')
await elem.click()
```

**Примітка**: Спосіб, у який Appium працює з цим селектором, полягає в тому, що він створює знімок екрана (застосунку) і використовує надане зображення, щоб перевірити, чи можна знайти елемент на знімку екрана (застосунку).

Майте на увазі, що Appium може змінити розмір зробленого знімка екрана (застосунку), щоб він відповідав CSS-розміру вашого екрана (застосунку) (це обов'язково станеться на iPhone, а також на комп’ютерах Mac із дисплеєм Retina, оскільки DPR більший ніж 1). Це призведе до того, що збіг не буде знайдено, оскільки наданий селектор зображення міг бути взятий з оригінального знімка екрана. Ви можете виправити це, оновивши налаштування сервера Appium, перегляньте [документацію Appium](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md#related-settings) для налаштувань і [цей коментар](https://github.com/webdriverio/webdriverio/issues/6097#issuecomment-726675579) з докладним поясненням.

## Селектори React

WebdriverIO дозволяє пошук компонентів React за їхнім іменем. Для цього у вас є дві команди: `react$` та `react$$`.

Ці команди дозволяють шукати компоненти у [React VirtualDOM](https://reactjs.org/docs/faq-internals.html) і повертати або один елемент WebdriverIO, або масив елементів (залежно від того, яка функція використовується).

**Примітка**: Команди `react$` і `react$$` подібні за функціональністю, за винятком того, що `react$$` поверне *усі* відповідні екземпляри як масив елементів WebdriverIO, а `react$` поверне лише перший знайдений екземпляр.

#### Простий приклад

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

У наведеному вище коді є простий екземпляр `MyComponent` всередині застосунку, який React відображає всередині елемента HTML з `id="root"`.

За допомогою команди `browser.react$` ви можете отримати доступ до екземпляра `MyComponent`:

```js
const myCmp = await browser.react$('MyComponent')
```

Тепер, коли у вас є елемент WebdriverIO, збережений у змінній `myCmp`, ви можете виконувати  різні команди елемента із ним.

#### Фільтрація компонентів

Бібліотека, яку WebdriverIO використовує, дозволяє фільтрувати компоненти за параметрами та/або станом. Для цього вам потрібно передати команді браузера другий аргумент для параметрів та/або третій аргумент для стану.

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

Якщо ви хочете отримати екземпляр `MyComponent`, який має параметр `name` зі значенням `WebdriverIO`, ви можете виконати таку команду:

```js
const myCmp = await browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

Якщо ви хочете відфільтрувати компоненти за станом, команда виглядатиме приблизно так:

```js
const myCmp = await browser.react$('MyComponent', {
    state: { myState: 'some value' }
})
```

#### Робота з `React.Fragment`

У разі використання команди `react$` для вибору React [fragments](https://reactjs.org/docs/fragments.html) WebdriverIO поверне перший вкладений елемент цього компонента. Якщо ви використовуєте `react$$`, ви отримаєте масив, що містить усі HTML-елементи всередині фрагментів, які відповідають селектору.

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

З наведеним вище прикладом, ось як працюватимуть команди:

```js
await browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
await browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**Примітка:** Якщо у вас є кілька екземплярів `MyComponent` і ви використовуєте `react$$` для пошуку цих компонентів-фрагментів, вам буде повернено масив усіх елементів. In other words, if you have 3 `<MyComponent />` instances, you will be returned an array with six WebdriverIO elements.

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
