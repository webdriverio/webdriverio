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

WebdriverIO v10 requires Node.js 22.23.4, 24.22.1 or 26.12.1, or a later release of these lines. These are the first releases with the [updated CA store](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) for the eMudhra intermediate CA compromise. Node.js 18 and 20 are no longer supported, and Node.js 23 and 25 are not supported. CI covers Node.js 22, 24, and 26.

## Component tests

The browser runner still runs in Chrome 90, Edge 90, Firefox 90 and Safari 14.1 or newer. See [Browser support](/docs/component-testing#browser-support).

Code passed to `browser.execute` stays at ES2021, so it can run in older browsers under test. That floor did not change.

## Mocha

`@wdio/mocha-framework` and `@wdio/browser-runner` depend on [Mocha 12](https://mochajs.org/blog/mocha-12-stable/). Mocha 12 needs Node.js `^20.19.0 || >=22.12.0`, which is covered by the v10 floor of Node.js 22.23.4.

```diff
- mochaOpts: { compilers: ['ts:ts-node/register'] }
+ mochaOpts: { require: ['ts-node/register'] }
```

`mochaOpts.compilers` is gone. Mocha removed the long-deprecated `--compilers` flag, so leftover compiler mappings are ignored. Load transpilers or other setup files with `mochaOpts.require`.

WebdriverIO follows the Mocha timeout: `this.timeout()` in a test or hook, and `mochaOpts.timeout: 0`, which turns the timeout off. In v9, WebdriverIO ignored `this.timeout()` in a test, and from 9.22 `mochaOpts.timeout: 0` failed every test ("Timeout after -3ms"). The `retry` argument of WebdriverIO does not run a test again after a timeout. See [Mocha timeouts and the WebdriverIO hooks](./Timeouts.md#mocha-timeouts-and-the-webdriverio-hooks), also for `mochaOpts.parallelMode`. New in v10: [parallel tests in a spec file](./ParallelTests.md) with `mochaOpts.parallelMode` or `cucumberOpts.parallelMode`.

`failHookAffectedTests` defaults to `true`. A failing `before` or `beforeEach` hook fails the tests that hook skipped. Set `mochaOpts.failHookAffectedTests` to `false` to report only the hook.

A hook title has the description or the name of the hook function, as in Mocha: `"before each" hook: login for "my test"` for `beforeEach('login', fn)` or `beforeEach(function login () {})`, or no name for an anonymous hook: `"before each" hook for "my test"`. In v9 it had `wrappedHook`, the name of the WebdriverIO wrapper. You see this title in the error of a test that a failed hook skipped, and in the names of root-level hooks, for example in Allure.

Use `expect-webdriverio` 8, see [expect-webdriverio 8](#expect-webdriverio-8). Mocha can load that package twice in one process; it shares assertion state across those copies ([expect-webdriverio#2221](https://github.com/webdriverio/expect-webdriverio/pull/2221)).

Mocha 12 changes that can leak through `mochaOpts`:

- `grep` accepts modern RegExp flags.
- `ui` is still `bdd`, `tdd`, `qunit`, or `exports`. Custom interfaces should keep the `*-bdd`, `*-tdd`, or `*-qunit` suffix.
- `parallel` is still unsupported. WDIO owns spec parallelism; Mocha's worker pool will error if you enable it.

Mocha 12 is ESM-first (`"type": "module"`). Programmatic `require('mocha')` still works on Node 22 via `require(esm)`. The WDIO Mocha CLI (`wdio run … --mochaOpts.*`) is unchanged; Mocha's own CLI now uses `util.parseArgs` instead of yargs.

## Cucumber

`@wdio/cucumber-framework` depends on [`@cucumber/cucumber` 13](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300).

Cucumber 13 requires Node.js 22, 24, or 26 or later. It does not run on Node.js 20, 23, or 25. The framework package declares the v10 range, which also excludes Node.js 23 and 25.

```diff
- cucumberOpts: { tagExpression: '@smoke' }
+ cucumberOpts: { tags: '@smoke' }
```

`tagExpression` is not aliased. Setting it throws, so a leftover filter cannot silently run every scenario.

Cucumber 13 no longer exports `Cli`. Programmatic runs go through `runCucumber` from `@cucumber/cucumber/api`, which is what the adapter already uses.

Other Cucumber 13 breaks (ambiguous formatter paths, parallel workers, `BeforeAll` / `AfterAll`) are described in [Cucumber's upgrade guide](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300).

### `strict` and profiles

`cucumberOpts.strict` defaults to `true`, as in Cucumber: a pending step fails the run, and the reporters still show the step as pending. Set `strict: false` to keep the v9 behavior.

Values in a Cucumber profile or configuration file are used: the file in `cucumberOpts.file`, or, without it, Cucumber's default file in the working folder (`cucumber.js`, `.cjs`, `.mjs`, `.json`, `.yaml` or `.yml`). A value in `cucumberOpts` wins over the profile; before, the WebdriverIO defaults (for example `retry: 0`) also won, so a profile could only set a few options. The `require` and `import` lists of the profile are loaded too, together with the ones in `cucumberOpts`. The `paths` and `requireModule` of the profile are not used, and the worker logs a warning: use `specs` and `cucumberOpts.requireModule` (WebdriverIO has its own TypeScript loader). Remove a Cucumber configuration file that you do not use, or set `cucumberOpts.file: false`.

### `BeforeAll` and `AfterAll` hooks

A Cucumber `BeforeAll` / `AfterAll` is now reported as a hook of the feature, passed or failed (before, a failed one was in no report). The browser commands and console logs of its body belong to the hook: those of an `AfterAll` were on the last step of the last scenario before. Allure shows each one as a fixture of the feature (set `disableMochaHooks: true` to hide the passed ones), and `@wdio/json-reporter` lists it in the `hooks` of the feature. WebdriverIO's own `beforeFeature` / `afterFeature` hooks are not reported.

### Feature uid

The uid of a Cucumber feature is the path of the feature file from `rootDir`, not the file name: `features/admin/login.feature:1:1` instead of `login.feature:1:1`. Two feature files with the same name in other folders no longer share a uid. The `parent` and `fullTitle` of a scenario use this uid. `%`, `:` and `#` in the path are encoded as `%25`, `%3A` and `%23`, so `uid.split(':')[1]` is still the line and a `#` only starts a part number. In grouped specs with a random order, a feature that starts again has the suite uid `<uid>#2`.

With `scenarioLevelReporter: true`, the Allure `historyId` comes from `fullTitle`, so the Allure history of each scenario starts again with this change. It also starts again when `rootDir` or the path of the feature file changes. To keep one history for config files in different folders, set the same `rootDir` in each of them.

## Jasmine

`@wdio/jasmine-framework` depends on [Jasmine 6](https://jasmine.github.io/upgrade-guides/6.0). Jasmine 6 is tested on Node.js 20, 22, and 24. The v10 floor of Node.js 22.23.4 already covers that range.

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

`toHaveSize` has two meanings. On a WebdriverIO value, it is the WebdriverIO matcher and checks the size of the element: an element, an element array (including the result of `$$().filter()`), an `Element[]`, a multi-remote element, a browser, a browsing context, a mock, the `some()` wrapper, or a promise such as a chainable `$()`. On any other value, it is Jasmine's matcher and checks the length. In v9, Jasmine's matcher always ran.

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

`expect.oneOf()` and `expect.multiRemote()` now also work in Jasmine specs. Before, they were not on the Jasmine `expect` at runtime.

## expect-webdriverio 8

`@wdio/globals`, `@wdio/runner` and `@wdio/browser-runner` require `expect-webdriverio` 8 as a peer dependency. In v9, it was `expect-webdriverio` 5, 6 or 7. If your `package.json` lists `expect-webdriverio`, update it to version 8 in the same change as the `@wdio/*` packages.

`expect-webdriverio` 8 has its own breaking changes. Its [v7 to v8 migration guide](https://github.com/webdriverio/expect-webdriverio/blob/main/docs/Migrations.md#migration-guide-v7-to-v8) lists each change and its replacement. From `expect-webdriverio` 5 or 6, also read its [v5 to v6 migration guide](https://github.com/webdriverio/expect-webdriverio/blob/main/docs/Migrations.md#migration-guide-v5-to-v6): version 8 removes the APIs that 5.6.9 to 6.0.0 deprecated. Version 7 has no migration guide. It adds multi-remote support, and `toMatchSnapshot()` and `toMatchInlineSnapshot()` on `$$()` now store the `outerHTML` of each element: update those snapshots. These changes are the most likely to affect a test suite:

- `toHaveText` on `$$()` compares the elements index by index. An expected array in another order than the page fails. Use the page order, `expect.oneOf()` or `expect.arrayContaining()`.
- An array of expected values on a single element fails `toHaveText`, `toHaveHTML`, `toHaveComputedLabel`, `toHaveComputedRole` and `toHaveElementClass`. Use `expect.oneOf()`. For `toHaveElementClass`, an array meant "has any of these classes": use `expect.oneOf()`, or one assertion for each class when the element must have all of them.
- A list matcher (`expect.arrayContaining()`, `expect.arrayOf()`) on a single element, or with `some()`, throws an error. On `$$()`, it compares the values of all the elements at once.
- A missing attribute or property never matches, also not a matcher that accepts no value, such as `expect.not.stringContaining()`.
- `URL`, `Set`, `Map` and binary values are compared by their content. An assertion that passed by mistake can now fail.
- The helper types are not global anymore. A file that uses `Test`, `TestResult`, `Scenario` or `WdioCustomMatchers` without an import fails with `Cannot find name`: use `Frameworks.Test`, `Frameworks.TestResult` and `Frameworks.Scenario` from `@wdio/types`, and `ExpectWebdriverIO.Matchers`.
- `setFeatureFlags()` and the `featureFlags` option were removed.
- These deprecated APIs were removed: `setOptions` (use `setDefaultOptions`), `getConfig` (use `getDefaultOptions`), `matchers` (use `wdioCustomMatchers`), `toHaveAttr` (use `toHaveAttribute`), `toHaveClass` (use `toHaveElementClass`), `toBeRequestedWithResponse()` (use `toBeRequestedWith({ response })`), and `expect-webdriverio/types` (use `expect-webdriverio/expect-global`).
- The `beforeAssertion` and `afterAssertion` hooks get the name of the alias that the test called, for `toBeExisting`, `toBePresent`, `toHaveLink`, `toHaveValue` and `toBeRequested`. In v9, they got the name of the matcher behind the alias, for example `toExist` for `toBeExisting`.
- On a multi-remote browser, give the result of `$$()` to `expect`. A plain array such as `[...elements]` or `Array.from(elements)` is not recognized as elements, and the assertion fails.

On a multi-remote browser, one assertion checks every instance, and `expect.multiRemote()` gives one expected value per instance. See [Multiremote assertions](/docs/multiremote#assertions).

## Driver packages

WebdriverIO v10 starts Firefox, Edge and Safari with `geckodriver` 8, `edgedriver` 8 and `safaridriver` 3. In v9, it used `geckodriver` and `edgedriver` 6 or 7, and `safaridriver` 1 or 2. WebdriverIO installs them, so you do not list them yourself. If your `package.json` lists one of them, update it in the same change as the `@wdio/*` packages.

`geckodriver` and `edgedriver` take `@wdio/logger` as a peer dependency, so they log through the logger of your WebdriverIO install. In v9, `geckodriver` and `edgedriver` brought their own copy of `@wdio/logger`, and that second copy emptied the log file in `outputDir`. Run `npm ls @wdio/logger`: every copy should be version 10. A plugin or service that still depends on version 9 has the same effect.

The [driver upgrade notes](https://github.com/webdriverio/driver#upgrading-to-geckodriver-8-edgedriver-8-and-safaridriver-3) list every change. These changes can affect a WebdriverIO project:

- The driver downloads use `HTTPS_PROXY` and `HTTP_PROXY`. In v9, the `geckodriver` and `edgedriver` downloads ignored them. If a proxy is set in your environment but the driver CDN must be reached directly, add its host to `NO_PROXY`.
- `geckodriver` no longer reads `GECKODRIVER_FILEPATH`. Use `GECKODRIVER_PATH`.
- `wdio:edgedriverOptions` and `wdio:safaridriverOptions` accept `spawnOpts`, as `wdio:chromedriverOptions` does.

## Browser downloads

In v9, WebdriverIO extracted the Chrome, Chromium and Chromedriver zip files itself. In v10 it uses the system `unzip` command on Linux and macOS (`tar.exe` or PowerShell on Windows). Slim Docker images, such as `node:24-slim`, do not have it: install it, see [Docker](/docs/docker#images-where-webdriverio-downloads-the-browser).

In v9, the Chrome, Chromium, Firefox and Chromedriver downloads used `HTTPS_PROXY` and `HTTP_PROXY`. In v10 they use them only when `proxy-agent` is installed in your project, or when Node.js runs with `NODE_USE_ENV_PROXY=1`. WebdriverIO logs a warning when a proxy variable is set but the download would ignore it. See [Proxy For Browser And Driver Downloads](/docs/proxy#proxy-for-browser-and-driver-downloads).

## Chrome profile on Windows

In v9, a testrunner worker on Windows gave Chrome the profile folder `wdio-chrome-<worker id>-<time>` in `outputDir` (or the temporary folder) when your capabilities set no `--user-data-dir`. The folder stayed on disk after the run, and two sessions of one worker, for example the instances of a multi-remote worker, could get the same folder.

In v10, WebdriverIO adds no profile folder. ChromeDriver gives each session its own temporary profile in the system temporary folder, also after `reloadSession()`, as on Linux and macOS. To keep a profile, for example its `Crashpad` crash dumps, set your own `--user-data-dir`. WebdriverIO never changes or deletes it. Give each session its own folder: the capabilities in the config file are read once by the launcher, so set the folder in `beforeSession`, which runs in each worker:

```js
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const config = {
    // ...
    beforeSession (config, capabilities) {
        if (!/chrom/i.test(capabilities.browserName ?? '')) {
            return
        }
        const chromeOptions = capabilities['goog:chromeOptions'] ??= {}
        if (chromeOptions.args?.some((arg) => arg.includes('user-data-dir'))) {
            return
        }
        chromeOptions.args = [...(chromeOptions.args ?? []), `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'my-profile-'))}`]
    }
}
```

These folders stay on disk after the run: delete them when you no longer need them.

In a multi-remote config, `capabilities` has one entry for each instance: do the same for each `capabilities[name].capabilities`. With W3C capabilities, use `capabilities.alwaysMatch`.

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

`ChainablePromiseElement` now declares `then`, and `ChainablePromiseArray` declares `then`, `catch` and `finally`. The chainable types describe the value before `await`. They no longer fit the awaited value:

```ts
let elem: ChainablePromiseElement
elem = await $('h1')
// TS2741: Property 'then' is missing in type 'Element' but required in type 'ChainablePromiseElement'.

let elems: ChainablePromiseArray
elems = await $$('li')
// TS2322: Type 'ElementArray' is not assignable to type 'ChainablePromiseArray'.
```

Type the awaited value as `WebdriverIO.Element` or `WebdriverIO.ElementArray`:

```diff
- let elem: ChainablePromiseElement = await $('h1')
- let elems: ChainablePromiseArray = await $$('li')
+ let elem: WebdriverIO.Element = await $('h1')
+ let elems: WebdriverIO.ElementArray = await $$('li')
```

Both chainable types now match `T extends PromiseLike<unknown>`. A conditional type that checks for `PromiseLike` takes another branch for `$()` and `$$()` than in v9. For example, `Awaited<ChainablePromiseElement>` is now `WebdriverIO.Element`, and `Awaited<ChainablePromiseArray>` is `WebdriverIO.ElementArray`.

The properties of a non-awaited `$$()` changed type. They are available at once, before the query resolves, so read them without `await` or `.then()`:

| Property | v9 | v10 |
|---|---|---|
| `selector` | `Promise<Selector>` | `Selector \| undefined` |
| `parent` | `Promise<...>` | the parent, not a promise (see below) |
| `foundWith` | none | the command that found the list, e.g. `$$` or `custom$$` |
| `props` | none | the extra arguments of that command |

```diff
- const selector = await $$('li').selector
+ const selector = $$('li').selector
```

On a chained query such as `$('form').$$('input')`, `parent` is the chainable `$('form')` until the list resolves, and the resolved element after that. Await the list before you use `parent` as an element.

At runtime, `filter()`, `filterSeries()` and `slice()` on a `$$()` list return an element list, not a plain array. The result keeps the `selector`, `foundWith`, `parent` and `props` of the source list. In v9, `filter()` returned a plain array without these properties. The types do not show this yet: `filter()` and `filterSeries()` are declared to return `Promise<WebdriverIO.Element[]>`, and `slice()` returns `WebdriverIO.Element[]`, so TypeScript reports an error when you read these properties on the result.

WebdriverIO does not run the query again for the derived list itself: an index past its end does not wait for more matches, and it never returns an element that the filter excluded. Its members are still the elements of the source query, with their original `selector` and `index`. If a member becomes stale, WebdriverIO fetches it again from the source query at that index, which can be another element if the page changed. Code that re-runs a list's query from the list's properties, for example `parent[foundWith](selector, ...props)`, gets the full list, not the filtered one.

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

## Command hooks

An element command runs the `beforeCommand` and `afterCommand` hooks once, with the arguments of the command. In v9, it ran them 2 or 3 times, and the first call got `[]` as `args`. A command that runs inside another one (for example `getElementText` in `getText`) still has its own pair. The hooks do not run for the `emit` event function. A hook that counts commands or measures their time sees each command once.

For an element command, `beforeCommand` runs before WebdriverIO waits for the element, so the element can still be missing there. `afterCommand` runs after the wait and any retry, with the result or the error of the last try. A hook that needs the found element uses `afterCommand`.

A command changed with `overwriteCommand()`, and a chained query on a promise (`$('a').$('b')`), can still run the hooks more than once.

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

### Cucumber JSON reporter

`wdio-cucumberjs-json-reporter` moved into the WebdriverIO repository as [`@wdio/cucumberjs-json-reporter`](/docs/cucumberjs-json-reporter). The community package is for v9 only: it installs `@wdio/reporter` 9 and `@wdio/logger` 9.

```sh
npm uninstall wdio-cucumberjs-json-reporter
npm install @wdio/cucumberjs-json-reporter --save-dev
```

`reporters: ['cucumberjs-json']` stays the same: WebdriverIO loads `@wdio/cucumberjs-json-reporter` for that name. Replace the imports in your step files:

```diff
- import cucumberJson from 'wdio-cucumberjs-json-reporter'
+ import cucumberJson from '@wdio/cucumberjs-json-reporter'
```

The options are the same. The JSON files follow the Cucumber JSON format more closely. Check the tools and scripts that read them:

- The scenario `id` is `<feature id>;<scenario id>`, and `<feature id>;<rule id>;<scenario id>` for a scenario in a `Rule:`, as in the Cucumber JSON format. Before, the parts had no separator.
- The feature `id` keeps characters such as `:` and `/` (only spaces become `-`), as in the Cucumber JSON format. The names of the JSON files do not change, but a feature part of more than 200 bytes (for example many non-ASCII characters) is cut and ends with a hash (Linux allows 255 bytes in a file name), and a Windows device name such as `con` starts with `_`.
- The feature and scenario `keyword` are the keywords of the file, for example `Scenario Outline` or `Fonctionnalité`, as in the Cucumber JSON format. Before, they were always `Feature` and `Scenario`.
- Scenarios and steps have a `line`.
- Tags are `{ name, line }`, as in the Cucumber JSON format; the tags of a scenario get the line of the feature file. Before, they were internal Cucumber objects with `location`, `id` or `astNodeId` (random at each run), and the tags of a scenario had no line.
- Hooks are steps with `hidden: true` and no `name`. Before, a hook had an empty `name`.
- A doc string argument is `{ content, line }`. Before, it was the text of the doc string.
- A hook that Cucumber skips (after a failed hook, or a hook that returns `'skipped'`) has the status `skipped`, and a hook that returns `'pending'` has `pending`, as in the Cucumber JSON format. Before, they were `passed`.
- The status of an ambiguous step is `ambiguous`, as in the Cucumber JSON format, and its `error_message` lists the matching step definitions. Before, it was `skipped` with no reason, or `failed` with `cucumberOpts.failAmbiguousDefinitions`.
- The status of an undefined step is `undefined`. Before, it was `failed`, or `pending` with `cucumberOpts.ignoreUndefinedDefinitions`.
- A scenario that Cucumber runs again (`cucumberOpts.retry`) has only the steps of its last try. Before, it had the steps of all tries.
- With `cucumberOpts.tagsInTitle`, the feature and scenario names, the ids and the file names have no tags.
- When a worker runs several feature files (grouped specs), the reporter writes one file for each feature. Before, all scenarios went into the file of the first feature.
- In a multi-remote session, the metadata comes from the first instance.

These were missing or wrong before: `*` steps, the keyword of `But` steps, attachments from the WebdriverIO `before` hook, an object attached as `text/plain` (it is JSON text, not `[object Object]`), and a JSON string attached as `application/json` (it stays as it is, it is not encoded a second time). The step keywords follow the `# language:` header of the feature file, then `cucumberOpts.language` (the `language` option of the reporter only when `cucumberOpts.language` is not set). With `cucumberOpts.scenarioLevelReporter: true`, the reporter writes no file and logs a warning: the format needs the steps.

### Video reporter

`wdio-video-reporter` moved into the WebdriverIO repository as [`@wdio/video-reporter`](/docs/video-reporter). The community package is for v9 only: it installs `@wdio/reporter` 9 and `@wdio/logger` 9.

```sh
npm uninstall wdio-video-reporter
npm install @wdio/video-reporter --save-dev
```

The community package installed ffmpeg itself. `@wdio/video-reporter` does not: [install ffmpeg](/docs/video-reporter#install-ffmpeg) on each machine that runs the tests, also in CI and in Docker images, or set the `ffmpegPath` option or the `FFMPEG_PATH` environment variable. Without ffmpeg, the reporter logs a warning and makes no video.

```sh
brew install ffmpeg                                         # macOS
sudo apt-get update && sudo apt-get install -y ffmpeg       # Ubuntu, Debian
winget install --id Gyan.FFmpeg -e                          # Windows
```

`reporters: ['video']` stays the same: WebdriverIO loads `@wdio/video-reporter` for that name. Replace imports from `wdio-video-reporter` with `@wdio/video-reporter`. The options are the same, with these changes:

- `snapshotCommands` uses the last part of the W3C WebDriver endpoints. The old default also listed JSON Wire Protocol names such as `buttonup`, `moveto`, `keys` or `accept_alert`. These names never match a v10 command. Use the names of the [default list](/docs/video-reporter#snapshotcommands), for example `actions`, `value` or `accept`.
- In a WebDriver BiDi session, the reporter also takes a frame after `url`, `back`, `forward`, `refresh` and `actions`.
- In a WebDriver BiDi session, the reporter takes the frames with WebDriver BiDi, and the next command waits for the frame of the command before it (about 50 to 70 ms in Chrome), so that each frame shows the page of its command. Before, in Chrome, a screenshot at the start of a WebDriver BiDi navigation could make the test wait 10 seconds.
- In a multi-remote session, only the commands of the first instance take a frame. Before, the commands of each instance took a frame of the first instance.
- A `GET` command only reads the page, so it gives no frame, except with `recordAllActions`. Before, `getUrl`, `getSize` or `getValue` gave a frame, because the last part of their endpoint (`url`, `rect`, `value`) is in `snapshotCommands`.
- The date in the video file names is `YYYY-MM-DD--HH-MM-SS-mmm` on every machine. Before, it used the locale of the machine.
- `videoFormat` accepts `webm` (the default) and `mp4`. Before, `videoFormat: 'default'` made mp4 videos; now it logs a warning and makes webm videos. Use `videoFormat: 'mp4'`.
- With the Allure reporter, a test without a video no longer gets an empty video attachment.

### HTML reporter

`wdio-html-nice-reporter` moved into the WebdriverIO repository as [`@wdio/html-reporter`](/docs/html-reporter). The old package is for v9 only.

```sh
npm uninstall wdio-html-nice-reporter
npm install @wdio/html-reporter --save-dev
```

The reporter name is `html`. Change the name in `reporters` and the imports:

```diff
- import { ReportAggregator } from 'wdio-html-nice-reporter'
+ import { ReportAggregator } from '@wdio/html-reporter'

  reporters: [
-     ['html-nice', { outputDir: './reports/html-reports/' }]
+     ['html', { outputDir: './reports/html-reports/' }]
  ]
```

The options are the same. Also change these:

- `ReportEvents` comes from `@wdio/html-reporter`. Tests that still use `@rpii/wdio-report-events` work, because both send the same events.
- The command line script is `node_modules/@wdio/html-reporter/build/makeReport.js`. It was `node_modules/wdio-html-nice-reporter/lib/makeReport.js`.
- With Cucumber, the report counts scenarios, not steps, and counts only the last try of a retried scenario.

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

## Element lists before `await`

Since v10, `$$()` returns an [`ElementArray`](/docs/api/browser/$$): a real array that you can `await`. In v9, a `$$()` that you did not await was a promise.

| `$$('li')` before `await` | v9 | v10 |
| --- | --- | --- |
| `instanceof Promise` | `true` | `false` |
| `Array.isArray()` | `false` | `true` |
| `then`, `catch`, `finally` | functions | functions, until the list is loaded |

Until the list is loaded, `length` is a promise, and `[...list]`, `Array.from(list)` and `for...of` throw `Cannot synchronously iterate over an element list that has not resolved yet`.

The same is true for `custom$$`, `shadow$$` and `react$$`, and for `$$()` on a multi-remote browser. A `$()` that you did not await is still a promise.

`await` gives the same list, loaded and without `then`. Then `length` is a number, and `for...of`, `[...list]` and `Array.from()` work. Before `await`, you can use `for await`, an index (`$$('li')[0]`), `at()`, `slice()` and the async iteration methods (`map`, `filter`, `forEach`, ...). These methods give a promise: `await` the result of `filter()` before you read an index.

An index past the end of a `$$(selector)` list is not `undefined`, also after `await`. It is an element that waits for the list to reach that index, as `$$('li')[5]` does before `await`: `isExisting()` gives `false` and a command such as `getText()` throws `Index out of bounds`, both after `waitforTimeout`. In v9, `(await $$('li'))[5]` was `undefined`. So `if (list[5])` is always true, and `list.at(5)` is never `undefined`. Compare the index with `length`, which does not wait:

```diff
  const list = await $$('li')
- if (list[5]) {
+ if (list.length > 5) {
```

After `await`, a negative index, and a list from `slice()` or `filter()`, give `undefined` past the end. Before `await`, `list[i]` with an integer index of 0 or more, and `at()`, give a promise, which is always truthy.

Code that awaits a value only when it is a `Promise`, or that reads `length` without `await`, does not throw. It reads a promise as the length: `list.length > 0` and a loop such as `for (let i = 0; i < list.length; i++)` see `false`, but `if (list.length)` and `list.length !== 0` see `true`. Always `await` the value. `await` on a value that is already loaded gives that value:

```diff
- if (value instanceof Promise) {
-     value = await value
- }
+ value = await value
```

```diff
- if ($$('button').length > 0) {
+ if (await $$('button').length > 0) {
```

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

In a WebDriver BiDi session, `newWindow()` returns the new [browsing context](/docs/api/browsingContext) and does not switch to it. In v9 it switched. Thus `browser.closeWindow()` after `newWindow()` now closes the first tab, not the new one. Run the commands for the new tab on the context that `newWindow()` returns, and close it with `closeWindow()` on that context:

```diff
- await browser.newWindow('https://webdriver.io', { type: 'tab' })
- console.log(await browser.getTitle())
- await browser.closeWindow()
+ const tab = await browser.newWindow('https://webdriver.io', { type: 'tab' })
+ console.log(await tab.getTitle())
+ await tab.closeWindow()
```

In TypeScript, the result type is `WebdriverIO.BrowsingContext | { handle, type }`, because a WebDriver Classic session returns the window handle. In a BiDi session, narrow it: `await browser.newWindow(url, { type: 'tab' }) as WebdriverIO.BrowsingContext`.

The browser stays on the first tab. Remove a `switchWindow()` call that went back to it: `switchWindow` throws in a BiDi session. See [`switchToFrame`](#switchtoframe) for the browsing context model.

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

`browser.executeAsync` and `element.executeAsync` are removed. Pass an `async` function to [`execute`](/docs/api/browser/execute). The function's return value, including a returned promise, is the command result. The `script` timeout still applies, also in a WebDriver BiDi session: a script that runs longer fails with a `script timeout` error. For a `script` timeout longer than [`bidiResponseTimeout`](/docs/configuration#bidiresponsetimeout) (180 seconds by default), increase both.

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

`browser.$$()` on a multi-remote browser returns a `WebdriverIO.MultiRemoteElementArray`, not a plain `MultiRemoteElement[]`. It is still an array, so an index read such as `elements[0]` keeps working.

Its `map`, `filter`, `forEach`, `find`, `findIndex`, `some`, `every` and `reduce` methods are async, as on a `WebdriverIO.ElementArray`, and return a promise, also after `await`. The same is true for the lists that `custom$$()`, `react$$()` and `shadow$$()` return. In v9 these were the sync methods of a plain array:

```diff
  const items = await browser.$$('li')
- const ids = items.map((item) => item.selector)
+ const ids = await items.map((item) => item.selector)
```

`custom$()`, `react$()` and, on an element, `shadow$()`, `nextElement()`, `previousElement()` and `parentElement()` return one `WebdriverIO.MultiRemoteElement`, as `$()` does. In v9 they returned one element per instance in a plain array. Read the element of one browser with `getInstance`:

```diff
- const [chromeHost, firefoxHost] = await browser.custom$('byTestId', 'host')
- await chromeHost.click()
+ const host = await browser.custom$('byTestId', 'host')
+ await host.getInstance('myChromeBrowser').click()
```

`custom$$()`, `react$$()` and, on an element, `shadow$$()` return one `WebdriverIO.MultiRemoteElementArray`, as `$$()` does. In v9 they returned one list per instance in a plain array. Each entry addresses every instance. An instance that finds fewer elements has no element at that index:

```diff
- const [chromeItems, firefoxItems] = await browser.custom$$('byTestId', 'item')
- await chromeItems[0].click()
+ const items = await browser.custom$$('byTestId', 'item')
+ await items[0].getInstance('myChromeBrowser').click()
```

`WebdriverIO.MultiRemoteElement['selector']` has the `Selector` type, as `WebdriverIO.Element['selector']` has. In v9 it had the `string` type, but the value could also be a function or a custom strategy reference. TypeScript code that uses it as a string, for example `element.selector.includes('…')`, must check the type first.

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

With WebDriver BiDi, a script that returns a `NodeList` (for example from `querySelectorAll`) or an `HTMLCollection` (for example `element.children`) now gives a list of element references, as WebDriver Classic does. In v9 it gave raw BiDi values, so `browser.execute` returned objects that are not elements, and a `custom$` or `custom$$` strategy that returned `querySelectorAll(...)` found no element. A workaround such as `Array.from(document.querySelectorAll(...))` still works, and you can remove it:

```diff
  browser.addLocatorStrategy('byCss', (selector) =>
-     Array.from(document.querySelectorAll(selector))
+     document.querySelectorAll(selector)
  )
```

## React selectors

`react$` and `react$$` now work with React 16 to 19, for an app that starts with `createRoot` or with `ReactDOM.render`. Before, `browser.react$` and `browser.react$$` failed with React 18 and later (`Could not find the root element of your application`), and in every version a result could come from the render before the last update, so a component that a state change added was not found.

On a page where React has not rendered a root yet, the commands now wait up to 5 seconds for it before they fail. Before, they failed at once, so an app that started late was not found.

The commands no longer use the [resq](https://github.com/baruchvlz/resq) library, and WebdriverIO no longer installs it. The selector rules do not change (see [React Selectors](/docs/selectors#react-selectors)), with these exceptions:

- `react$` with both `props` and `state` finds a component that matches both. Before, it ignored `props` when `state` was also given.
- `react$$` gives each DOM node once. Before, a higher-order component and its child gave the same element twice in some browsers.
- A fragment that contains a fragment gives one flat list of nodes. Before, `react$` could return a list.
- A filter with a `null` value works. Before, it failed with `Cannot convert undefined or null to object`.
- Without an element scope, the commands search all React roots of the page, in the order of the document, also roots inside other roots and roots in open shadow roots. `react$` gives the first match. Before, they searched only the first root, also one that React had not rendered yet or had unmounted, and did not search shadow roots. On a page with more than one root, `react$$` can now give more elements: to search one root only, call the command on its container, for example `$('#root').react$$('MyComponent')`.
- On the container of a root inside another root, the commands search the inner root. Before, they searched the outer root.
- On the browsing context of a frame, and on an element of a frame, the commands work. Before, the context command failed with `this.executeScript is not a function`, and the element command failed with `Could not find instance of React in given element`.

The internal script `webdriverio/scripts/resq` is removed.

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
