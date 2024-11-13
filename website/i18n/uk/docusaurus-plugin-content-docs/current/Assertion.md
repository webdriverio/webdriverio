---
id: assertion
title: Твердження
---

[Тестове середовище WDIO](https://webdriver.io/docs/clioptions) постачається з вбудованою бібліотекою тверджень, яка дозволяє вам робити ефективні твердження щодо різних аспектів браузера або елементів у вашому (веб-) додатку. Вона розширює функціональність [Jests Matchers](https://jestjs.io/docs/en/using-matchers) додатковими, оптимізованими для e2e тестування, відповідниками, наприклад:

```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```

або

```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```

Повний список можна знайти в документації до [expect API](/docs/api/expect-webdriverio).

## Міграція з Chai

[Chai](https://www.chaijs.com/) та [expect-webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) можуть співіснувати, та за допомогою невеликих налаштувань можна досягти плавного переходу на expect-webdriverio. Якщо ви оновили WebdriverIO до v6, то за замовчуванням ви матимете доступ до всіх тверджень `expect-webdriverio` з коробки. Це означає, що скрізь, де б ви не використовували `expect`, ви будете викликати твердження `expect-webdriverio`. Тобто, якщо тільки ви не встановили [`injectGlobals`](/docs/configuration#injectglobals) в `false` або не перевизначили глобальний `expect` для використання Chai. У цьому випадку ви не матимете доступу до жодного з тверджень expect-webdriverio без явного імпорту пакета expect-webdriverio туди, де він вам потрібен.

У цьому гайді наведено приклади того, як перейти з Chai, якщо він був замінений локально, і як перейти з Chai, якщо він був замінений на глобальному рівні.

### Локально

Припустимо, що Chai було явно імпортовано у файлі, наприклад:

```js
// myfile.js - original code
import { expect as expectChai } from 'chai'

describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        expectChai(await browser.getUrl()).to.include('/login')
    })
})
```

Щоб перенести цей код, видаліть імпорт Chai та замість нього використовуйте новий метод перевірки expect-webdriverio `toHaveUrl`:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

Якщо ви хочете використовувати і Chai, і expect-webdriverio в одному файлі, тоді вам слід зберегти імпорт Chai, а `expect` за замовчуванням використовуватиме твердження expect-webdriverio, наприклад:

```js
// myfile.js
import { expect as expectChai } from 'chai'
import { expect as expectWDIO } from '@wdio/globals'

describe('Element', () => {
    it('should be displayed', async () => {
        const isDisplayed = await $("#element").isDisplayed()
        expectChai(isDisplayed).to.equal(true); // Chai assertion
    })
});

describe('Other element', () => {
    it('should not be displayed', async () => {
        await expectWDIO($("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    })
})
```

### Глобально

Припустимо, що `expect` було глобально перевизначено для використання Chai. Для того, щоб використовувати твердження expect-webdriverio, нам потрібно глобально встановити змінну в хуку "before", наприклад:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

Тепер Chai та expect-webdriverio можна використовувати разом. У вашому коді ви можете використовувати твердження Chai та expect-webdriverio наступним чином, наприклад:

```js
// myfile.js
describe('Element', () => {
    it('should be displayed', async () => {
        const isDisplayed = await $("#element").isDisplayed()
        expect(isDisplayed).to.equal(true); // Chai assertion
    });
});

describe('Other element', () => {
    it('should not be displayed', async () => {
        await expectWdio($("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    });
});
```

Для міграції вам слід поступово перемістити кожне твердження Chai до expect-webdriverio. Після того, як всі твердження Chai буде замінено по всьому коду, хук "before" можна буде видалити. Глобальний пошук і заміна для заміни всіх екземплярів `wdioExpect` на `expect` завершить міграцію.
