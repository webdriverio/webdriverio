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

1. Use Node.js 22.19.0 or later. Cucumber 13 does not run on Node.js 20, 23, or 25. A project created with `npm create wdio@latest` gets `compilerOptions.target` and `compilerOptions.lib` of `es2024`. Leave an existing `tsconfig.json` unchanged. Type-checking the generated file needs TypeScript 5.7 or newer.
2. Install WebdriverIO 10 for `webdriverio`, `webdriver`, and every `@wdio/*` package in the same change. Leave no v9 package behind.
3. With Mocha, use `expect-webdriverio` 6.1.0 or newer.
4. With Appium, install `appium@^3` and run `appium driver update installed`.
5. With `puppeteer-core`, use `>=24 <26`.
6. Apply the replacements below, then run the [codemod](#codemod) for the legacy command signatures.
7. Run the suite. Strict `$` and bare capability `specs` / `exclude` only show up at runtime.
8. Search the patterns again. A leftover `jasmineNodeOpts` or `tagExpression` throws.

Do not set `strictSelectors: false` unless the user asks to keep the v9 behavior.

## Replacements

| Find | Replace with |
| --- | --- |
| `jasmineNodeOpts` | `jasmineOpts`. Setting the old key throws. |
| `jasmineOpts.failFast` | `jasmineOpts.stopOnSpecFailure`. A leftover `failFast` is ignored. Cucumber's `failFast` stays. |
| `jasmineOpts.stopSpecOnExpectationFailure` | `jasmineOpts.oneFailurePerSpec`. Setting the old key throws. |
| `cucumberOpts.tagExpression` | `cucumberOpts.tags`. Setting the old key throws. |
| `mochaOpts.compilers` | `mochaOpts.require`. A leftover `compilers` list is ignored. |
| `multiremotebrowser` | `multiRemoteBrowser` |
| `browser.isMultiremote`, `isMultiremote` | `isMultiRemote` |
| `multiremote(` | `multiRemote(` |
| `MultiremoteConfig` | `MultiRemoteConfig` |
| capability `specs` / `exclude` | `wdio:specs` / `wdio:exclude`. Top-level config keys stay `specs` and `exclude`. A bare capability list is ignored. |
| Sauce `tunnelIdentifier` / `parentTunnel` | `tunnelName` / `tunnelOwner` |
| `import type { Element }` from `webdriverio` | `WebdriverIO.Element` (also `MultiRemoteBrowser`, `MultiRemoteElement`) |
| `onAfterCommand` argument `name` | `command` |
| `addEnvironment(` | `reportedEnvironmentVars` in the Allure reporter options |
| `addCommand(name, fn, true)` | `addCommand(name, fn, { attachToElement: true })`. A boolean third argument throws. Same for `overwriteCommand`. |
| `getCookies('name')` or `getCookies(['name'])` | `getCookies({ name: 'name' })`. One call filters one name. |
| `getHTML(false)` | `getHTML({ includeSelectorTag: false })` |
| `newWindow` `windowName` / `windowFeatures` | delete them. `type: 'window'` or `type: 'tab'` remains. |
| `startActivity('pkg', '.Activity')` | `startActivity({ appPackage, appActivity })`. Delete `appWaitPackage`, `appWaitActivity`, and `optionalIntentArguments`. |
| `browser.throttle(` | `browser.throttleNetwork(` |
| `touchAction(` | `browser.action('pointer', { parameters: { pointerType: 'touch' } })`, or mobile `tap` / `swipe` |
| `setTimeout({ 'page load': n })` | `setTimeout({ pageLoad: n })` |
| `browser.chromeBrowser.url(...)` on a multi-remote browser | `browser.getInstance('chromeBrowser').url(...)`. The testrunner global `chromeBrowser` is the single session. |
| `const [a, b] = await browser.mock(...)` | `const mock = await browser.mock(...)`, then `mock.getInstance('name')` |
| `element.ELEMENT` | `element.elementId`, or `element['element-6066-11e4-a52e-4f735466cecf']` inside `execute` |
| `executeAsync` | `execute` with an `async` function. See below. |
| `switchToFrame` | `switchFrame` |
| `plugin:wdio/recommended` | `configs['flat/recommended']` from `eslint-plugin-wdio` |
| bare `automationName`, `deviceName`, `appiumVersion` | `appium:automationName`, `appium:deviceName`, `appium:appiumVersion` |
| `autoXvfb` and `xvfb*` | `displayServerEnabled`, `displayServerAutoInstall`, `displayServerAutoInstallMode`, `displayServerAutoInstallCommand`. See the guide for when Xvfb stays the default. |
| `WDIO_ENABLE_MULTI_REMOTE_SELECT` | delete it. `select()` is always on. |
| `WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY` | delete it. `$$()` on a multi-remote browser returns a `WebdriverIO.MultiRemoteElementArray`. |
| firefox-profile `legacy: true` | delete it. A leftover `legacy` is written as a Firefox preference. |
| `wdioMatchers.entries()` in a custom framework | `Object.entries(wdioMatchers)`. The `Map` overload of `setupExpect` is gone. |
| `JSONWPCommandError` | `SessionRequestError` |
| `isW3C` | delete it. Every session is W3C. Passing it to `attach` is ignored. |

Search for `multiremote` and `Multiremote` case-sensitively. Leave the `id: multiremote` permalink, `/docs/multiremote` links, file names, and the Allure historyId key `'multiremote'`.

`browser.$$()` on a multi-remote browser is still an array, so index access keeps working. Annotate it as `WebdriverIO.MultiRemoteElementArray`. `custom$$` and `react$$` still return one result per instance, not one zipped array.

### `executeAsync`

`browser.executeAsync` and `element.executeAsync` are removed. At runtime the call is not a function.

```ts
const result = await browser.execute(async (a, b) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return a + b
}, 1, 2)
```

Drop the `done` callback. Return the value, or return a promise. The `script` timeout still applies.

### `switchToFrame`

`switchToFrame` is not a public command. Use `switchFrame` with an element, or `null` for the top frame. On BiDi, a string can be a frame url or context id. Do not pass a numeric frame index. A BiDi session rejects it.

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
