---
id: assertion
title: Assertion
---

> __Note:__ This document is only valid for WebdriverIO > v6.x. If you run an older version of WebdriverIO, please install [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio) separately and set it up according to its documentation.

The [WDIO testrunner](https://webdriver.io/docs/clioptions.html) comes with a built in assertion library that allows you to make powerful assertions on various aspects of the browser or elements within your (web) application. It extends [Jests Matchers](https://jestjs.io/docs/en/using-matchers) functionality with addtional, for e2e testing optimized, matchers, e.g.:

```js
const $button = $('button')
expect($button).toBeDisplayed()
```

or

```js
const selectOptions = $$('form select>option')

// make sure there is at least one option in select
expect(selectOptions).toHaveChildren({ gte: 1 })
```

For the full list, see the [expect API doc](/docs/api/expect.html).
