---
id: vitest-framework
title: Vitest Framework
description: "Run Vitest specs with the WDIO testrunner: configure framework 'vitest' and vitestOpts, share setup with globalSetup and setupFiles, and use fixtures, concurrent tests, mocks, snapshots and retries."
---

Use the Vitest framework (`framework: 'vitest'`) when you want Vitest's test API in your WebdriverIO specs, especially [fixtures](pageobjects#page-objects-as-fixtures) with `test.extend` and `test.concurrent`. Vitest schedules the tests, so the testrunner starts no WDIO workers. Mocha stays the default choice for most projects, see [Frameworks](frameworks).

## Installation

```bash npm2yarn
npm install @wdio/vitest-framework @wdio/local-runner vitest --save-dev
```

`vitest` is a peer dependency, so your project and the adapter share one copy. `expect-webdriverio` is installed with the adapter. `npm init wdio` and `wdio install` do not offer Vitest yet, so install the packages and set the framework yourself.

## Configuration

The config below sets every option this guide refers to.

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    runner: 'local',
    framework: 'vitest',
    specs: ['./test/specs/**/*.spec.ts'],
    baseUrl: 'https://the-internet.herokuapp.com',
    maxInstances: 2,
    bail: 1,
    capabilities: [{
        browserName: 'chrome',
        webSocketUrl: true,
        'wdio:experimentalBiDiCommands': true,
        'goog:chromeOptions': { args: ['--headless=new'] }
    }],
    reporters: [['junit', { outputDir: './results' }]],
    vitestOpts: {
        parallelMode: 'contexts',
        maxParallelContexts: 4,
        globalSetup: ['./global-setup.ts'],
        setupFiles: ['./setup.ts'],
        retry: 2,
        testTimeout: 60_000,
        hookTimeout: 120_000,
        sequence: { shuffle: true, seed: 42 },
        reporters: ['default', ['junit', { outputFile: './results/vitest-junit.xml' }]]
    },
    before: async function () {
        await browser.setWindowSize(1280, 800)
    }
}
```

`vitestOpts` takes Vitest's `test` options, except two that the framework reads itself:

- `parallelMode`: runs `test.concurrent` tests at the same time, each in its own browsing context. Requires a WebDriver BiDi session. Pick `'userContexts'` when tests log in or change cookies, because it gives each test its own storage.
- `maxParallelContexts`: caps how many concurrent tests run at once. Maps to Vitest's `maxConcurrency`. Default: `os.cpus().length`.

The top-level `bail` sets Vitest's `bail`, and `maxInstances` (or `wdio:maxInstances` per capability) sets Vitest's `maxWorkers`. The WDIO reporters in `reporters` receive the results, while `vitestOpts.reporters` configures Vitest's own output, see [Reporters](#reporters).

Run it like any other WDIO project:

```sh
npx wdio run wdio.conf.ts
```

## Global setup

`vitestOpts.globalSetup` runs once per `wdio run` in the Vitest main process, not once per capability. No browser session exists there, so `browser` is undefined. Use it for API or data setup.
Hand values to the specs with `project.provide(key, value)` in the setup file and `inject(key)` from `vitest` in the spec:

```ts title="global-setup.ts"
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
    export interface ProvidedContext {
        testUser: { name: string, password: string }
    }
}

export default async function setup (project: TestProject) {
    project.provide('testUser', { name: `user-${Date.now()}`, password: 'SuperSecret!' })
}
```

```ts title="test/specs/login.spec.ts"
import { inject, test } from 'vitest'

test('logs in with the provided user', async ({ expect }) => {
    await browser.url('/login')
    expect(inject('testUser').name).toMatch(/^user-/)
})
```

The `ProvidedContext` augmentation types `inject()` only when `global-setup.ts` is part of your `tsconfig.json` program.

The WDIO `onPrepare` and `onComplete` hooks are the alternative when you need the WDIO config or the launcher services. They run once in the launcher. Changes to top-level config made in `onPrepare` do not reach the specs, because each Vitest worker parses the config file again. Changes to capabilities do reach them.

## Global hooks and setup files

The WDIO hooks in `wdio.conf.ts` run in the Vitest worker: `beforeSession`, `before`, `beforeTest`, `afterTest`, `beforeCommand`, `afterCommand`, `after` and `afterSession`. `beforeSession`, `before`, `after` and `afterSession` run once per spec file, `beforeTest` and `afterTest` once per test. The launcher hooks `onPrepare` and `onComplete` run once per run.

These hooks do not run: `beforeSuite`, `afterSuite`, `beforeHook`, `afterHook`, `beforeAssertion`, `afterAssertion`, `onWorkerStart` and `onWorkerEnd`.

For code that must run around every test of every spec, use a setup file. `vitestOpts.setupFiles` runs once per spec file before its tests. Register root `beforeEach` or `afterEach` hooks there, and they apply to every spec. This example takes a screenshot when a test fails:

```ts title="setup.ts"
import { mkdirSync } from 'node:fs'
import { beforeEach, onTestFailed } from 'vitest'

