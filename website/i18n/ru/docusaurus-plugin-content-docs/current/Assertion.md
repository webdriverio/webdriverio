---
id: assertion
title: Assertion
---

[WDIO testrunner](https://webdriver.io/docs/clioptions) включает интегрированную библиотеку для проверок(assertion), которая дает возможность создавать эффективные проверки для разнообразных аспектов браузера или элементов вашего веб-приложения. Он расширяет функциональность [Jests Matchers](https://jestjs.io/docs/en/using-matchers) дополнительными, оптимизированными методами для e2e-тестирования, например.:

```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```

или

```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```

Полный список смотрите на странице [expect API](/docs/api/expect-webdriverio).

## Переход с Chai

[Chai](https://www.chaijs.com/) и [expect-webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) могут сосуществовать, и с некоторыми незначительными правками можно добиться плавного перехода к expect-webdriverio. Если вы обновились до WebdriverIO v6, то по умолчанию у вас будет доступ ко всем утверждениям из `expect-webdriverio` из коробки. Это означает, что везде, где вы используете `expect`, вы вызовете утверждение `expect-webdriverio`. То есть, если вы не установили [`injectGlobals`](/docs/configuration#injectglobals) на `false` или явно не переопределили глобальный `expect` будет использован Chai. В этом случае у вас не будет доступа ни к одному из утверждений expect-webdriverio без явного импорта пакета expect-webdriverio туда, где он вам нужен.

В этом руководстве будут показаны примеры того, как выполнить миграцию с Chai, если он был переопределен локально, и как выполнить миграцию с Chai, если он был переопределен глобально.

### Локально

Assume Chai was imported explicitly in a file, e.g.:

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

Чтобы мигрировать этот код, удалите импорт Chai и используйте новый метод предписанного `toHaveUrl` вместо этого:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

Если вы хотите использовать и Chai, и expect-webdriverio в одном и том же файле, вы должны сохранить импорт Chai, а `expect` по умолчанию будет использовать утверждение expect-webdriverio, например.:

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

Предположим, что `expect` было глобально переопределено для использования Chai. Чтобы использовать утверждения expect-webdriverio, нам нужно глобально установить переменную в хуке «before», например:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

Теперь Chai и expect-webdriverio можно использовать вместе. В своем коде вы должны использовать утверждения Chai и expect-webdriverio следующим образом, например:

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

Для миграции вам потребуется постепенно переносить каждое утверждение Chai на expect-webdriverio. После замены всех утверждений Chai в коде, можно удалить хук "before". Чтобы завершить миграцию, выполните глобальный поиск и замену, заменив все вхождения `wdioExpect` на `expect`.
