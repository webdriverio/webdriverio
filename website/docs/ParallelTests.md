---
id: parallel-tests
title: Parallel Tests in a Spec File
description: "Run the Mocha tests or Cucumber scenarios of one spec file at the same time, each in its own WebDriver BiDi browsing context, with mochaOpts.parallelMode or cucumberOpts.parallelMode, a form of browser pooling similar to Playwright's fullyParallel."
---

Since v10, WebdriverIO can run the tests of one spec file at the same time. Every Mocha `it()` or Cucumber scenario gets its own browser window (a WebDriver BiDi [browsing context](https://w3c.github.io/webdriver-bidi/#browsing-context)) in one worker and one browser session. Use it for spec files with many independent tests: they finish faster, and you don't need more worker processes or browser sessions, because each test only pays for opening a window.

It is a form of browser pooling: the tests share a pool of windows in one browser, not a pool of browsers. If you come from Playwright, `parallelMode: 'userContexts'` is the closest equivalent of [`fullyParallel: true`](https://playwright.dev/docs/test-parallel#parallelize-tests-in-a-single-file): every test gets its own isolated context. The difference is that Playwright spreads the tests of a file across worker processes, each with its own browser, while WebdriverIO runs them at the same time in one worker and one browser.

This is separate from [`maxInstances`](./OrganizingTestSuites.md), which runs whole spec files in parallel, one worker and one session per spec. You can combine the two: `maxInstances` sets how many spec files run at the same time, and `maxParallelContexts` sets how many tests run at the same time inside each of those files.

:::warning Experimental
Parallel mode requires the experimental `'wdio:experimentalBiDiCommands'` capability, which changes how element commands are implemented in every test, not only parallel ones. See [Behavior changes of the BiDi element commands](#behavior-changes-of-the-bidi-element-commands).
:::

## Enable parallel mode

You need:

- a WebDriver BiDi session (the default, unless you set `'wdio:enforceWebDriverClassic': true`),
- the `'wdio:experimentalBiDiCommands': true` capability,
- `@wdio/mocha-framework` or `@wdio/cucumber-framework`. Jasmine does not support parallel mode.

If the session does not use BiDi, or the capability is missing, WebdriverIO logs a warning and runs the tests one after another. Without `parallelMode`, nothing changes.

### Mocha

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    specs: ['./test/specs/**/*.e2e.ts'],
    maxInstances: 1,
    capabilities: [{
        browserName: 'chrome',
        'wdio:experimentalBiDiCommands': true
    }],
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        parallelMode: 'contexts',
        maxParallelContexts: 4
    }
}
```

The spec file needs no changes:

```ts title="test/specs/pages.e2e.ts"
import { browser, $, expect } from '@wdio/globals'

describe('webdriver.io', () => {
    it('shows the API page', async () => {
        await browser.url('https://webdriver.io/docs/api')
        await expect($('h1')).toHaveText('Introduction')
    })

    it('shows the getting started page', async () => {
        await browser.url('https://webdriver.io/docs/gettingstarted')
        await expect($('h1')).toHaveText('Getting Started')
    })
})
```

Both tests run at the same time, each in its own window. `browser.url()`, `$()` and `expect()` act on the window of the test that calls them.

### Cucumber

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    specs: ['./features/**/*.feature'],
    capabilities: [{
        browserName: 'chrome',
        'wdio:experimentalBiDiCommands': true
    }],
    framework: 'cucumber',
    cucumberOpts: {
        require: ['./features/step-definitions/**/*.ts'],
        parallelMode: 'contexts',
        maxParallelContexts: 4
    }
}
```

Every scenario of a feature file runs in its own window. Profiles (`cucumberOpts.profiles`, `cucumberOpts.file`), specs with line numbers (`--spec ./features/login.feature:5`) and the `tags`, `name`, `order`, `strict`, `dryRun`, `failFast`, `retry` and `retryTagFilter` options work like in a sequential run. Features, scenarios, steps and hooks are reported like in a sequential run, also with `ignoreUndefinedDefinitions`, `failAmbiguousDefinitions`, `tagsInTitle` and `scenarioLevelReporter`.

## Options

| Option | Values | Default | Description |
| --- | --- | --- | --- |
| `parallelMode` | `'contexts'`, `'userContexts'` | not set (sequential) | Turns on parallel mode and picks how much tests share. |
| `maxParallelContexts` | number | `os.cpus().length` | How many tests run at the same time. |

Set both in `mochaOpts` or in `cucumberOpts`.

`maxParallelContexts` sets the number of slots. Each slot runs one test at a time, opens the window for its next test while the current test runs, and closes the previous window in the background. Up to 3 × `maxParallelContexts` windows, plus the session's first window, can therefore be open for a short time: each slot can hold one live, one prefetched and one closing window. Parallel mode closes only the windows it opened.

## Choose between `contexts` and `userContexts`

| | `'contexts'` | `'userContexts'` |
| --- | --- | --- |
| Window per test | yes | yes |
| Cookies, `localStorage`, service workers | shared by all tests | isolated per test ([user context](https://w3c.github.io/webdriver-bidi/#user-context)) |
| Login | once, if the tests reuse the session cookie | in every test |
| Driver support | any BiDi browser | needs `browser.createUserContext()` support, otherwise the run fails |

Pick `'contexts'` by default. Pick `'userContexts'` when tests must not see each other's cookies or storage, for example tests that log in as different users. Like `'contexts'`, `'userContexts'` falls back to a sequential run with a warning when the session is not WebDriver BiDi or `'wdio:experimentalBiDiCommands'` is missing from the capabilities. If the driver does not support `browser.createUserContext`, the run fails rather than falling back.

`browser.newWindow()` opens the window in the default user context, so a window opened that way is outside the test's cookie and storage isolation.

## What each test owns

Inside a parallel test, these commands act on the test's own window:

- navigation: `url`, `back`, `forward`, `refresh`, `getUrl`, `getTitle`
- element commands: `$`, `$$`, `shadow$`, `click`, `setValue`, `getText`, the `waitFor*` commands, and others
- `execute`, `actions`, `addInitScript`
- cookies: `getCookies`, `setCookies`, `deleteCookies` use the test's cookie partition
- `mock()`: a mock created in a parallel test only intercepts and records requests of that test's window and its frames, so two tests can mock the same URL
- screenshots: `saveScreenshot`, `takeElementScreenshot`

## Commands that throw in parallel mode

Some commands act on the whole browser or the whole session, so they cannot target a single test's window. Inside a parallel test they throw instead of affecting another test:

| Commands | Why | Use instead |
| --- | --- | --- |
| `getWindowSize`, `setWindowSize` | the OS window is shared | use `browser.setViewport()` to size a test's page. Parallel tests share one OS window |
| `throttleNetwork`, `throttleCPU` | they apply to the whole browser | run those tests without parallel mode |
| `closeWindow`, `switchToParentFrame` | they change the focused window, which all tests share | keep each test in its own window |
| `reloadSession`, `setTimeout` | they change the session that all tests share | call them in the `before` hook in `wdio.conf.ts` |
| `acceptAlert`, `dismissAlert`, `getAlertText`, `sendAlertText` | alerts belong to a browsing context | call them on the context `browser.url()` returns: `const page = await browser.url('https://webdriver.io'); await page.acceptAlert()`. Use `page.acceptAlert(text)` instead of `sendAlertText(text)`. `dismissAlert()` and `getAlertText()` work on the context too |
| `getComputedRole`, `getComputedLabel` | WebDriver BiDi cannot read them | run those tests without parallel mode |

`switchWindow` was removed for all WebDriver BiDi sessions in v10, not only in parallel mode. It throws ``switchWindow` was removed for WebDriver BiDi sessions in WebdriverIO v10. Hold the browsing context returned by `browser.url()` or `browser.newWindow()`, or find one with `browser.browsingContexts()`.`` Keep the context object instead of switching to it.

WebdriverIO dismisses prompts automatically unless something listens to the `dialog` event, so register a listener (`browser.on('dialog', () => {})`) before you answer a prompt from a test.

Every other WebDriver Classic command also throws. Only `status`, `getTimeouts` and `getWindowHandles` are allowed. If a WebdriverIO command falls back to WebDriver Classic in parallel mode without you calling a Classic command, please [report it](https://github.com/webdriverio/webdriverio/issues/new/choose).

## Hooks and timeouts

### Mocha

- `before()` and `after()` in a spec file run **once per test**, not once per `describe`, because every test has its own window. Each test runs `before`, `beforeEach`, the test, `afterEach` and `after` in its window. Put setup that should run once per spec file in the `beforeSuite` / `afterSuite` hooks in `wdio.conf.ts`. These run once, outside any test window.
- Because each test runs its own hooks, a failing hook only affects its own test. A failing `before()` is reported one time for each test, not one time for the `describe`. A failing `beforeEach()` or `afterEach()` does not stop the other tests of the `describe`. In a sequential run, Mocha skips them. With `failHookAffectedTests` (the default), the test that a failed `before()` or `beforeEach()` skips fails with the same text as in a sequential run. Only the hook title can differ: a failed `beforeEach()` names the test of its own window (`"before each" hook for "t2"`), while a sequential run names the first test for all of them.
- Only `mochaOpts.timeout` applies. `this.timeout()` in a test or hook throws, and `it(...).timeout()` or a `describe` timeout is ignored with a warning. See [Mocha timeouts and the WebdriverIO hooks](./Timeouts.md#mocha-timeouts-and-the-webdriverio-hooks).
- `mochaOpts.bail` and Mocha retries are not supported and fail the run: `mochaOpts.retries`, `this.retries(n)` in a `describe` and `it(...).retries(n)`. `this.retries()` in a test or hook throws. The [WebdriverIO retries](./Retry.md) (`it(title, fn, retries)`) work in parallel mode.
- `.only()`, `this.skip()`, `grep`, `fgrep` and `invert` work like in a sequential run.
- `mochaOpts.dryRun`, `forbidPending` and `checkLeaks` do not apply in parallel mode yet: the tests run, a pending test does not fail, and a global leak is not reported.

### Cucumber

- `BeforeAll` / `AfterAll` and the `beforeFeature` / `afterFeature` hooks in `wdio.conf.ts` run once per worker, not once per feature. `beforeFeature` / `afterFeature` receive the uri and feature of the first feature file only, which matters when one worker runs several feature files, for example grouped specs. They run outside any scenario's window, so they must not use commands that need one.
- `Before` / `After`, `BeforeStep` / `AfterStep` and the scenario and step hooks in `wdio.conf.ts` run for every scenario, in that scenario's window.
- `cucumberOpts.strict` defaults to `false` in WebdriverIO. A pending step fails the scenario only with `strict: true`.
- With `failFast`, the scenarios that already run in other windows finish after the first failure. The scenarios that did not start are reported as skipped, as in a sequential run.
- With `ignoreUndefinedDefinitions: true`, an ambiguous step (with `failAmbiguousDefinitions: false`), or a pending step with `strict: true`, fails the run. A sequential run then passes.
- Cucumber formatters (`format`, `formatOptions`, `publish`) don't run, so they write no file.

### Both frameworks

A test's window closes as soon as the test finishes. Don't start timers or promises that keep running after the test ends.

## Behavior changes of the BiDi element commands

`'wdio:experimentalBiDiCommands': true` swaps the implementation of several element commands in every test of the session, sequential or parallel:

- `addValue` and `clearValue` dispatch synthetic DOM events, not trusted key events.
- `getAttribute` follows the WebDriver rules for property and attribute values.
- `click` is sent through the Actions API.

Run your suite once with the capability and without `parallelMode` to find tests that depend on the Classic behavior.

## Reporters

Reporters that extend [`@wdio/reporter`](./CustomReporter.md) report parallel tests under the right suite, and attach a command to the test whose browsing context sent it.

`@wdio/allure-reporter` supports parallel mode with Mocha. It writes a test's result when the test and its `afterEach()` and `after()` hooks end. `before()` and `after()` hooks run once per test in parallel mode, so the report shows their fixtures once per test. With Cucumber, Allure doesn't support parallel mode yet: results, steps and attachments of overlapping scenarios can land under the wrong scenario, so use it with sequential runs.

`@wdio/spec-reporter` doesn't support parallel mode yet: a Mocha `describe` block that comes after another one, or a Cucumber scenario that starts while another one runs, is shown nested under it, and with Cucumber `retry` the passing count can be wrong. The results of the tests and the exit code are correct.

`@wdio/cucumberjs-json-reporter` doesn't support parallel mode yet: steps and attachments of overlapping scenarios can land in the wrong scenario, and the reporter logs a warning. Use it with sequential runs.

`@wdio/html-reporter` supports parallel mode with Mocha and Cucumber. It shows each log, screenshot and video under the test that sent it, also when it comes from a hook or after the test ends.

`@wdio/video-reporter` records each parallel test in its own video. With Cucumber, it does not attach the videos to Allure.

A custom reporter must not assume that a test ends before the next one starts. See [Reporters and parallel tests](./CustomReporter.md#reporters-and-parallel-tests).

## Cloud vendors

Cloud vendors record one video, one set of logs and one test status per browser session. In parallel mode, many tests share that session, so the vendor dashboard can't split the video, logs or pass/fail status by test. `userContexts` also needs the vendor's grid to support `browser.createUserContext` (and `browser.removeUserContext` with Mocha). Parallel mode hasn't been tested on any cloud vendor yet.

We recommend that you leave parallel mode off when you run on a cloud vendor and use [`maxInstances`](./OrganizingTestSuites.md) to run spec files in parallel. To turn it off, remove `parallelMode` from the framework options. If you remove only `'wdio:experimentalBiDiCommands'`, the tests run one after another and every run logs a warning.

## Troubleshooting

### `parallelMode: "contexts" requires 'wdio:experimentalBiDiCommands': true to be set in capabilities`

Add `'wdio:experimentalBiDiCommands': true` to the capability. Without it, the tests run one after another. With Cucumber, the message reads `Parallel mode (cucumberOpts.parallelMode: "contexts") requires "wdio:experimentalBiDiCommands" to be set in capabilities`.

### `... is set but the browser session does not support WebDriver Bidi`

The session uses WebDriver Classic. Remove `'wdio:enforceWebDriverClassic': true` from the capability, or use a browser and driver with WebDriver BiDi support. With Cucumber, the message reads `Parallel mode (cucumberOpts.parallelMode: "contexts") requires a WebDriver Bidi session. Falling back to sequential execution.`

### `parallelMode: "userContexts" requires browser.createUserContext and browser.removeUserContext, which this driver does not support`

The driver cannot create user contexts. Use `parallelMode: 'contexts'` or update the browser and driver. With Cucumber, the message reads `cucumberOpts.parallelMode "userContexts" requires browser.createUserContext, which this driver does not provide. Use a driver with BiDi user context support or set parallelMode to "contexts" (shares cookies and storage between scenarios).`

### `... is not supported inside parallel mode tests because ...` or `... is not supported in parallel mode`

The test called a command from [Commands that throw in parallel mode](#commands-that-throw-in-parallel-mode). Use the alternative from the table.

### `bail is not supported in parallel mode` / `retries is not supported in parallel mode`

Remove `mochaOpts.bail` or `mochaOpts.retries`, or the `this.retries(n)` / `.retries(n)` of the test that the error names, or run the spec file without `parallelMode`. To retry a test in parallel mode, use the [WebdriverIO retries](./Retry.md) (`it(title, fn, retries)`).

### `Suite-level hooks (before()/after()) run once per test in parallel mode`

The spec file has `before()` or `after()` hooks. They run for every test. Move setup that should run only once to `beforeSuite` / `afterSuite` in `wdio.conf.ts`.

## Related pages

- [Organizing Test Suites](./OrganizingTestSuites.md): run spec files in parallel with `maxInstances`
- [Sharding](./Sharding.md): split the suite across machines
- [Frameworks](./Frameworks.md): all Mocha and Cucumber options
- [Automation Protocols](./AutomationProtocols.md): WebDriver BiDi and WebDriver Classic