beforeEach((context) => {
    onTestFailed(async () => {
        mkdirSync('./results', { recursive: true })
        await browser.saveScreenshot(`./results/${context.task.name.replace(/\W+/g, '_')}.png`)
    })
})
```

`onTestFailed` registers the handler for the current test only, so it stays correct when tests run concurrently.

## Fixtures

Vitest fixtures, defined with `test.extend`, give each test a page object it declares in its signature. A file-scoped fixture (`{ scope: 'file' }`) runs once per spec file instead. The first argument of a fixture must be destructured, even when it uses no other fixture:

```ts title="test/fixtures.ts"
import { test as base } from 'vitest'

export const test = base.extend<{ browserName: string }>({
    // Vitest requires the first argument to be destructured
    // eslint-disable-next-line no-empty-pattern
    browserName: [async ({}, use) => {
        await use(browser.capabilities.browserName)
    }, { scope: 'file' }]
})
```

Test-scoped page objects work the same way. Fixtures also run inside `test.concurrent` tests, so their commands target the window of that test. The [page objects as fixtures](pageobjects#page-objects-as-fixtures) section has a complete example with login and logout.

## Concurrent tests

`describe.concurrent` and `test.concurrent` run tests of one spec file at the same time, each in its own browser window. They need `vitestOpts.parallelMode` and a WebDriver BiDi session (`webSocketUrl: true`) with the `'wdio:experimentalBiDiCommands': true` capability. See [Parallel Tests in a Spec File](ParallelTests.md) for what changes in the element commands.

```ts title="test/specs/checkout.spec.ts"
import { describe, test } from 'vitest'

describe.concurrent('checkout', () => {
    test('guest', async () => {
        await browser.url('/checkout')
        await expect($('h1')).toHaveText('Checkout')
    })

    test('member', async () => {
        await browser.url('/checkout?member=1')
        await expect($('h1')).toHaveText('Checkout')
    })
})
```

Without `parallelMode`, the run fails with this error:

```
test.concurrent needs vitestOpts.parallelMode ('contexts' | 'userContexts'): concurrent tests would share one window
```

Without the capability, it fails with:

```
test.concurrent with vitestOpts.parallelMode needs the 'wdio:experimentalBiDiCommands': true capability, so commands run in the window of their test
```

## Table tests

`test.for` passes each case as the first argument and the test context as the second, so you can use the context `expect` there:

```ts title="test/specs/search.spec.ts"
import { describe, test } from 'vitest'

test.for(['webdriver', 'vitest'])('searches for %s', async (term, { expect }) => {
    await browser.url(`/search?q=${term}`)
    expect(await $('h1').getText()).toContain(term)
})

describe.each([
    { term: 'webdriver', expected: 'WebdriverIO' },
    { term: 'vitest', expected: 'Vitest' }
])('search for $term', ({ term, expected }) => {
    test('shows the result', async () => {
        await browser.url(`/search?q=${term}`)
        await expect($('h1')).toHaveText(expected, { containing: true })
    })
})
```

`test.each` works the same way as `describe.each` for single tests.

## Retries

`vitestOpts.retry` retries every failing test. A test can set its own count as the second argument, and `test.fails` passes when the test throws:

```ts title="test/specs/report.spec.ts"
import { test } from 'vitest'

test('loads the report', { retry: 2 }, async () => {
    await browser.url('/report')
    await expect($('#report')).toBeDisplayed()
})

