---
id: assertion
title: Assertion
---

Der [WDIO Testrunner](https://webdriver.io/docs/clioptions) verfügt über eine integrierte Assertion-Bibliothek, mit der Sie aussagekräftige Assertionen zu verschiedenen Aspekten des Browsers oder von Elementen in Ihrer (Web-)Anwendung erstellen können. Es erweitert die Funktionalität von [Jests Matchers](https://jestjs.io/docs/en/using-matchers) um zusätzliche, für e2e-Tests optimierte Matcher, z.B.:

```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```

oder

```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```

Die vollständige Liste finden Sie im [expect-API-Dokument](/docs/api/expect-webdriverio).

## Migration von Chai

[Chai](https://www.chaijs.com/) und [Expect-Webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) können nebeneinander existieren, und mit einigen geringfügigen Anpassungen kann ein reibungsloser Übergang zu Expect-Webdriverio erreicht werden. Wenn Sie auf WebdriverIO v6 aktualisiert haben, haben Sie standardmäßig Zugriff auf alle Zusicherungen von `Expect-WebdriverIO` out of the Box. Das bedeutet, dass Sie überall dort, wo Sie `erwarten` verwenden, eine `Expect-Webdriverio` Assertion aufrufen würden. Es sei denn, Sie setzen [`injectGlobals`](/docs/configuration#injectglobals) auf `false` oder haben explizit die globale `expect` Variable überschrieben. In diesem Fall hätten Sie keinen Zugriff auf „expect-webdriverio“, ohne das Paket explizit dort zu importieren, wo Sie es benötigen.

Dieser Leitfaden zeigt Beispiele für die Migration von Chai, wenn es lokal überschrieben wurde, und für die Migration von Chai, wenn es global überschrieben wurde.

### Lokal

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

To migrate this code remove the Chai import and use the new expect-webdriverio assertion method `toHaveUrl` instead:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', async () => {
        await browser.url('./')
        await expect(browser).toHaveUrl('/login') // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

If you wanted to use both Chai and expect-webdriverio in the same file you would keep the Chai import and `expect` would default to the expect-webdriverio assertion, e.g.:

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

### Global

Assume `expect` was globally overridden to use Chai. In order to use expect-webdriverio assertions we need to globally set a variable in the "before" hook, e.g.:

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
