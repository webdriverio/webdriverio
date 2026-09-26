---
id: v10-migration
title: From v9 to v10
description: Every breaking change of WebdriverIO v10 and how to update your project, including Node.js, Mocha, Cucumber, strict selectors, legacy command signatures and removed commands.
---

This guide collects the breaking changes of WebdriverIO `v10` and what you have to do about them.

Unlike previous majors, most of these changes cannot be applied by the WebdriverIO [codemod](https://github.com/webdriverio/codemod), because they depend on what your tests actually mean. The [legacy command signatures](#legacy-command-signatures) below are mechanical replacements. Each other section describes how to find the affected places in your suite.

## Node.js

WebdriverIO v10 requires Node.js 22.19.0 or later. Node.js 18 and 20 are no longer supported. CI covers Node.js 22, 24, and 26.

## Mocha

`@wdio/mocha-framework` and `@wdio/browser-runner` depend on [Mocha 12](https://mochajs.org/blog/mocha-12-rc-1/). Mocha 12 needs Node.js `^20.19.0 || >=22.12.0`, which is covered by the v10 floor of 22.19.0.

```diff
- mochaOpts: { compilers: ['ts:ts-node/register'] }
+ mochaOpts: { require: ['ts-node/register'] }
```

`mochaOpts.compilers` is gone. Mocha removed the long-deprecated `--compilers` flag, so leftover compiler mappings are ignored. Load transpilers or other setup files with `mochaOpts.require`.

`failHookAffectedTests` defaults to `true`. A failing `before` or `beforeEach` hook fails the tests that hook skipped. Set `mochaOpts.failHookAffectedTests` to `false` to report only the hook.

Use [`expect-webdriverio` 6.1.0](https://github.com/webdriverio/expect-webdriverio/releases/tag/v6.1.0) or newer with this adapter. Mocha can load that package twice in one process; 6.1.0 shares assertion state across those copies ([expect-webdriverio#2221](https://github.com/webdriverio/expect-webdriverio/pull/2221)).

Mocha 12 changes that can leak through `mochaOpts`:

- `grep` accepts modern RegExp flags.
- `ui` is still `bdd`, `tdd`, `qunit`, or `exports`. Custom interfaces should keep the `*-bdd`, `*-tdd`, or `*-qunit` suffix.
- `parallel` is still unsupported. WDIO owns spec parallelism; Mocha's worker pool will error if you enable it.

Mocha 12 is ESM-first (`"type": "module"`). Programmatic `require('mocha')` still works on Node 22 via `require(esm)`. The WDIO Mocha CLI (`wdio run … --mochaOpts.*`) is unchanged; Mocha's own CLI now uses `util.parseArgs` instead of yargs.

## Cucumber

`@wdio/cucumber-framework` depends on [`@cucumber/cucumber` 13](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300).

Cucumber 13 requires Node.js 22, 24, or 26 or later. It does not run on Node.js 20, 23, or 25. The framework package declares that same range, starting at the v10 floor of 22.19.0.

```diff
- cucumberOpts: { tagExpression: '@smoke' }
+ cucumberOpts: { tags: '@smoke' }
```

`tagExpression` is not aliased. Setting it throws, so a leftover filter cannot silently run every scenario.

Cucumber 13 no longer exports `Cli`. Programmatic runs go through `runCucumber` from `@cucumber/cucumber/api`, which is what the adapter already uses.

Other Cucumber 13 breaks (ambiguous formatter paths, parallel workers, `BeforeAll` / `AfterAll`) are described in [Cucumber's upgrade guide](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300).

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

This matches [Playwright locators](https://playwright.dev/docs/locators#strictness). Cypress differs: its queries may resolve to several elements, and it is the action commands such as [`.click()`](https://docs.cypress.io/api/commands/click#Click-all-elements-with-id-starting-with-btn) that reject a multi-element subject by default. A selector that quietly resolves to several elements is almost always a latent bug: it passes today and interacts with the wrong element as soon as someone adds a second button to the page.

The rule applies to every step of a chain (`$('form').$('input')`) and to every selector type `$` accepts — string selectors (including ones that pierce the shadow DOM), JS functions, mobile selectors and custom strategy references.

### What did not change

- `$$` still returns zero or many elements.
- The dedicated helper commands `custom$`, `shadow$` and `react$` are not strict — they still return their first match, as do their `$$` counterparts.
- A selector that matches nothing still returns a lazily-resolved element, so `waitForExist` and [auto-waiting](/docs/autowait) behave as before.
- Passing an element reference, e.g. `$(await browser.getActiveElement())`, always refers to a single node and is never checked.

### How to audit your suite

There is no codemod for this: only you can tell whether a second match is a bug or intentional. Two practical approaches:

1. __Run your suite.__ Every violation throws with the selector and the number of matches, which is usually enough to fix it on the spot.
2. __Check the broad selectors up front.__ For each generic `$(...)` in your page objects, print how many elements it really matches:

   ```js
   console.log(await $$('button').length) // 12 → `$('button')` is too broad
   ```

Then either narrow down the selector — ideally towards a user-facing query such as `$('button=Submit')` or `$('aria/Submit')`, see [Selectors](/docs/selectors) — or state explicitly that you want the first match:

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

## Legacy command signatures

v9 still accepted older positional forms and warned. v10 accepts only the options object.

The v10 [codemod](https://github.com/webdriverio/codemod) rewrites `addCommand` and `overwriteCommand` when the third argument is a boolean, `getHTML(true)` and `getHTML(false)`, and `getCookies` when the filter is a string or a one-element array. A `getCookies` call with more than one name is left unchanged, because one filter matches one name.

Install the codemod first. WebdriverIO does not depend on it.

```sh
npm install jscodeshift @wdio/codemod
npx jscodeshift -t ./node_modules/@wdio/codemod/v10 ./e2e/
```

Use `--parser=tsx` for TypeScript files.

### `addCommand` and `overwriteCommand`

```diff
- browser.addCommand('myFn', fn, true)
+ browser.addCommand('myFn', fn, { attachToElement: true })

- browser.overwriteCommand('click', fn, true)
+ browser.overwriteCommand('click', fn, { attachToElement: true })
```

A boolean third argument is a TypeScript error. At runtime it throws:

```
Passing a boolean as the third argument to `addCommand` was removed in WebdriverIO v10. Use `addCommand(name, fn, { attachToElement: true })`.
```

`proto` and `instances` belong on that same options object. Omit the third argument to attach a command to the browser.

### `getCookies`

String and string-array filters are rejected. Pass a [cookie filter object](https://w3c.github.io/webdriver-bidi/#type-storage-CookieFilter). One call filters one name; call it again for another name.

```diff
- await browser.getCookies('session')
- await browser.getCookies(['session', 'auth'])
+ await browser.getCookies({ name: 'session' })
+ await browser.getCookies({ name: 'auth' })
```

`getCookies()` with no arguments still returns every cookie visible to the page.

### `getHTML`

```diff
- await $('h1').getHTML(false)
+ await $('h1').getHTML({ includeSelectorTag: false })
```

`getHTML()` with no arguments still includes the element's own tag.

### `newWindow`

`windowName` and `windowFeatures` are gone. They only applied to WebDriver Classic. The command still accepts `type`:

```diff
- await browser.newWindow('https://webdriver.io', {
-     windowName: 'WebdriverIO window',
-     windowFeatures: 'width=420,height=230,resizable,scrollbars=yes,status=1',
- })
+ await browser.newWindow('https://webdriver.io', { type: 'window' })
```

Use `type: 'tab'` to open a tab.

### `startActivity`

Only the options object is accepted. `appWaitPackage`, `appWaitActivity`, and `optionalIntentArguments` are gone. They only applied to the removed Appium HTTP endpoint. `mobile: startActivity` does not accept them, and passing them throws.

```diff
- await browser.startActivity('com.example.app', '.MainActivity')
- await browser.startActivity({
-     appPackage: 'com.example.app',
-     appActivity: '.MainActivity',
-     appWaitPackage: 'com.example.app',
-     appWaitActivity: '.MainActivity',
-     optionalIntentArguments: '--ez extra true',
- })
+ await browser.startActivity({
+     appPackage: 'com.example.app',
+     appActivity: '.MainActivity',
+ })
```

## Removed commands

`browser.throttle` and the deprecated `touchAction` commands have been removed.

| v9 | v10 |
| --- | --- |
| `browser.throttle('Regular3G')` | [`browser.throttleNetwork('Regular3G')`](/docs/api/browser/throttleNetwork) |
| `browser.touchAction(...)` / `element.touchAction(...)` | The [Actions API](/docs/api/browser/action) with a touch pointer, or the mobile commands [`tap`](/docs/api/mobile/tap) and [`swipe`](/docs/api/mobile/swipe) |

A touch gesture with the Actions API:

```js
await browser.action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ x: 100, y: 500 })
    .down()
    .move({ x: 100, y: 100, duration: 300 })
    .up()
    .perform()
```

## Jasmine

`@wdio/jasmine-framework` depends on [Jasmine 6](https://jasmine.github.io/upgrade-guides/6.0). Jasmine 6 needs Node.js 20, 22, or 24, which the v10 floor of 22.19.0 already covers.

## Puppeteer

`webdriverio` accepts `puppeteer-core` `>=24 <26`, including Puppeteer 25. `getPuppeteer()` and `@wdio/lighthouse-service` are tested against that line.

## ESLint

`eslint-plugin-wdio` exports only the flat config `flat/recommended`. The eslintrc name `plugin:wdio/recommended` is removed.

```js
import { configs as wdioConfig } from 'eslint-plugin-wdio'

export default [
    wdioConfig['flat/recommended'],
]
```

## TypeScript

Published packages set `typeScriptVersion` to 5.9.3, matching the TypeScript version this repository compiles with.

## Appium

WebdriverIO 10 requires **Appium 3** and current official drivers (UiAutomator2, XCUITest, Espresso, Windows, Mac2, and so on). Appium 1.x and 2.x are unsupported. Stay on WebdriverIO 9 if you cannot upgrade the server.

```sh
npm i -D appium@^3
appium driver update installed
```

`@wdio/appium-service` declares an optional `appium` peer of `>=3` and refuses to launch an older server. `create-wdio` installs `appium@^3` when Appium is missing or older than 3.

Cloud vendors that still expose Appium 2 need an Appium 3 image, or you need to stay on WebdriverIO 9.

### Mobile commands no longer fall back to HTTP

In v9, many mobile helpers tried `browser.execute('mobile: …')` and, on an unknown-method error, fell back to a removed Appium HTTP endpoint. In v10 that fallback is gone: the same error tells you to upgrade to Appium 3. Prefer the WebdriverIO mobile commands (`browser.lock()`, `browser.shake()`, …) or `browser.execute('mobile: …')` directly.

### Removed protocol commands

Appium 3 [removed many deprecated base-driver endpoints](https://appium.io/docs/en/3.0/guides/migrating-2-to-3/). WebdriverIO no longer exposes client methods for those routes (for example `appiumLock`, `touchPerform`, `startRecordingScreen` / `stopRecordingScreen`, and the Mobile JSON Wire Protocol map). Use W3C Actions, the corresponding mobile command, or a driver `mobile:` execute method instead. Screen recording replacements include `mobile: startXCTestScreenRecording` / `mobile: stopXCTestScreenRecording` (iOS), `mobile: startMediaProjectionRecording` / `mobile: stopMediaProjectionRecording` (Android), and the macOS / Windows driver equivalents. [`browser.saveRecordingScreen`](/docs/api/browser/saveRecordingScreen) now stops recording through those `mobile:` methods instead of the removed HTTP endpoints.

### Appium `--allow-insecure` scope

Appium 3 requires a driver or `*` scope prefix on `--allow-insecure` features, for example `uiautomator2:adb_shell` or `*:adb_shell`.

### Unprefixed Appium capabilities no longer select an Appium session

`automationName`, `deviceName`, and `appiumVersion` without an `appium:` prefix no longer tell WebdriverIO to skip the browser driver and attach the Appium service. Use the prefixed capability, or nest it under `appium:options`:

```diff
- capabilities: { platformName: 'Android', automationName: 'UiAutomator2', deviceName: 'emulator' }
+ capabilities: {
+     platformName: 'Android',
+     'appium:automationName': 'UiAutomator2',
+     'appium:deviceName': 'emulator'
+ }
```

`wdio repl` now emits those prefixed keys, including `appium:app`, `appium:platformVersion`, and `appium:udid`.

### `getValue` on mobile reads the element property

On a W3C session, including Appium 3, `element.getValue()` calls Get Element Property. It previously called Get Element Attribute for every mobile session. A non-W3C session still reads the attribute.