test.fails('keeps the legacy banner hidden', async () => {
    await browser.url('/')
    await expect($('#legacy-banner')).toBeDisplayed()
})
```

Every attempt is reported to the WDIO reporters: failed attempts as retries, the last attempt as the result. `specFileRetries` is ignored, use `vitestOpts.retry` instead.

## Sharding and filtering

`vitestOpts.shard` takes Vitest's shard string, for example `'1/2'` to run the first of two parts. As tested, the CLI `--shard` option passes through to Vitest:

```sh
npx wdio run wdio.conf.ts --shard=1/2
```

`--spec` and `exclude` select the spec files, as in the other frameworks. `wdio run --grep` is not applied. To run only tests whose names match, use `vitestOpts.testNamePattern`:

```ts title="wdio.conf.ts"
vitestOpts: {
    testNamePattern: /checkout/
}
```

Use `sequence.shuffle` with `sequence.seed` in `vitestOpts` to run tests in a random order that you can reproduce, as shown in the [configuration](#configuration) example.

## Mocking

Vitest's mocking API works in the Vitest worker, so it mocks your Node code, such as a helper module, and spies on browser commands:

```ts title="test/specs/mocking.spec.ts"
import { afterEach, describe, test, vi } from 'vitest'

import { formatPrice } from '../helpers/price.js'

vi.mock('../helpers/price.js', () => ({
    formatPrice: vi.fn(() => 'mocked price')
}))

describe('mocking', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('replaces a helper', async ({ expect }) => {
        expect(formatPrice(10)).toBe('mocked price')
    })

    test('spies on a browser command', async ({ expect }) => {
        const getTitle = vi.spyOn(browser, 'getTitle')
        await browser.url('/')
        await browser.getTitle()
        expect(getTitle).toHaveBeenCalledTimes(1)
    })
})
```

`vi.useFakeTimers()` fakes the timers of the Node worker only, not the browser clock. To control time in the page, use `browser.emulate('clock')`.

## Snapshots

The global `expect` is the WebdriverIO assertion library, which has no snapshot matchers. Use the `expect` from the test context for `toMatchSnapshot` and `toMatchInlineSnapshot`. The context `expect` has no WebdriverIO matchers such as `toBeDisplayed`, so extract the text first:

```ts title="test/specs/todo.spec.ts"
import { test } from 'vitest'

test('matches the todo list', async ({ expect }) => {
    await browser.url('/todo')
    const items = await $$('#todo-list li').map((item) => item.getText())
    expect(items).toMatchSnapshot()
})
```

## Skipping tests

Skip a test at run time with `ctx.skip(condition, note)`, which stops the test when the condition is true:

```ts title="test/specs/banner.spec.ts"
import { test } from 'vitest'

test('shows the cookie banner', async (context) => {
    context.skip(browser.capabilities.browserName !== 'chrome', 'Chrome only')
    await browser.url('/')
    await expect($('#cookie-banner')).toBeDisplayed()
})
```

`test.skipIf` decides at collection time, so use it only for values that exist before the session starts, such as `process.env`. A `test.skipIf(browser...)` fails at collection with `ReferenceError: browser is not defined`, because `browser` is set in `beforeAll`.

## Reporters

- The WDIO file reporters in `reporters`, such as `junit`, `allure`, `json` and `html`, receive the results.
- The console reporters `spec`, `dot` and `concise` are ignored, because Vitest owns the console output. Set `vitestOpts.reporters` to change it.
- `vitestOpts.reporters` accepts Vitest's own reporters, such as `'junit'` or `'json'`. Vitest's `html` reporter needs `@vitest/ui` installed.
- `ctx.annotate` and test tags reach only Vitest reporters.

## Running programmatically

`Launcher.run()` resolves the exit code. Like the other frameworks, it does not set `process.exitCode`, so pass the code to `process.exit` yourself:

```ts title="run.ts"
import { Launcher } from '@wdio/cli'

const wdio = new Launcher('./wdio.conf.ts')
const exitCode = await wdio.run()
process.exit(exitCode)
```

## Limitations

The [package README](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-vitest-framework/README.md) lists every limitation. The most common ones:

- Multi-remote capabilities are not supported yet.
- `expect.poll` is not available, because the global `expect` comes from `expect-webdriverio`.
- WebDriver commands are not reported to the WDIO reporters, so Allure shows no WebDriver steps and no automatic screenshots.
- `--watch`, `--repeat` and per-capability `wdio:specs` or `wdio:exclude` are not supported. The testrunner stops with an error instead of ignoring them.
