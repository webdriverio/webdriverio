---
id: assertion
title: アサーション
---

[WDIOテストランナー](https://webdriver.io/docs/clioptions)には、ブラウザーのさまざまな側面や (Web) アプリケーション内の要素に対して強力なアサーションを作成できるアサーション ライブラリが組み込まれています。 これは、e2e テスト用に最適化された追加のマッチャーで[Jests マッチャー](https://jestjs.io/docs/en/using-matchers)の機能を拡張します。例:

```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```

または

```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```

完全なリストについては、[APIドキュメントを参照](/docs/api/expect-webdriverio)してください。

## Chaiからの移行

[Chai](https://www.chaijs.com/)と[expect-webdriverio](https://github.com/webdriverio/expect-webdriverio#readme)は共存可能であり、若干の調整でexpect-webdriverioへのスムーズな移行が実現できます。 WebdriverIO v6 にアップグレードした場合は、デフォルトで `expect-webdriverio` のすべてのアサーションにアクセスできます。 つまり、グローバルに `expect` を使用する場合は、 `expect-webdriverio` アサーションを呼び出すことになります。 That is, unless you you set [`injectGlobals`](/docs/configuration#injectglobals) to `false` or have explicitly overridden the global `expect` to use Chai. In this case you would not have access to any of the expect-webdriverio assertions without explicitly importing the expect-webdriverio package where you need it.

This guide will show examples of how to migrate from Chai if it has been overridden locally and how to migrate from Chai if it has been overridden globally.

### ローカル

Chaiをファイルで明示的にインポートしたと仮定する：

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

このコードを移行するには、Chaiインポートを削除し、代わりに新しいexpect-webdriverioアサーションメソッド`toHaveUrl`を使用します：

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

同じファイルでChaiとexpect-webdriverioの両方を使いたい場合は、Chaiインポートを維持し、`expect`はexpect-webdriverioアサーションをデフォルトにします：

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

### グローバル

`expect`がチャイを使うようにグローバルにオーバーライドされたと仮定します。 In order to use expect-webdriverio assertions we need to globally set a variable in the "before" hook, e.g.:

```js
// wdio.conf.js
before: async () => {
    await import('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = await import('chai');
    global.expect = chai.expect;
}
```

Now Chai and expect-webdriverio can be used alongside each other. In your code you would use Chai and expect-webdriverio assertions as follows, e.g.:

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

To migrate you would slowly move each Chai assertion over to expect-webdriverio. Once all Chai assertions have been replaced throughout the code base the "before" hook can be deleted. A global find and replace to replace all instances of `wdioExpect` to `expect` will then finish off the migration.
