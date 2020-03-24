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

For the full list, see the [expect API doc](/docs/api/expect.html).
