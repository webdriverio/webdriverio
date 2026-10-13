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
    capabilities: [{ browserName: 'chrome', webSocketUrl: true }],
    vitestOpts: {
        parallelMode: 'contexts'
    }
}
```

```sh
npx wdio run wdio.conf.ts
```

Vitest globals are enabled, so specs need no imports. `browser`, `driver`, `$`, `$$` and `expect` are globals as well. `expect` is the `expect-webdriverio` assertion library, which replaces Vitest's own `expect`. `waitforTimeout` and `waitforInterval` from the config set its defaults.

```ts
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

Runs `test.concurrent` tests at the same time, each in its own browser window (browsing context). Requires a WebDriver Bidi session.

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

## Concurrent tests

```ts
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
- WDIO reporters are not used. Use Vitest reporters through `vitestOpts.reporters`.
- Window and frame commands (such as `switchToWindow` or `switchToFrame`) throw inside concurrent tests, because they change session-wide state.
- Vitest runs projects with different `maxWorkers` one after another. A `wdio:maxInstances` on a capability therefore makes the capability projects run sequentially.
- Worker service hooks (`before`, `beforeTest`, `afterTest`, `after` of services) are not run yet. Launcher service hooks (`onPrepare`, `onComplete`) do run.
- The WDIO CLI banner ("Execution of N workers", "Spec Files: 0 passed") is wrong for Vitest runs. Use the Vitest reporter output and the exit code.
- `browser.options.vitestOpts` is not set inside specs.
