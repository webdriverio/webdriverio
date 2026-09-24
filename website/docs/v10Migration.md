---
id: v10-migration
title: From v9 to v10
description: Every breaking change of WebdriverIO v10 and how to update your project, including Node.js, Mocha, Cucumber, strict selectors, legacy command signatures, removed commands, multiremote instance access, and element references.
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

## Capability spec filters

Spec and exclude lists on a capability use the `wdio:` prefix. Bare `specs` and `exclude` on a capability are ignored. The top-level config keys stay `specs` and `exclude`.

```diff
capabilities: [{
    browserName: 'firefox',
-   specs: ['test/ffOnly/*'],
-   exclude: ['test/ffOnly/skip.js'],
+   'wdio:specs': ['test/ffOnly/*'],
+   'wdio:exclude': ['test/ffOnly/skip.js'],
}]
```

A leftover bare list does not select files for that capability. The capability then uses the top-level `specs` and `exclude`.

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

## `setTimeout`

The JSON Wire Protocol key `page load` is rejected. Use `pageLoad`.

```diff
- await browser.setTimeout({ 'page load': 10000 })
+ await browser.setTimeout({ pageLoad: 10000 })
```

`implicit` and `script` are unchanged.

## Reporters

`client:afterCommand` no longer includes `name`. Read `command` for the command name. Custom commands already sent `command`.

## Allure

`addEnvironment(name, value)` is removed. It had no effect. Set environment rows with `reportedEnvironmentVars` in the Allure reporter options.

## Multiremote instance access

A multiremote browser no longer stores each session as its own property. The same is true for a multiremote element. `getInstance` and `select` are how you address one session.

```diff
- await browser.myChromeBrowser.url('https://webdriver.io')
- await (await browser.$('button')).myChromeBrowser.click()
+ await browser.getInstance('myChromeBrowser').url('https://webdriver.io')
+ await (await browser.$('button')).getInstance('myChromeBrowser').click()
```

A TypeScript augmentation that adds `myChromeBrowser: WebdriverIO.Browser` to `WebdriverIO.MultiRemoteBrowser` no longer matches a runtime property. Delete that augmentation and call `getInstance`.

With the testrunner and `injectGlobals` left on, the instance name is still a global (`myChromeBrowser.url(...)`). That global is the single session. It is not `browser.myChromeBrowser`.

Command results stay in capability order: the first entry belongs to the first key in the capabilities object.

## Element references

Element ids use the W3C WebDriver key `element-6066-11e4-a52e-4f735466cecf` and the `elementId` property. The JSON Wire Protocol field `ELEMENT` is no longer part of the element contract.

`WebdriverIO.Element` no longer declares `ELEMENT`. Read `element.elementId`, which element instances already expose.

`browser.execute`, and the built-in scripts that send an element into the page (`getHTML`, `isClickable`, `isDisplayed`, `scrollIntoView`, and the rest), pass only the W3C reference:

```diff
- await browser.execute((el) => el.ELEMENT, elem)
+ await browser.execute(
+     (el) => el['element-6066-11e4-a52e-4f735466cecf'],
+     elem
+ )
```

A find-element body that contains only `{ ELEMENT: '...' }` is not an element. Include the W3C key. If both keys are present, WebdriverIO uses the W3C id.

Jasmine prints a chained `$()` result through `toJSON`. That value is the same W3C reference, `{ 'element-6066-11e4-a52e-4f735466cecf': elementId }`.

## Jasmine

