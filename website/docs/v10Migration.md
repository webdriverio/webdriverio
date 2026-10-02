---
id: v10-migration
title: From v9 to v10
description: Update a WebdriverIO v9 project to v10, including every breaking change and a coding-agent skill that applies this guide.
---

This guide collects the breaking changes of WebdriverIO `v10` and what you have to do about them.

Unlike previous majors, most of these changes cannot be applied by the WebdriverIO [codemod](https://github.com/webdriverio/codemod), because they depend on what your tests actually mean. The [legacy command signatures](#legacy-command-signatures) below are mechanical replacements. Each other section describes how to find the affected places in your suite.

## Migrate with a coding agent

Give your agent the v10 migration skill and ask it to migrate the suite to WebdriverIO v10, following this page. The skill is the procedure: what to search for, which codemod to run, and when to stop. This page is the source of truth for each break.

Install it from the project you are upgrading. The [skills CLI](https://skills.sh) reads [`.agents/skills/wdio-v10-migration/SKILL.md`](https://github.com/webdriverio/webdriverio/blob/main/.agents/skills/wdio-v10-migration/SKILL.md) from this repository and writes it into the skill directory of the agents you pick:

```sh
npx skills add webdriverio/webdriverio --skill wdio-v10-migration
```

`--skill wdio-v10-migration` installs this skill. Skills for working on the WebdriverIO repository are marked internal and are not offered. The CLI asks which agents to install for and writes the skill into each agent's project directory. You can also attach that file to the chat.

Strict selectors and bare capability `specs` / `exclude` lists only show up when the suite runs. The skill cannot decide those from the source alone.

## Node.js

WebdriverIO v10 requires Node.js 22.19.0 or later. Node.js 18 and 20 are no longer supported. CI covers Node.js 22, 24, and 26.

## Component tests

The browser runner still runs in Chrome 90, Edge 90, Firefox 90 and Safari 14.1 or newer. See [Browser support](/docs/component-testing#browser-support).

Code passed to `browser.execute` stays at ES2021, so it can run in older browsers under test. That floor did not change.

## Mocha

`@wdio/mocha-framework` and `@wdio/browser-runner` depend on [Mocha 12](https://mochajs.org/blog/mocha-12-stable/). Mocha 12 needs Node.js `^20.19.0 || >=22.12.0`, which is covered by the v10 floor of 22.19.0.

```diff
- mochaOpts: { compilers: ['ts:ts-node/register'] }
+ mochaOpts: { require: ['ts-node/register'] }
```

`mochaOpts.compilers` is gone. Mocha removed the long-deprecated `--compilers` flag, so leftover compiler mappings are ignored. Load transpilers or other setup files with `mochaOpts.require`.

`failHookAffectedTests` defaults to `true`. A failing `before` or `beforeEach` hook fails the tests that hook skipped. Set `mochaOpts.failHookAffectedTests` to `false` to report only the hook.

Use `expect-webdriverio` 8, see [expect-webdriverio 8](#expect-webdriverio-8). Mocha can load that package twice in one process; it shares assertion state across those copies ([expect-webdriverio#2221](https://github.com/webdriverio/expect-webdriverio/pull/2221)).

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

## Jasmine

`@wdio/jasmine-framework` depends on [Jasmine 6](https://jasmine.github.io/upgrade-guides/6.0). Jasmine 6 is tested on Node.js 20, 22, and 24. The v10 floor of 22.19.0 already covers that range.

`jasmineNodeOpts` was removed. Configure Jasmine with `jasmineOpts`. Setting `jasmineNodeOpts` throws:

```text
The option "jasmineNodeOpts" was removed in WebdriverIO v10. Use "jasmineOpts" instead.
```

```diff
- jasmineNodeOpts: { defaultTimeoutInterval: 60000 }
+ jasmineOpts: { defaultTimeoutInterval: 60000 }
```

`jasmineOpts.failFast` is no longer read. Use `jasmineOpts.stopOnSpecFailure`. A leftover `failFast` does not stop the suite. Cucumber's `failFast` is a different option and still works.

```diff
- jasmineOpts: { failFast: true }
+ jasmineOpts: { stopOnSpecFailure: true }
```

`jasmineOpts.stopSpecOnExpectationFailure` was removed. Use `jasmineOpts.oneFailurePerSpec`. Setting the old key throws:

```text
The option "jasmineOpts.stopSpecOnExpectationFailure" was removed in WebdriverIO v10. Use "jasmineOpts.oneFailurePerSpec" instead.
```

```diff
- jasmineOpts: { stopSpecOnExpectationFailure: true }
+ jasmineOpts: { oneFailurePerSpec: true }
```

Jasmine's sync matchers are synchronous again. In v9, the global `expect` was Jasmine's `expectAsync`, so `expect(1).toBe(1)` returned a promise. In v10, Jasmine's built-in matchers and the matchers you add with `jasmine.addMatchers` return `undefined`. WebdriverIO matchers, Jasmine's async matchers and `jasmine.addAsyncMatchers` matchers still return a promise, so continue to `await` them. You do not need to change `await expect($('#logo')).toBeDisplayed()` to `expectAsync()`: the global `expect` sends WebdriverIO matchers to `expectAsync` for you. `await expect(1).toBe(1)` continues to work.

A failed sync assertion without `await` now fails the spec. In v9, it was a rejected promise: if nothing awaited it, the spec could pass, with only an unhandled rejection in the log. After the upgrade, look at the specs that start to fail. They had a hidden failure in v9, and the fix is in the test or in the application, not in the `expect` call:

```js
it('saves the form', async () => {
    const onSave = jasmine.createSpy('onSave')
    await submitForm(onSave)
    // v9: passed even when `onSave` was not called
    // v10: fails when `onSave` was not called
    expect(onSave).toHaveBeenCalled()
})
```

The result of a sync matcher is now `undefined`, so `.then()` or `.catch()` on it throws a `TypeError`:

```diff
- expect(total).toBe(3).then(() => log('ok'))
+ expect(total).toBe(3)
+ log('ok')
```

Other effects of this change:

- `oneFailurePerSpec` now stops the spec at its first failed assertion: at once for a sync matcher, and when the promise settles for an awaited async matcher.
- Jasmine's spy matchers work without `await`. In v9, `toHaveBeenCalled`, `toHaveSpyInteractions` and `toHaveNoOtherSpyInteractions` failed with "Does not take arguments", and an uncalled spy passed without `await`.
- `jasmine.addMatchers` is no longer replaced, so Jasmine does not show its "Monkey patching detected" warning anymore.

`toHaveSize` has two meanings. On a WebdriverIO value, it is the WebdriverIO matcher and checks the size of the element: an element, an element array or `Element[]` (for example the result of `$$().filter()`), a multi-remote element, a browser, a browsing context, a mock, the `some()` wrapper, or a promise such as a chainable `$()`. On any other value, it is Jasmine's matcher and checks the length. In v9, Jasmine's matcher always ran.

```js
expect([1, 2]).toHaveSize(2)                                   // Jasmine, sync
await expect($('#logo')).toHaveSize({ width: 32, height: 32 }) // WebdriverIO, async
```

The types follow the same rules. `@wdio/jasmine-framework` now types the global `expect` with Jasmine's matchers, plus the WebdriverIO matchers and the Jasmine async matchers, which return a promise. Remove `expect-webdriverio/jasmine-wdio-expect-async` from `types` in your `tsconfig.json`, because it types every matcher as async. Add `jasmine` if it is not there:

```diff title="tsconfig.json"
 {
     "compilerOptions": {
-        "types": ["node", "@wdio/globals/types", "expect-webdriverio/jasmine-wdio-expect-async", "@wdio/jasmine-framework"]
+        "types": ["node", "jasmine", "@wdio/globals/types", "@wdio/jasmine-framework"]
     }
 }
```

`expect.oneOf()` now also works in Jasmine specs. Before, it had a type but was not on the Jasmine `expect` at runtime.

## expect-webdriverio 8

`@wdio/globals`, `@wdio/runner` and `@wdio/browser-runner` require `expect-webdriverio` 8 as a peer dependency. In v9, it was `expect-webdriverio` 7. If your `package.json` lists `expect-webdriverio`, update it to version 8 in the same change as the `@wdio/*` packages.

`expect-webdriverio` 8 has its own breaking changes. Its [v7 to v8 migration guide](https://github.com/webdriverio/expect-webdriverio/blob/main/docs/Migrations.md#migration-guide-v7-to-v8) lists each change and its replacement. These changes are the most likely to affect a test suite:

- `toHaveText` on `$$()` compares the elements index by index. An expected array in another order than the page fails. Use the page order, `expect.oneOf()` or `expect.arrayContaining()`.
- An array of expected values on a single element fails `toHaveText`, `toHaveHTML`, `toHaveComputedLabel` and `toHaveComputedRole`. Use `expect.oneOf()`.
- `setFeatureFlags()` and the `featureFlags` option were removed.
- These deprecated APIs were removed: `setOptions` (use `setDefaultOptions`), `getConfig` (use `getDefaultOptions`), `matchers` (use `wdioCustomMatchers`), `toHaveAttr` (use `toHaveAttribute`), `toHaveClass` (use `toHaveElementClass`), `toBeRequestedWithResponse()` (use `toBeRequestedWith({ response })`), and `expect-webdriverio/types` (use `expect-webdriverio/expect-global`).
- The `beforeAssertion` and `afterAssertion` hooks get the name of the alias that the test called, for `toBeExisting`, `toBePresent`, `toHaveLink`, `toHaveValue` and `toBeRequested`. In v9, they got the name of the matcher behind the alias, for example `toExist` for `toBeExisting`.
- On a multi-remote browser, give the result of `$$()` to `expect`. A plain array such as `[...elements]`, `Array.from(elements)` or the result of `custom$$()` is not recognized as elements, and the assertion fails.

On a multi-remote browser, one assertion checks every instance, and `expect.multiRemote()` gives one expected value per instance. See [Multiremote assertions](/docs/multiremote#assertions).

## Multi-remote Global

The lowercase `multiremotebrowser` global was removed, from `@wdio/globals` and from the globals of `eslint-plugin-wdio` too. Use `multiRemoteBrowser`.

```diff
- import { multiremotebrowser } from '@wdio/globals'
+ import { multiRemoteBrowser } from '@wdio/globals'
```

## Capabilities

`specs` and `exclude` in capabilities are no longer read. Use `wdio:specs` and `wdio:exclude`.

```diff
  capabilities: [{
      browserName: 'chrome',
-     specs: ['./test/specs/chrome/**/*.js'],
-     exclude: ['./test/specs/chrome/skip.js']
+     'wdio:specs': ['./test/specs/chrome/**/*.js'],
+     'wdio:exclude': ['./test/specs/chrome/skip.js']
  }]
```

The top-level config keys stay `specs` and `exclude`. A leftover bare list on a capability does not select files for that capability. The capability then uses the top-level `specs` and `exclude`.

The `tunnelIdentifier` and `parentTunnel` aliases were removed from the Sauce Labs options types. Use `tunnelName` and `tunnelOwner`.

## TypeScript

The `Element`, `MultiRemoteBrowser` and `MultiRemoteElement` types exported by `webdriverio` were removed. Use the global `WebdriverIO` namespace.

```diff
- import type { Element } from 'webdriverio'
- const elem: Element = await $('#foo')
+ const elem: WebdriverIO.Element = await $('#foo')
```

Published packages set `typeScriptVersion` to 6.0.3, matching the TypeScript version this repository compiles with.

`browser.mock()` accepts the `URLPattern` of `urlpattern-polyfill` and the native `URLPattern` (global in Node.js 24, and typed by the `dom` library of TypeScript 6).

TypeScript 6 deprecates `"moduleResolution": "node"` and `"baseUrl"`, and makes `strict` the default. `create-wdio` now generates `"moduleResolution": "bundler"` for ESM projects and `"NodeNext"` for CommonJS projects. If you update TypeScript in an existing project, change these options in your `tsconfig.json`.

For an ESM project:

```diff title="tsconfig.json"
 {
     "compilerOptions": {
-        "moduleResolution": "node",
+        "moduleResolution": "bundler",
         "module": "ESNext"
     }
 }
```

For a CommonJS project, use `NodeNext` for both options, as `create-wdio` does:

```diff title="tsconfig.json"
 {
     "compilerOptions": {
-        "moduleResolution": "node",
-        "module": "CommonJS"
+        "moduleResolution": "NodeNext",
+        "module": "NodeNext"
     }
 }
```

TypeScript 6 also changes the default of `types` to `[]`, so it no longer loads every installed `@types/*` package. If your `tsconfig.json` has no `types` list, globals such as Mocha's `describe` and `it` fail with `Cannot find name`. List the type packages that your tests use, as `create-wdio` does. For example, with Mocha:

```diff title="tsconfig.json"
 {
     "compilerOptions": {
+        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
     }
 }
```

`npm create wdio@latest` writes `compilerOptions.target` and `compilerOptions.lib` as `es2024`. Type-checking that file needs TypeScript 5.7 or newer. `tsx`, which runs the config and the tests, does not type-check, so an older compiler only matters when you run `tsc` yourself.

An existing `tsconfig.json` is not rewritten. A generated config that extends another config keeps the `target` and `lib` of the parent.

In the `afterAssertion` hook, the type of `params.result` is now `{ pass, message }`, as the matchers give it. In v9, the type was `{ result, message }`, but `params.result.result` was always `undefined` at runtime. Read `params.result.pass`:

```diff
  afterAssertion (params) {
-     console.log(params.matcherName, params.result.result)
+     console.log(params.matcherName, params.result.pass)
  }
```

`pass` is `true` when the value matches the expected value, also with `.not`. Thus with `.not`, the assertion passes when `pass` is `false`. The hook does not tell if the test used `.not`.

## Reporters

The browser `result` event is forwarded to reporters as `client:afterCommand`. That payload and the `AfterCommandArgs` type no longer have a `name` property. Read `command` instead. Custom commands already sent `command`.

```diff
  onAfterCommand(args) {
-     console.log(args.name)
+     console.log(args.command)
  }
```

### Allure

`addEnvironment(name, value)` on `@wdio/allure-reporter` was removed. It had no effect. Set environment rows with [`reportedEnvironmentVars`](/docs/allure-reporter) in the Allure reporter options.

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

- `$$` still returns zero or many elements. Since v10 that list is an [`ElementArray`](/docs/api/browser/$$): a real array you can `await`, with `for await` and async `map` / `filter` available before it resolves. `await $$('button').length` is the count. `$$('button').length > 0` is not, because `length` is a promise until the list resolves. `for (const el of $$('button'))` throws until you have awaited the list; use `for await`, or `for...of` after `await`.
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

## `uploadFile`

`browser.uploadFile()` is removed. It zipped a local file and posted it to the Selenium `file` endpoint, which is not part of WebDriver or WebDriver BiDi. Set a file input with [`element.setFiles()`](/docs/api/element/setFiles).

```diff
- const remotePath = await browser.uploadFile('/path/to/file.png')
- await $('#file-upload').setValue(remotePath)
+ await $('#file-upload').setFiles('/path/to/file.png')
+ await $('#file-upload').setFiles(['/path/to/a.png', '/path/to/b.png'])
```

`setFiles` needs a BiDi session. The paths are opened by the browser. A relative path is resolved against `process.cwd()`. Selenium Grid file staging is not part of v10. A suite that depended on `uploadFile` to push bytes to a node has to put the file where the browser can read it, then call `setFiles`.

On a classic local session, `element.setValue('/local/path')` still types a path the local browser can already see. The raw Selenium endpoint remains `browser.file()` for Grid users who call it directly.

## `executeAsync`

`browser.executeAsync` and `element.executeAsync` are removed. Pass an `async` function to [`execute`](/docs/api/browser/execute). The function's return value, including a returned promise, is the command result. The `script` timeout still applies.

```ts
const result = await browser.execute(async (a, b) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return a + b
}, 1, 2)
```

Drop the WebDriver `done` callback. A string script that expected that callback as its last argument has to return a promise instead. At runtime, `executeAsync` is not a function.

## `switchToFrame`

`browser.switchToFrame` is no longer a public command.

In a WebDriver BiDi session, `switchFrame` and `switchWindow` throw. A tab, a window, and a frame are a `WebdriverIO.BrowsingContext` you hold. `browser.url()` navigates the session's initial top-level context and returns it. `browser.newWindow()` returns the new context and does not switch to it. `context.frame()` returns a child frame. `context.parent` is the frame you opened it from.

```ts
const page = await browser.url('https://example.com')
const other = await browser.newWindow('https://webdriver.io', { type: 'tab' })
console.log(await page.getTitle())
const frame = await page.frame('iframe')
console.log(await frame.$('h1').getText())
const pages = await browser.browsingContexts()
```

`context.url` is the document URL string. Navigate a held context with `context.navigate(url)`. Load metadata from `browser.url()` is `context.request`.

In a Classic session, keep calling `switchFrame` with an element, or `null` for the top frame. A string or a function is rejected there.

```diff
- await browser.switchToFrame(await $('iframe'))
- await browser.switchToFrame(null)
+ await browser.switchFrame($('iframe'))
+ await browser.switchFrame(null)
```

## `setTimeout`

The JSON Wire Protocol key `page load` is rejected. Use `pageLoad`.

```diff
- await browser.setTimeout({ 'page load': 10000 })
+ await browser.setTimeout({ pageLoad: 10000 })
```

`implicit` and `script` are unchanged.

## Multi-remote instance access

A multi-remote browser no longer stores each session as its own property. The same is true for a multi-remote element. `getInstance` and `select` are how you address one session.

```diff
- await browser.myChromeBrowser.url('https://webdriver.io')
- await (await browser.$('button')).myChromeBrowser.click()
+ await browser.getInstance('myChromeBrowser').url('https://webdriver.io')
+ await (await browser.$('button')).getInstance('myChromeBrowser').click()
```

A TypeScript augmentation that adds `myChromeBrowser: WebdriverIO.Browser` to `WebdriverIO.MultiRemoteBrowser` no longer matches a runtime property. Delete that augmentation and call `getInstance`.

With the testrunner and `injectGlobals` left on, the instance name is still a global (`myChromeBrowser.url(...)`). That global is the single session. It is not `browser.myChromeBrowser`.

Command results stay in capability order: the first entry belongs to the first key in the capabilities object.

`browser.$$()` on a multi-remote browser returns a `WebdriverIO.MultiRemoteElementArray`, not a plain `MultiRemoteElement[]`. It is still an array, so an index read such as `elements[0]` keeps working. `custom$$` and `react$$` still return one result per instance. They are not zipped into one array.

`WDIO_ENABLE_MULTI_REMOTE_SELECT` and `WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY` have been removed. `select()` is always available, and `$$()` always returns the element array above. Delete both variables.

## Binary mock responses

`mock.respond()` and `mock.respondOnce()` accept `Uint8Array` and `ArrayBuffer` payloads, including a polyfilled `Buffer` in component tests without a global `Buffer`.

`mock.getBinaryResponse()` is now typed as `Uint8Array | null`. It still returns a `Buffer` in Node.js, but returns a `Uint8Array` in the browser. To use Buffer-specific methods in Node.js, convert a non-null result first:

```diff
- const base64 = mock.getBinaryResponse(requestId)?.toString('base64')
+ const bytes = mock.getBinaryResponse(requestId)
+ const base64 = bytes === null ? undefined : Buffer.from(bytes).toString('base64')
```

## Multi-remote network mocks

`browser.mock()` on a multi-remote browser returns a `WebdriverIO.MultiRemoteMock`, not an array of mocks. `respond`, `restore`, and the other mock methods run on every instance. Read captured requests from the mock for one browser. Use the `WebdriverIO.MultiRemoteMock` type from the global `WebdriverIO` namespace.

```diff
- const [chromeMock, firefoxMock] = await browser.mock('*/api')
- expect(chromeMock.calls).toHaveLength(1)
+ const mock = await browser.mock('*/api')
+ mock.respond({ ok: true })
+ expect(mock.getInstance('myChromeBrowser').calls).toHaveLength(1)
+ expect(mock.instances).toEqual(['myChromeBrowser', 'myFirefoxBrowser'])
```

`getInstance` throws `Multi-remote object has no instance named "<name>"` when the name is not one of `instances`. A mock from `browser.select('myFirefoxBrowser', 'myChromeBrowser')` lists those instances in that order, which can differ from `browser.instances`. Do not assume `mocks[0]` is a particular browser.

## Mock responses that skip the backend

`mock.respond(..., { fetchResponse: false })` does not call the backend. In v9, a mock that also filtered on `statusCode` or `responseHeaders` ignored that filter and still answered every matching request. In v10, `respond()` and `respondOnce()` throw, because those filters can only be decided from the backend response.

```diff
- const mock = await browser.mock('**/users', { statusCode: 200 })
- mock.respond({ name: 'Ada' }, { fetchResponse: false })
+ const mock = await browser.mock('**/users')
+ mock.respond({ name: 'Ada' }, { fetchResponse: false })
```

To keep the filter, omit `fetchResponse` so the mock fetches the response, checks the status or headers, and then replaces the body.

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

## Component testing

`@wdio/browser-runner` re-exports `fn`, `spyOn` and the mock types from `@vitest/spy` 5 (previously 3). A mock that your code calls with `new` needs a `function` or `class` implementation. An arrow function throws `is not a constructor`, and `mockReturnValue` throws when the mock is called with `new`.

```diff
- const Client = fn(() => ({ close: fn() }))
+ const Client = fn(function () { return { close: fn() } })
```

For other spy changes, see the [Vitest migration guide](https://vitest.dev/guide/migration).

## Puppeteer

`webdriverio` accepts `puppeteer-core` `>=24 <26`, including Puppeteer 25. `getPuppeteer()` and `@wdio/lighthouse-service` are tested against that line.

## ESLint

`eslint-plugin-wdio` requires ESLint 10. ESLint 9 reached [end of life](https://eslint.org/version-support/) on 2026-08-06 and is no longer supported. With TypeScript, use `typescript-eslint` 8.56.0 or later.

```sh
npm install --save-dev eslint@10 eslint-plugin-wdio
```

`eslint-plugin-wdio` exports only the flat config `flat/recommended`. The eslintrc name `plugin:wdio/recommended` is removed.

```js
import { configs as wdioConfig } from 'eslint-plugin-wdio'

export default [
    wdioConfig['flat/recommended'],
]
```

The recommended config switches to the type-aware `wdio/no-floating-promise` rule, in place of `wdio/await-expect`, when the `typescript-eslint` package is installed. Installing only `@typescript-eslint/eslint-plugin` is not enough.

```sh
npm install --save-dev typescript typescript-eslint
```

In that mode, the config parses every file it matches with the TypeScript project service. Limit it to TypeScript files, and make sure they are part of a `tsconfig.json`:

```js
import { configs as wdioConfig } from 'eslint-plugin-wdio'

export default [
    { files: ['**/*.{ts,mts,cts,tsx}'], ...wdioConfig['flat/recommended'] },
]
```

A matched JavaScript file that is not in the TypeScript project, such as `wdio.conf.js`, fails with "was not found by the project service". To lint JavaScript files too, set `"allowJs": true`, add them to `include` in `tsconfig.json`, and widen the pattern to `**/*.{js,mjs,cjs,ts,mts,cts,tsx}`.

## Custom frameworks

`setupExpect` on a custom framework adapter no longer accepts a `Map` of matchers, and the runner no longer adds an `entries` method to the matchers object. Iterate with `Object.entries(wdioMatchers)`.

## Firefox profile

`@wdio/firefox-profile-service` no longer treats `legacy` as a service option. That flag only applied to Firefox 55 and older. Delete it. A leftover `legacy: true` is written into the profile as a preference named `legacy`.

## WebDriver protocol

Every session is a [W3C WebDriver](https://w3c.github.io/webdriver/) session. WebdriverIO does not speak the JSON Wire Protocol or the Mobile JSON Wire Protocol. v9 removed those commands. v10 also drops the response envelope those protocols used, so a server that still returns it cannot start a session.

`browser.isW3C` is removed, including the value previously forwarded on the worker `sessionStarted` message. Passing `isW3C` to `attach` is ignored. The BiDi command set stays on the client. A live BiDi connection still depends on `webSocketUrl`.

### `browser.back()` and `browser.forward()` on BiDi

Call sites stay `await browser.back()` and `await browser.forward()`. Neither command takes an argument or returns a value.

On a BiDi session these commands call `browsingContext.traverseHistory` with `delta` `-1` or `1` on the top-level browsing context, then wait for the document readiness `pageLoadStrategy` maps to. `none` returns when the traversal command is accepted. `eager` waits for `browsingContext.domContentLoaded`. `normal`, the default, waits for `browsingContext.load`. A back-forward cache restore does not emit those events; the command returns when the committed document's `readyState` already matches the strategy. The wait uses the session page-load timeout (`timeouts.pageLoad`, 300000 ms when unset). Classic sessions still post to `POST /session/:sessionId/back` and `POST /session/:sessionId/forward`.

A missing history entry still rejects. On BiDi the message comes from `browsingContext.traverseHistory` and contains `no such history entry`, rather than the classic WebDriver error text. A traversal that never reaches the expected readiness rejects with `History traversal timed out after <ms>ms waiting for browsingContext.domContentLoaded` or `browsingContext.load`.

### New session response

Create Session must return the W3C body. WebdriverIO reads `value.sessionId` and `value.capabilities`:

```json
{
  "value": {
    "sessionId": "8e8a5c2e",
    "capabilities": {
      "browserName": "chrome",
      "browserVersion": "131.0.6778.85"
    }
  }
}
```

A JSON Wire Protocol body is rejected. That body puts `sessionId` and `status` next to `value`, and puts the capabilities in `value` itself:

```json
{
  "sessionId": "8e8a5c2e",
  "status": 0,
  "value": {
    "browserName": "chrome",
    "version": "131.0"
  }
}
```

Session creation then throws `WebDriver new session response is missing a session id or capabilities. WebdriverIO requires a W3C WebDriver server.` The same error is raised when `value.capabilities` is missing, even if `value.sessionId` is present.

A flat capability object in your config is still valid. WebdriverIO wraps `{ browserName: 'chrome' }` into `alwaysMatch` before it sends the request. Vendor-prefixed keys mixed with keys outside the W3C capability set are still rejected. Put vendor settings in `sauce:options`, `bstack:options`, `appium:options`, or another prefixed key.

### Command responses

A command result is `{ "value": … }`. HTTP 200 with no `error` in `value` is success. A missing element is HTTP 404 with `value.error` set to `"no such element"`, which still allows a lazy element lookup. A numeric `status` on the body is ignored, including `status: 0` and the old `status: 7` ("no such element") code. Send the W3C error object instead.

The exported error type `JSONWPCommandError` is now `SessionRequestError`.

### Servers

The drivers WebdriverIO runs against already speak W3C on the client connection:

- ChromeDriver has been W3C by default since Chrome 75. Chromium-based Edge matches it. Current ChromeDriver still accepts `goog:chromeOptions.w3c: false`, which switches that one session back to the legacy protocol. WebdriverIO does not support that switch.
- geckodriver and Apple's safaridriver are W3C-only. A Safari response that omits `platformName` or `browserVersion` is still W3C.
- Selenium 4 and Grid 4 speak W3C. Grid stopped translating the JSON Wire Protocol in 4.9.
- Appium 2 dropped the JSON Wire Protocol and the Mobile JSON Wire Protocol. Appium 3 also dropped the leftover parameter shapes. v10 requires Appium 3, covered below. A mobile session that omits `setWindowRect` is still W3C; that capability means the device cannot resize a window.

These servers still speak the JSON Wire Protocol and are not supported: Selenium 3, PhantomJS, EdgeHTML (`--jwp`), and WinAppDriver connected to directly. The Appium Windows driver stays supported as a W3C client. It translates commands to WinAppDriver, including Get Element Property to the attribute endpoint. Point WebdriverIO at Appium, not at WinAppDriver's port.

[`@wdio/jsonwp-service`](https://www.npmjs.com/package/@wdio/jsonwp-service) does not make those servers work with v10. Session startup still requires the W3C body above, and command results still ignore a numeric `status`. Stay on WebdriverIO 9 if that server is still required.

`webdriver.remote.sessionid` no longer marks a Selenium standalone session. Selenium Grid 4 is still detected from `se:cdp`.

The `page load` timeout key is covered under [`setTimeout`](#settimeout). Element ids are covered under [Element references](#element-references). On desktop, `[name="..."]` is a CSS selector. The `name` locator strategy remains for mobile sessions.

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

Appium 3 [removed many deprecated base-driver endpoints](https://appium.io/docs/en/latest/guides/migrating-2-to-3/). WebdriverIO no longer exposes client methods for most of those routes (for example `appiumLock`, `touchPerform`, and the Mobile JSON Wire Protocol map). Use W3C Actions, the corresponding mobile command, or a driver `mobile:` execute method instead.

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

`element.getValue()` calls Get Element Property on every session, including Appium 3. On a mobile session it previously called Get Element Attribute.

### `stopRecordingScreen` signature aligned with `startRecordingScreen`

`driver.stopRecordingScreen` now only accepts a single `options` argument, instead of the previous 4 arguments, aligning with `driver.startRecordingScreen`. Move the individual arguments inside an object:

```diff
- driver.stopRecordingScreen('webdriver.io', undefined, undefined, 'POST')
+ driver.stopRecordingScreen({ remotePath: 'webdriver.io', method: 'POST' })
```

## Multi-remote naming

APIs spelled `multiremote` or `Multiremote` are now camelCased / PascalCase as `multiRemote` / `MultiRemote`. The old names are not aliased.

| v9 | v10 |
|----|-----|
| `multiremote()` (`webdriverio`) | `multiRemote()` |
| `WebdriverIO.MultiremoteConfig` | `WebdriverIO.MultiRemoteConfig` |
| `isMultiremote` on the browser, `$` and `$$` results | `isMultiRemote` |
| `Capabilities.RequestedMultiremoteCapabilities` | `Capabilities.RequestedMultiRemoteCapabilities` |
| `Capabilities.WithRequestedMultiremoteCapabilities` | `Capabilities.WithRequestedMultiRemoteCapabilities` |
| `runner.isMultiremote` (reporters) | `runner.isMultiRemote` |
| `Launcher#isMultiremote`, `Launcher#isParallelMultiremote` (`@wdio/cli`) | `isMultiRemote`, `isParallelMultiRemote` |
| `isMultiremote` in `Workers.WorkerMessage`, `WorkerInstance` (`@wdio/local-runner`) and `SpecReporter#getTestLink()` | `isMultiRemote` |
| `browser.multiremoteFetch()` (`@wdio/webdriver-mock-service`) | `browser.multiRemoteFetch()` |

Search for `multiremote` and `Multiremote` (case-sensitive) and replace every match. Allure reports also label multi-remote tests with `isMultiRemote` instead of `isMultiremote`.

## Virtual displays on Linux

`@wdio/xvfb` is replaced by `@wdio/display-server`. Instead of wrapping each worker in `xvfb-run`, the testrunner starts one display server for the whole run, before any service's `onPrepare` hook. It prefers Weston in headless mode and falls back to Xvfb. See [Headless & Display Servers](/docs/headless-and-display-servers) for details.

The options are renamed. The old names still work in v10 but log a deprecation warning, and will be removed in v11. If you set both names, the new one wins:

```diff
- autoXvfb: false,
+ displayServerEnabled: false,
- xvfbAutoInstall: true,
+ displayServerAutoInstall: true,
- xvfbAutoInstallMode: 'sudo',
+ displayServerAutoInstallMode: 'sudo',
- xvfbAutoInstallCommand: 'my-install-command',
+ displayServerAutoInstallCommand: 'my-install-command',
```

`xvfbMaxRetries` and `xvfbRetryDelay` have no effect, and will also be removed in v11. Startup is no longer retried: if Weston fails to start, the testrunner tries Xvfb, and if neither starts, the run continues without a display.

A config that sets one of the four renamed options without its replacement, and doesn't set `displayServer`, keeps using Xvfb as v9 did. Unless it turns the display server off, it also logs `Preferring Xvfb, as v9 did, because the config sets v9 display keys`. Once you rename the options, add `displayServer: 'xvfb'` to keep Xvfb, or leave it out to prefer Weston. In auto mode a custom install command runs for Weston first, and again for Xvfb only if Weston still isn't available or fails to start and Xvfb is still missing, so set `displayServer` to the server it installs to skip the other server's attempt.

Auto-install no longer supports `yum`, which v9 used on hosts without `dnf`. v10 detects `apt-get`, `dnf`, `zypper`, `pacman`, `apk` and `xbps-install` only, so install Xvfb yourself on a `yum`-only host.

An `xvfbAutoInstallCommand` array ran through a shell in v9, so elements such as `&&` or `VAR=value` worked. Arrays now run without a shell under either option name, so use a string for shell syntax.

Other changes you may notice:

- All workers share one display. In v9, each worker had a display of its own. Chrome and Edge pages can now lack focus, see [Window focus](/docs/headless-and-display-servers#window-focus).
- The Xvfb display number isn't fixed. Read it from `DISPLAY` instead of assuming `:99`.
- A host with only `WAYLAND_DISPLAY` set now counts as having a display. v9 ran workers under Xvfb there, since `DISPLAY` was unset. v10 starts nothing, opens browser windows on your compositor, and sets `XDG_SESSION_TYPE`, `GDK_BACKEND` and `ELECTRON_OZONE_PLATFORM_HINT` to `wayland` for the run. To run them under Xvfb as before, unset `WAYLAND_DISPLAY` and set `displayServer: 'xvfb'`.
- The default screen is 1920x1080. v9 used `xvfb-run`'s default, which is 1280x1024 on Debian and Ubuntu and 640x480 on Fedora, RHEL and Arch. To keep the size your baselines use, set `displayServerWidth` and `displayServerHeight` to it.
- Browsers pick Wayland or X11 from the `XDG_SESSION_TYPE` the display server sets. Under Weston, WebdriverIO also adds `--ozone-platform=wayland` to the Chrome and Edge it launches, since Chrome and Edge before 140 (Chrome for Testing before 135) ignore `XDG_SESSION_TYPE`. Weston provides no `DISPLAY`, so if your tests or tools need X11, set `displayServer: 'xvfb'`.
- If you used `XvfbManager` or the `xvfb` instance from `@wdio/xvfb` directly, use `DisplayServerManager` from `@wdio/display-server` instead. Where you ran `xvfb.init()` and wrapped commands in `xvfb-run`, or spawned processes through `ProcessFactory`, start a display and pass its environment to the processes that need it. The example uses Xvfb at 1280x1024, as v9 did on Debian and Ubuntu. On a host where only `WAYLAND_DISPLAY` is set, unset it first, or `startDaemon()` starts nothing:

  ```js
  import { spawn } from 'node:child_process'
  import { once } from 'node:events'
  import { DisplayServerManager } from '@wdio/display-server'

  const manager = new DisplayServerManager({ displayServer: 'xvfb' })
  const daemon = await manager.startDaemon({ width: 1280, height: 1024 })
  // startDaemon() also returns null when a display already exists
  if (!daemon && manager.shouldRun()) {
      throw new Error('Xvfb could not be started')
  }
  try {
      const child = spawn('your-command', { shell: true, stdio: 'inherit', env: { ...process.env, ...daemon?.env } })
      const [code] = await once(child, 'exit')
      process.exitCode = code ?? 1
  } finally {
      await daemon?.stop()
  }
  ```

## Emulation

`browser.emulate()` drives the WebDriver BiDi emulation module for the current top-level browsing context. v9 injected a preload script that patched `navigator.geolocation.getCurrentPosition`, `navigator.userAgent`, `window.matchMedia` and `navigator.onLine`. Those scripts are gone. `browser.emulate('clock', …)` still installs fake timers into the current page and into pages opened afterwards.

A reload is no longer required for the BiDi scopes.

```diff
  await browser.emulate('onLine', false)
- // only `navigator.onLine` changed; traffic still flowed
+ // the browsing context is offline, including fetch, WebSocket and WebTransport
```

- `onLine: false` calls `emulation.setNetworkConditions` with `{ type: 'offline' }`. `true` and restoring the scope clear it. Throughput and latency stay on `browser.throttleNetwork()`.
- `colorScheme` sets the `prefers-color-scheme` media feature, so CSS `@media (prefers-color-scheme)` follows `matchMedia`.
- `userAgent` is the browser user-agent override, not a patched `navigator.userAgent` property.
- `geolocation` uses the browser geolocation stack. A page can still need `browser.setPermissions({ name: 'geolocation' }, 'granted')`. `{ error: 'positionUnavailable' }` reports that error instead of coordinates.
- `colorScheme` and `media` share one media-feature map. The later call replaces the whole map, and restoring either scope clears it.
- `device` sets the user agent, viewport, touch, mobile text layout and viewport meta from the device descriptor. It does not change `screen` or `orientation`.

New scopes are `media`, `locale`, `timezone`, `touch`, `orientation`, `screen`, `viewportMeta`, `textLayout`, `scripting`, `scrollbar` and `forcedColors`. A browser that does not implement a command rejects the call with its own error (`unknown command` or `unsupported operation`). WebdriverIO does not fall back to a preload script or to CDP. If `device` is rejected part way through, the previous user agent, viewport, touch, text layout and viewport meta are put back.

`wdio session emulate` accepts the same scopes. It no longer tells you to reload for an override that applies immediately. `emulate network` presets and `emulate cpu` are unchanged and remain Chromium-only. See [Emulation](/docs/emulation).

## Next steps

- Copy the [migration skill](#migrate-with-a-coding-agent) into the project and ask an agent to apply it.
- [WebdriverIO for Coding Agents](/docs/ai-agents) for writing new v10 tests.
- [Headless and Display Servers](/docs/headless-and-display-servers) when the suite runs on Linux.
