---
id: assertion
title: Assertion
---

> __Note:__ This document is only valid for WebdriverIO > v6.x. If you run an older version of WebdriverIO, please install [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio) separately and set it up according to its documentation.

The [WDIO testrunner](https://webdriver.io/docs/clioptions.html) comes with a built in assertion library that allows you to make powerful assertions on various aspects of the browser or elements within your (web) application. It extends [Jests Matchers](https://jestjs.io/docs/en/using-matchers) functionality with additional, for e2e testing optimized, matchers, e.g.:

<!--DOCUSAURUS_CODE_TABS-->
<!--Sync Mode-->
```js
const $button = $('button')
expect($button).toBeDisplayed()
```
<!--Async Mode-->
```js
const $button = await $('button')
await expect($button).toBeDisplayed()
```
<!--END_DOCUSAURUS_CODE_TABS-->

or

<!--DOCUSAURUS_CODE_TABS-->
<!--Sync Mode-->
```js
const selectOptions = $$('form select>option')

// make sure there is at least one option in select
expect(selectOptions).toHaveChildren({ gte: 1 })
```
<!--Async Mode-->
```js
const selectOptions = await $$('form select>option')

// make sure there is at least one option in select
await expect(selectOptions).toHaveChildren({ gte: 1 })
```
<!--END_DOCUSAURUS_CODE_TABS-->

For the full list, see the [expect API doc](/docs/api/expect-webdriverio.html).

## Migrating from Chai

[Chai](https://www.chaijs.com/) and [expect-webdriverio](https://github.com/webdriverio/expect-webdriverio#readme) can coexist, and with some minor adjustments a smooth transition to expect-webdriverio can be achieved. If you've upgraded to wdio v6 then by default you will have access to all the assertions from expect-webdriverio out of the box. This means that globally wherever you use `expect` you would call an expect-webdriverio assertion. That is, unless you have explicitly overriden the global `expect` to use Chai. In this case you would not have access to any of the expect-webdriverio assertions without explicitly importing the expect-webdriverio package where you need it.

This guide will show examples of how to migrate from Chai if it has been overridden locally and how to migrate from Chai if it has been overridden globally.

### Local

Assume Chai was imported explicitly in a file, e.g.:

```js
// myfile.js - original code
const expectChai = require('chai').expect;

describe('Homepage', () => {
    it('should assert', () => {
        browser.url('./');
        expectChai(browser.getUrl()).to.include('/login');
    });
});
```

To migrate this code remove the Chai import and use the new expect-webdriverio assertion method `toHaveUrl` instead:

```js
// myfile.js - migrated code
describe('Homepage', () => {
    it('should assert', () => {
        browser.url('./');
        expect(browser).toHaveUrl('/login'); // new expect-webdriverio API method https://webdriver.io/docs/api/expect-webdriverio.html#tohaveurl
    });
});
```

If you wanted to use both Chai and expect-webdriverio in the same file you would keep the Chai import and `expect` would default to the expect-webdriverio assertion, e.g.:

```js
// myfile.js
const expectChai = require('chai').expect;

describe('Element', () => {
    it('should be displayed', () => {
        const isDisplayed = browser.$("#element").isDisplayed()
        expectChai(isDisplayed).to.equal(true); // Chai assertion
    });
});

describe('Other element', () => {
    it('should not be displayed', () => {
        expect(browser.$("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    });
});
```

### Global

Assume `expect` was globally overridden to use Chai. In order to use expect-webdriverio assertions we need to globally set a variable in the "before" hook, e.g.:

```js
// wdio.conf.js
before: () => {
    require('expect-webdriverio');
    global.wdioExpect = global.expect;
    const chai = require('chai');
    global.expect = chai.expect;
}
```

Now Chai and expect-webdriverio can be used alongside each other. In your code you would use Chai and expect-webdriverio assertions as follows, e.g.:

```js
// myfile.js
describe('Element', () => {
    it('should be displayed', () => {
        const isDisplayed = browser.$("#element").isDisplayed()
        expect(isDisplayed).to.equal(true); // Chai assertion
    });
});

describe('Other element', () => {
    it('should not be displayed', () => {
        expectWdio(browser.$("#element")).not.toBeDisplayed(); // expect-webdriverio assertion
    });
});
```

To migrate you would slowly move each Chai assertion over to expect-webdriverio. Once all Chai assertions have been replaced thoughout the code base the "before" hook can be deleted. A global find and replace to replace all instances of `wdioExpect` to `expect` will then finish off the migration.
