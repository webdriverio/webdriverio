---
id: assertion
title: Problèmes
---

Le testeur [WDIO](https://webdriver.io/docs/clioptions) est fourni avec une bibliothèque d'assertions intégrée qui vous permet de faire de puissantes assertions sur différents aspects du navigateur ou des éléments de votre application (web). Il étend la fonctionnalité [Jests Matchers](https://jestjs.io/docs/en/using-matchers) avec supplémentaire, pour les tests optimisés e2e, les matchers, par exemple.:

```js
const $button = attendre $('button')
attendent expect($button).toBeDisplayed()
```

ou

```js
const selectOptions = wait $$('form select>option')

// assurez-vous qu'il y a au moins une option dans select
wait expect(selectOptions).toHaveChildren({ gte: 1 })
```

Pour la liste complète, consultez la documentation [expect API doc](/docs/api/expect-webdriverio).

## Migration à partir de Canary

[Chai](https://www.chaijs.com/) and [expect-webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) can coexist, and with some minor adjustments a smooth transition to expect-webdriverio can be achieved. If you've upgraded to WebdriverIO v6 then by default you will have access to all the assertions from `expect-webdriverio` out of the box. This means that globally wherever you use `expect` you would call an `expect-webdriverio` assertion. That is, unless you you set [`injectGlobals`](/docs/configuration#injectglobals) to `false` or have explicitly overridden the global `expect` to use Chai. In this case you would not have access to any of the expect-webdriverio assertions without explicitly importing the expect-webdriverio package where you need it.

This guide will show examples of how to migrate from Chai if it has been overridden locally and how to migrate from Chai if it has been overridden globally.

### Local

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
// myfile.jsdescribe('Element  from 'chai'import  from '@wdio/globals'


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
});
```

To migrate you would slowly move each Chai assertion over to expect-webdriverio. Once all Chai assertions have been replaced throughout the code base the "before" hook can be deleted. A global find and replace to replace all instances of `wdioExpect` to `expect` will then finish off the migration.
