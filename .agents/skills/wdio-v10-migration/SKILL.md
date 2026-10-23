---
name: wdio-v10-migration
description: >-
  Migrate a test suite from WebdriverIO v9 to v10. Use when the user asks to
  upgrade WebdriverIO, @wdio packages, or an existing v9 config, spec, or page
  object to v10.
---

# Migrate WebdriverIO v9 to v10

The procedure is this file. The explanation is the migration guide. Fetch it and follow it before editing:

https://webdriver.io/docs/v10-migration.md

If this skill and the guide disagree, follow the guide.

## Stop and ask

Stop when one of these is true. Do not pick a workaround on your own.

- A strict `$` matches several elements and the user has not said whether the first match is intentional.
- The suite still needs Selenium 3, PhantomJS, EdgeHTML (`--jwp`), WinAppDriver connected directly, or Appium 1 or 2.
- A cloud account only offers an Appium 2 image.

## Order

1. Use Node.js 22.23.4, 24.22.1 or 26.12.1, or a later release of these lines. Node.js 23 and 25 are not supported. A project created with `npm create wdio@latest` gets `compilerOptions.target` and `compilerOptions.lib` of `es2024`. Leave an existing `tsconfig.json` unchanged. Type-checking the generated file needs TypeScript 5.7 or newer.
2. Install WebdriverIO 10 for `webdriverio`, `webdriver`, and every `@wdio/*` package in the same change. Leave no v9 package behind.
3. If `package.json` lists `expect-webdriverio`, update it to 8. WebdriverIO v9 used 5, 6 or 7. Apply its [v7 to v8 migration guide](https://github.com/webdriverio/expect-webdriverio/blob/main/docs/Migrations.md#migration-guide-v7-to-v8), and from 5 or 6 also its [v5 to v6 migration guide](https://github.com/webdriverio/expect-webdriverio/blob/main/docs/Migrations.md#migration-guide-v5-to-v6): 8 removes the APIs that 5.6.9 to 6.0.0 deprecated. Since 7, a snapshot of `$$()` stores the `outerHTML` of each element: update those snapshots.
4. If `package.json` lists `geckodriver`, `edgedriver` or `safaridriver`, update them to 8, 8 and 3. Check their [upgrade notes](https://github.com/webdriverio/driver#upgrading-to-geckodriver-8-edgedriver-8-and-safaridriver-3). The driver downloads now use `HTTPS_PROXY` and `HTTP_PROXY`: if the project sets a proxy but reaches the driver CDN directly, add that host to `NO_PROXY`. Chrome, Chromium, Firefox and Chromedriver downloads use the proxy only with `proxy-agent` installed or `NODE_USE_ENV_PROXY=1`: if the project downloads browsers behind a proxy, add `proxy-agent` to its dev dependencies. If a Docker image downloads browsers, it needs the `unzip` command (slim images do not have it).
5. With Appium, install `appium@^3` and run `appium driver update installed`.
6. With `puppeteer-core`, use `>=24 <26`.
7. With `eslint-plugin-wdio`, use `eslint@^10`. With TypeScript, install `typescript-eslint` 8.56.0 or later, not only `@typescript-eslint/eslint-plugin`, and scope the config with `files: ['**/*.{ts,mts,cts,tsx}']`. Widen it to JavaScript only when `tsconfig.json` has `allowJs` and includes those files.
8. With TypeScript 6, replace `"moduleResolution": "node"` and remove `"baseUrl"` as the guide shows. If `tsconfig.json` has no `types` list, add one with the type packages the tests use: TypeScript 6 no longer loads `@types/*` by default.
9. Apply the replacements below, then run the [codemod](#codemod) for the legacy command signatures.
10. Run the suite. Strict `$` and bare capability `specs` / `exclude` only show up at runtime.
11. Search the patterns again. A leftover `jasmineNodeOpts` or `tagExpression` throws.

Do not set `strictSelectors: false` unless the user asks to keep the v9 behavior.

## Replacements

| Find | Replace with |
| --- | --- |
| `jasmineNodeOpts` | `jasmineOpts`. Setting the old key throws. |
| `jasmineOpts.failFast` | `jasmineOpts.stopOnSpecFailure`. A leftover `failFast` is ignored. Cucumber's `failFast` stays. |
| `jasmineOpts.stopSpecOnExpectationFailure` | `jasmineOpts.oneFailurePerSpec`. Setting the old key throws. |
| `cucumberOpts.tagExpression` | `cucumberOpts.tags`. Setting the old key throws. |
| a custom reporter, or Allure history, that expects the Cucumber feature uid `<file name>:<line>:<column>` | the uid is `<path from rootDir>:<line>:<column>` (`%`, `:` and `#` in the path are `%25`, `%3A` and `%23`); a feature that starts again in a random grouped run has `<uid>#2`. With `scenarioLevelReporter`, Allure history starts again, and again when `rootDir` or the feature path changes: give config files in other folders the same `rootDir`. |
| `wdio-cucumberjs-json-reporter` | `@wdio/cucumberjs-json-reporter`, also in the `import` of `attach`. Uninstall the old package. `reporters: ['cucumberjs-json']` stays. Scripts that read the JSON files: check the changes in the guide (ids, hooks, doc strings, statuses, retries). |
| `mochaOpts.compilers` | `mochaOpts.require`. A leftover `compilers` list is ignored. |
| a script or report filter that matches `wrappedHook` in a Mocha hook title | the title has the hook description or function name (`"before each" hook: login for "my test"`), or no name for an anonymous hook (`"before each" hook for "my test"`) |
| `this.timeout(ms)` in a Mocha test | keep it. WebdriverIO now follows it (v9 ignored `this.timeout()` inside a test), and `mochaOpts.timeout: 0` turns the timeout off. The `retry` argument does not run a test again after a timeout. For `mochaOpts.parallelMode`, see the guide. |
| New in v10, no migration needed | [parallel tests in a spec file](https://webdriver.io/docs/parallel-tests.md) with `mochaOpts.parallelMode` or `cucumberOpts.parallelMode`. |
| `multiremotebrowser` | `multiRemoteBrowser` |
| `browser.isMultiremote`, `isMultiremote` | `isMultiRemote` |
| `multiremote(` | `multiRemote(` |
| `MultiremoteConfig` | `MultiRemoteConfig` |
| capability `specs` / `exclude` | `wdio:specs` / `wdio:exclude`. Top-level config keys stay `specs` and `exclude`. A bare capability list is ignored. |
| Sauce `tunnelIdentifier` / `parentTunnel` | `tunnelName` / `tunnelOwner` |
| `import type { Element }` from `webdriverio` | `WebdriverIO.Element` (also `MultiRemoteBrowser`, `MultiRemoteElement`) |
| `onAfterCommand` argument `name` | `command` |
| a `beforeCommand` / `afterCommand` hook that expects an element command 2 or 3 times, `[]` as `args`, or an `emit` command | the hooks run once for each element command, with its arguments, and not for `emit`. `beforeCommand` runs before the wait for the element: read the found element in `afterCommand`. |
| `wdio-video-reporter` | `@wdio/video-reporter`. Uninstall the old package. `reporters: ['video']` stays. Install ffmpeg on every machine that runs the tests (also CI and Docker), or set `ffmpegPath`: v10 does not install it. Rename JSON Wire Protocol names in `snapshotCommands` (see the guide). `GET` commands (for example `getUrl`) give no frame. |
| `wdio-html-nice-reporter`, reporter name `html-nice` | `@wdio/html-reporter`, reporter name `html`. Uninstall the old package. `@rpii/wdio-report-events` can become `ReportEvents` from `@wdio/html-reporter`. `lib/makeReport.js` is `build/makeReport.js`. |
| `addEnvironment(` | `reportedEnvironmentVars` in the Allure reporter options |
| `addCommand(name, fn, true)` | `addCommand(name, fn, { attachToElement: true })`. A boolean third argument throws. Same for `overwriteCommand`. |
| `getCookies('name')` or `getCookies(['name'])` | `getCookies({ name: 'name' })`. One call filters one name. |
| `getHTML(false)` | `getHTML({ includeSelectorTag: false })` |
| `newWindow` `windowName` / `windowFeatures` | delete them. `type: 'window'` or `type: 'tab'` remains. |
| `browser.newWindow(url)`, then `browser.<command>` and `browser.closeWindow()` in a BiDi session | `const tab = await browser.newWindow(url)`, with the same options as the original call (in TypeScript, add `as WebdriverIO.BrowsingContext`), then `tab.<command>` and `tab.closeWindow()`. `newWindow` does not switch, so `browser.closeWindow()` closes the first tab. Remove `switchWindow()`: it throws in a BiDi session. |
| `if (value instanceof Promise) value = await value` | `value = await value`. A `$$()` that is not awaited is an array, not a `Promise`. |
| `if (list[i])` or `list.at(i) === undefined` on a `$$()` list, to check that an item exists | `const list = await $$(...)`, then `if (list.length > i)`. An index past the end of a `$$(selector)` list is an element that waits `waitforTimeout`, not `undefined`, also after `await`. After `await`, a negative index and a list from `slice()` or `filter()` give `undefined`. Before `await`, `list[i]` with an integer index of 0 or more, and `at()`, give a truthy promise; `filter()` gives a promise: await it before you read an index. |
| `$$(...).length` without `await` | `await $$(...).length`. Before `await`, `length` is a promise, with no error: `>` and `<` give `false` (an index loop runs 0 times), `if (length)` and `!== 0` give `true`. |
| `startActivity('pkg', '.Activity')` | `startActivity({ appPackage, appActivity })`. Delete `appWaitPackage`, `appWaitActivity`, and `optionalIntentArguments`. |
| `browser.throttle(` | `browser.throttleNetwork(` |
| `browser.uploadFile(path)` then `setValue` | `element.setFiles(path)` or `element.setFiles([paths])`. Needs a BiDi session and a path the browser can read. Grid byte staging is gone. See below. |
| `touchAction(` | `browser.action('pointer', { parameters: { pointerType: 'touch' } })`, or mobile `tap` / `swipe` |
| `setTimeout({ 'page load': n })` | `setTimeout({ pageLoad: n })` |
| `browser.chromeBrowser.url(...)` on a multi-remote browser | `browser.getInstance('chromeBrowser').url(...)`. The testrunner global `chromeBrowser` is the single session. |
| `const [a, b] = await browser.mock(...)` | `const mock = await browser.mock(...)`, then `mock.getInstance('name')` |
| Buffer-specific methods on `mock.getBinaryResponse()` | The result is typed as `Uint8Array \| null`. Check for null, then use `Buffer.from(bytes)` in Node.js before calling Buffer-specific methods. |
| `element.ELEMENT` | `element.elementId`, or `element['element-6066-11e4-a52e-4f735466cecf']` inside `execute` |
| `executeAsync` | `execute` with an `async` function. See below. |
| `switchToFrame` | `switchFrame` |
| `plugin:wdio/recommended` | `configs['flat/recommended']` from `eslint-plugin-wdio` |
| bare `automationName`, `deviceName`, `appiumVersion` | `appium:automationName`, `appium:deviceName`, `appium:appiumVersion` |
| `autoXvfb` and `xvfb*` | `displayServerEnabled`, `displayServerAutoInstall`, `displayServerAutoInstallMode`, `displayServerAutoInstallCommand`. See the guide for when Xvfb stays the default. |
| `WDIO_ENABLE_MULTI_REMOTE_SELECT` | delete it. `select()` is always on. |
| `WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY` | delete it. `$$()` on a multi-remote browser returns a `WebdriverIO.MultiRemoteElementArray`. |
| firefox-profile `legacy: true` | delete it. A leftover `legacy` is written as a Firefox preference. |
| `setOptions(` from `expect-webdriverio` | `setDefaultOptions(`. `getConfig(` is `getDefaultOptions(`, and `matchers` is `wdioCustomMatchers`. |
| `toHaveAttr(` | `toHaveAttribute(` |
| `toHaveClass(` on a WebdriverIO element | `toHaveElementClass(` |
| `toBeRequestedWithResponse(response)` | `toBeRequestedWith({ response })` |
| `setFeatureFlags(` or a `featureFlags` option of `expect-webdriverio` | delete it. `toHaveText` on `$$()` always compares index by index: keep an expected array in page order, or use `expect.oneOf()` or `expect.arrayContaining()`. |
| `toHaveText([...])`, `toHaveHTML([...])`, `toHaveComputedLabel([...])` or `toHaveComputedRole([...])` on a single element | `expect.oneOf(...)` |
| `toHaveElementClass([...])` on a single element | `expect.oneOf(...)` for "has any of these classes"; one `toHaveElementClass` for each class for "has all of them" |
| `expect.arrayContaining(...)` or `expect.arrayOf(...)` on a single element, or with `some()` | use `$$()` without `some()`: the list matcher compares the values of all the elements |
| global `Test`, `TestResult`, `Scenario`, `WdioCustomMatchers` types (no import) | `Frameworks.Test`, `Frameworks.TestResult`, `Frameworks.Scenario` from `@wdio/types`; `ExpectWebdriverIO.Matchers` |
| `expect-webdriverio/types` | `expect-webdriverio/expect-global` |
| `wdioMatchers.entries()` in a custom framework | `Object.entries(wdioMatchers)`. The `Map` overload of `setupExpect` is gone. |
| `JSONWPCommandError` | `SessionRequestError` |
| `GECKODRIVER_FILEPATH` | `GECKODRIVER_PATH`. `geckodriver` 8 ignores the old variable. |
| `isW3C` | delete it. Every session is W3C. Passing it to `attach` is ignored. |

Search for `multiremote` and `Multiremote` case-sensitively. Leave the `id: multiremote` permalink, `/docs/multiremote` links, file names, and the Allure historyId key `'multiremote'`.

## Emulation

`browser.emulate()` for geolocation, user agent, color scheme and online state no longer patches the page with a preload script, and those scopes no longer need a reload. `onLine: false` takes the browsing context offline. `colorScheme` and `media` share one media-feature map. Read the Emulation section of the migration guide before changing tests that depended on the old behavior.

`browser.$$()` on a multi-remote browser is still an array, so index access keeps working. Annotate it as `WebdriverIO.MultiRemoteElementArray`. `custom$$` and `react$$` still return one result per instance, not one zipped array.

### `uploadFile`

`browser.uploadFile` is removed. Replace `uploadFile` plus `setValue` with `element.setFiles`. `setFiles` does not upload bytes. A remote browser needs a path on that machine. On a classic local session, `setValue` with a path the browser can already see still works. `browser.file()` remains for a direct Selenium Grid call.

### `executeAsync`

`browser.executeAsync` and `element.executeAsync` are removed. At runtime the call is not a function.

```ts
const result = await browser.execute(async (a, b) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return a + b
}, 1, 2)
```

Drop the `done` callback. Return the value, or return a promise. The `script` timeout still applies, also in a WebDriver BiDi session (a `script timeout` error). A `script` timeout longer than `bidiResponseTimeout` (180 s by default) needs a longer `bidiResponseTimeout` too.

### `switchToFrame`

`switchToFrame` is not a public command. In a BiDi session `switchFrame` and `switchWindow` throw: hold the `WebdriverIO.BrowsingContext` from `browser.url()` or `browser.newWindow()` and call `context.frame()`. In a Classic session, `switchFrame` takes an element, or `null` for the top frame.

### Strict `$`

`$` throws `StrictSelectorError` when the selector matches more than one element. A selector that matches nothing still returns a lazy element. `waitForExist` and auto-waiting are unchanged.

`$$`, `custom$`, `shadow$`, and `react$` are not strict. An element reference passed to `$` is not checked.

```ts
await $('button[type="submit"]').click()
await $$('button')[0].click()
await $('button', { strict: false }).click()
```

## Codemod

The codemod rewrites boolean `addCommand` / `overwriteCommand`, boolean `getHTML`, and `getCookies` when the filter is a string or a one-element array. It does not rewrite strict selectors. Install it first. WebdriverIO does not depend on it.

```sh
npm install jscodeshift @wdio/codemod
npx jscodeshift -t ./node_modules/@wdio/codemod/v10 ./e2e/
```

Use `--parser=tsx` for TypeScript files.

## Verify

Run the project's typecheck and one real `wdio` run of the specs you changed. A unit test of the app under test is not that proof.

If `outputDir` is set and `wdio.log` starts with NUL bytes or misses its first lines, a second copy of `@wdio/logger` emptied it. Run `npm ls @wdio/logger`: every copy must be 10. Update the package that brings version 9.

After the run, these strings mean a leftover, not a product bug:

```text
The option "jasmineNodeOpts" was removed in WebdriverIO v10.
The option "jasmineOpts.stopSpecOnExpectationFailure" was removed in WebdriverIO v10.
The option "tagExpression" was removed.
Passing a boolean as the third argument to `addCommand` was removed in WebdriverIO v10.
Passing a string or string array to `getCookies` was removed in WebdriverIO v10.
Passing a boolean to `getHTML` was removed in WebdriverIO v10.
The `page load` timeout key was removed in WebdriverIO v10.
strict mode violation
WebDriver new session response is missing a session id or capabilities.
```
