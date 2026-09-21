---
id: v10-migration
title: From v9 to v10
---

This guide collects the breaking changes of WebdriverIO `v10` and what you have to do about them.

Unlike previous majors, most of these changes cannot be applied by the WebdriverIO [codemod](https://github.com/webdriverio/codemod), because they depend on what your tests actually mean. Each section below describes how to find the affected places in your suite.

## `$` is strict

`$` now represents __exactly one__ element. If the selector resolves to more than one element, the command throws a `StrictSelectorError` instead of silently using the first match:

```js
// v9 — clicks the first button, even if there are 12
await $('button').click()

// v10
await $('button').click()
// StrictSelectorError: strict mode violation: `$("button")` resolved to 12 elements, expected 1.
// Use `$$("button")` to work with all matches, `$$("button")[0]` if you explicitly want the first one,
// or narrow down the selector so it matches a single element.
```

This matches [Playwright locators](https://playwright.dev/docs/locators#strictness) and Cypress queries. A selector that quietly resolves to several elements is almost always a latent bug: it passes today and interacts with the wrong element as soon as someone adds a second button to the page.

The rule applies to every step of a chain (`$('form').$('input')`) and to all selector types, including mobile, shadow DOM and custom locator strategies.

### What did not change

- `$$` still returns zero or many elements.
- A selector that matches nothing still returns a lazily-resolved element, so `waitForExist` and [auto-waiting](autowait) behave as before.
- Passing an element reference, e.g. `$(await browser.getActiveElement())`, always refers to a single node and is never checked.

### How to audit your suite

There is no codemod for this: only you can tell whether a second match is a bug or intentional. Two practical approaches:

1. __Run your suite.__ Every violation throws with the selector and the number of matches, which is usually enough to fix it on the spot.
2. __Check the broad selectors up front.__ For each generic `$(...)` in your page objects, print how many elements it really matches:

   ```js
   console.log(await $$('button').length) // 12 → `$('button')` is too broad
   ```

Then either narrow down the selector — ideally towards a user-facing query such as `$('button=Submit')` or `$('aria/Submit')`, see [Selectors](selectors) — or state explicitly that you want the first match:

```js
await $('button[type="submit"]').click()
// ...or, if the first one really is what you mean
await $$('button')[0].click()
```

### Opting out

For a single query:

```js
await $('button', { strict: false }).click()
```

For a whole project, restoring the v9 behavior:

```js title="wdio.conf.js"
export const config = {
    // ...
    strictSelectors: false
}
```

An element remembers how it was queried, so re-fetching it — after a stale element reference, or through `waitForExist` — keeps the strictness of the original call.

:::info

Under the hood a strict `$` issues a `findElements` request instead of `findElement`, since counting the matches is the only way to enforce the rule. This is a single round trip either way, but it is visible to custom services and WebDriver mocks that key off the `findElement` command.

:::
