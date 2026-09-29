# @wdio/runner

Worker that runs one capability. The launcher and local runner own process
management. This package owns the in-worker session, hooks, and reporters.

## Test ownership

Unit tests live in `tests/`. A sweep found proofs that passed for a reason
the title did not describe. Keep the contracts below on these owners:

- Command and result listeners belong to `index.test.ts` (`should register
  before and after command listener`). Do not add a second file that mocks
  `./utils` only to re-fire those events.
- Config initialization failure belongs to `should shut down when config
  initialization fails`. Do not re-prove that catch by pointing `run()` at
  a missing config file.
- The `run` describe stubs `ConfigParser#addConfigFile` in its `beforeEach`.
  A spy left by an earlier test is not setup.
- Watch mode leaves the session open (`endSession` is not called). The local
  runner does not call `browser.url`.
- `endSession` with no session asserts that `executeHooksWithArgs` was not
  called. A hook that was never registered is not a negative control.
- Custom-command replay is one passthrough of `[name, fn, options]` into
  `addCommand`. The protocol stub in `webdriverio` owns how that tuple is
  recorded.
- Driver log capture (`filterLogTypes`, `_fetchDriverLogs`) is gone. Do not
  restore a helper that nothing calls.

## Commands

```sh
pnpm run test:package wdio-runner
```
