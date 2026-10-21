# @wdio/vitest-framework

Run specs written in Vitest syntax (`describe`, `test`, `test.concurrent`) with the WebdriverIO testrunner. Vitest schedules the tests, so no WDIO workers are started. `wdio.conf.ts` stays the source of truth for capabilities, connection options and hooks.

## Installation

```sh
npm install @wdio/vitest-framework --save-dev
```

`vitest` and `expect-webdriverio` are installed with the package.

## Usage

```ts
// wdio.conf.ts
export const config: WebdriverIO.Config = {
    framework: 'vitest',
    specs: ['./test/**/*.spec.ts'],
    capabilities: [{ browserName: 'chrome', webSocketUrl: true, 'wdio:experimentalBiDiCommands': true }],
    vitestOpts: {
        parallelMode: 'contexts'
    }
}
```

```sh
npx wdio run wdio.conf.ts
```

Vitest globals are enabled at runtime; import `describe`, `test` and the hooks from `vitest` so TypeScript knows their types, but never `expect`. `browser`, `driver`, `$`, `$$` and `expect` are globals as well. `expect` is the `expect-webdriverio` assertion library, which replaces Vitest's own `expect`. `waitforTimeout` and `waitforInterval` from the config set its defaults.

```ts
import { describe, test } from 'vitest'

describe('login', () => {
    test('shows the form', async () => {
        await browser.url('/login')
        await expect($('form')).toBeDisplayed()
    })
})
```

The WDIO hooks `before`, `after`, `beforeTest` and `afterTest` run in the Vitest worker, once per spec file or test. Every capability becomes one Vitest project, named `<browserName>-<index>`, and every spec file gets its own browser session.

## Options

Set them in `vitestOpts`.

### parallelMode

Type: `'contexts' | 'userContexts'`

Default: `undefined`

Runs `test.concurrent` tests at the same time, each in its own browser window (browsing context). Requires a WebDriver Bidi session and the `'wdio:experimentalBiDiCommands': true` capability, without which commands use classic WebDriver and cannot target the test's window. The capability changes how element commands are implemented in every test of the session.

- `'contexts'`: windows share the default user context, so cookies, localStorage and service workers are shared across concurrent tests.
- `'userContexts'`: each test gets its own user context, so storage is isolated per test. `browser.mock()` remains session-wide.

Without `parallelMode`, `test.concurrent` throws, because concurrent tests would share one window.

### maxParallelContexts

Type: `number`

Default: `os.cpus().length`

Maximum number of `test.concurrent` tests that run at once. Maps to Vitest's `maxConcurrency` and only applies when `parallelMode` is set.

### Vitest options

All other keys are passed to Vitest's `test` config and override the defaults of this framework, for example `testTimeout` (default `60000`), `hookTimeout` (default: `connectionRetryTimeout`, else `120000`, because `beforeAll` starts the session), `retry` or `reporters`.

Specs and `exclude` come from `wdio.conf` (respecting `--spec`). The framework always sets `include` to the resolved specs, so `vitestOpts.include` is ignored, and `pool: 'forks'`. A `vitestOpts.setupFiles` is added after the framework's own setup file instead of replacing it. The framework also sets `isolate`, `globals`, `environment: 'node'`, `maxWorkers` (from `maxInstances`, or `wdio:maxInstances` per capability) and `bail`.

`runnerEnv` from `wdio.conf` is passed to the Vitest workers as Vitest's `env`, with `NODE_ENV` defaulting to `test`. `vitestOpts.env` is merged on top and wins. `NODE_OPTIONS` in `runnerEnv` only reaches the worker's `process.env` (and the processes it spawns), because Vitest has already forked the worker by then. Node flags such as `--import` do not apply to it.

## Reporters

The console output comes from Vitest. Set `vitestOpts.reporters` to change it, for example `['dot']`; the WDIO reporters are added to your list. The `spec`, `dot` and `concise` reporters (also as `@wdio/*-reporter` or with options) are ignored with a warning, because they would print next to Vitest's output. Reporter classes are always used.

File reporters from `wdio.conf` such as `junit`, `allure` or `json` receive the Vitest results. Every spec file and capability is reported as one job, and the CLI summary counts these jobs. Describe blocks become suites, and tests outside a describe are grouped in a suite titled with the spec path. Skipped and `todo` tests are reported as pending.

## Concurrent tests

```ts
import { describe, test } from 'vitest'

describe('checkout', () => {
    test.concurrent('guest', async () => {
        await browser.url('/checkout')
        await expect($('h1')).toHaveText('Checkout')
    })

    test.concurrent('member', async () => {
        await browser.url('/checkout?member=1')
        await expect($('h1')).toHaveText('Checkout')
    })
})
```

Each test opens its own window, and every command in the test targets it. The window is closed when the test ends, also when it fails.

## Limitations

- Multi-remote capabilities are not supported yet.
- `expect.poll` is not available, because the global `expect` is the one from `expect-webdriverio`.
- Window and frame commands (such as `switchToWindow` or `switchToFrame`) throw inside concurrent tests, because they change session-wide state.
- Vitest runs projects with different `maxWorkers` one after another. A `wdio:maxInstances` on a capability therefore makes the capability projects run sequentially.
- Worker services are initialized like in the WDIO runner, so their `beforeSession`, `before`, `beforeTest`, `afterTest`, `beforeCommand`, `afterCommand`, `after` and `afterSession` hooks run, next to the launcher service hooks (`onPrepare`, `onComplete`).
- The hooks `beforeSuite`, `afterSuite`, `beforeHook`, `afterHook`, `beforeAssertion`, `afterAssertion`, `onWorkerStart` and `onWorkerEnd` are not run.
- The `cid` passed to `beforeSession` is `<capability index>-<Vitest pool id>`; `WDIO_WORKER_ID` is not set, because the Vitest worker has an IPC channel to Vitest.
- When `vitestOpts` sets no `reporters`, Vitest's `default` reporter is used instead of Vitest's environment-dependent default. Add others, such as `github-actions` annotations, explicitly.
- Top-level config changes made in `onPrepare` do not reach the workers, because each worker parses the config file again.
- `--watch` and per-capability `wdio:specs` / `wdio:exclude` are not supported yet. The testrunner stops with an error instead of ignoring them.
- The WDIO CLI banner ("Execution of N workers") is wrong for Vitest runs, because no WDIO workers are started.
- Hook results are not reported to WDIO reporters, except for a failing `beforeAll` or `afterAll`, which is reported as a failed hook (`"before all" hook in "<suite>"`) so that the JUnit reporter adds a failing testcase for it.
- Soft assertions (`expect.soft` from `expect-webdriverio`) fail the test at its end unless `autoAssertOnTestEnd` is `false`. `expect-webdriverio` tracks one current test per worker, so in `test.concurrent` tests the failures can be attributed to the wrong test. Use Vitest's own `expect.soft` from the test context there.
- Soft assertions outside a test (in `beforeAll` or `afterAll`) are not asserted: their failures are dropped.
- Reporter runtime APIs such as `addStep` and `addAttachment` from `@wdio/allure-reporter` or `addProperty` from `@wdio/junit-reporter` work from tests and `beforeEach` / `afterEach` hooks. Calls in `beforeAll` / `afterAll` are dropped.
- `browser.options.vitestOpts` is not set inside specs.