`@wdio/jasmine-framework` depends on [Jasmine 6](https://jasmine.github.io/upgrade-guides/6.0). Jasmine 6 needs Node.js 20, 22, or 24, which the v10 floor of 22.19.0 already covers.

`jasmineNodeOpts` was removed. Configure Jasmine with `jasmineOpts`. Setting `jasmineNodeOpts` throws.

`jasmineOpts.stopSpecOnExpectationFailure` was removed. Use `jasmineOpts.oneFailurePerSpec`. Setting the old key throws.

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

## WebDriver protocol

Every session is a W3C session. `browser.isW3C` is removed, including the value previously forwarded on the worker `sessionStarted` message. Passing `isW3C` to `attach` is ignored. The BiDi command set stays on the client. A live BiDi connection still depends on `webSocketUrl`.

The drivers WebdriverIO runs against already speak W3C on the client connection:

- ChromeDriver has been W3C by default since Chrome 75. Chromium-based Edge matches it. Current ChromeDriver still accepts `goog:chromeOptions.w3c: false`, which switches that one session back to the legacy protocol. WebdriverIO does not support that switch.
- geckodriver and Apple's safaridriver are W3C-only. A Safari response that omits `platformName` or `browserVersion` is still W3C.
- Selenium 4 and Grid 4 speak W3C. Grid stopped translating JSONWP in 4.9.
- Appium 2 dropped JSONWP and MJSONWP. Appium 3 also dropped the leftover JSONWP parameter shapes. v10 requires Appium 3, covered below. A mobile session that omits `setWindowRect` is still W3C; that capability means the device cannot resize a window.

These servers still speak JSONWP and are not supported: Selenium 3, PhantomJS, EdgeHTML (`--jwp`), and WinAppDriver connected to directly. The Appium Windows driver stays supported as a W3C client. It translates commands to WinAppDriver, including Get Element Property to the attribute endpoint. Point WebdriverIO at Appium, not at WinAppDriver's port.

`webdriver.remote.sessionid` no longer marks a Selenium standalone session. Selenium Grid 4 is still detected from `se:cdp`.

On desktop, `[name="..."]` is a CSS selector. The `name` locator strategy remains for mobile sessions.

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

`element.getValue()` calls Get Element Property, including on Appium 3. It previously called Get Element Attribute for every mobile session.

On a W3C session, including Appium 3, `element.getValue()` calls Get Element Property. It previously called Get Element Attribute for every mobile session. A non-W3C session still reads the attribute.

## MultiRemote naming

Every API that spelled [MultiRemote](/docs/multiremote) with a lowercase `r` now uses `MultiRemote`, matching the names that already did (`MultiRemoteBrowser`, `MultiRemoteElement`, `MultiRemoteConfig`). The old names are not aliased.

| v9 | v10 | Where |
|----|-----|-------|
| `browser.isMultiremote` | `browser.isMultiRemote` | Browser and element objects, including `MultiRemoteElementArray` |
| `Capabilities.RequestedMultiremoteCapabilities` | `Capabilities.RequestedMultiRemoteCapabilities` | `@wdio/types` |
| `Capabilities.WithRequestedMultiremoteCapabilities` | `Capabilities.WithRequestedMultiRemoteCapabilities` | `@wdio/types` |
| `runner.isMultiremote` | `runner.isMultiRemote` | `Options.RunnerStart` and `RunnerStats`, as passed to reporter hooks such as `onRunnerStart` |
| `isMultiremote` | `isMultiRemote` | `Workers.WorkerMessage` content |

```diff
- if (browser.isMultiremote) {
+ if (browser.isMultiRemote) {
```

Reading the old property returns `undefined` rather than throwing, so a check like the one above silently takes the non-MultiRemote branch. Search your suite, page objects, custom services and custom reporters for `Multiremote` (case-sensitive) and replace each match; TypeScript projects will also get a compile error for every renamed type.

### Output changes

Some text WebdriverIO prints changed with the rename. Update anything that parses or snapshots it:

- The spec reporter labels MultiRemote runs `MultiRemoteBrowser on chrome` instead of `MultiremoteBrowser on chrome`.
- The Allure reporter sets the `isMultiRemote` test parameter instead of `isMultiremote`.
- `getInstance()` throws `MultiRemote object has no instance named "…"` instead of `Multiremote object has no instance named "…"`.
