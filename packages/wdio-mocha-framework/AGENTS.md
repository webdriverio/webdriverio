# @wdio/mocha-framework

Mocha adapter for the testrunner worker and the browser runner. The worker
loads the default export (`adapterFactory.init`). The browser runner imports
`applyMochaDefaults`, `setupEnv`, and `formatMessage` from
`@wdio/mocha-framework/common`.

## Commands

```sh
pnpm run test:package wdio-mocha-framework
```

User-facing options live in this package's `README.md`.

## Test ownership

- Reporter message shape, timeout copy, and hook titles: `tests/common.test.ts`.
- `this.skip()` inside a hook must not be reported as a failure
  ([#14649](https://github.com/webdriverio/webdriverio/issues/14649)):
  `tests/skip-hook-issue.test.ts`. One `adapter.test.ts` case checks that
  `emit` forwards the remapped `hook:end` type to the reporter.
- UI hook wiring (`bdd` / `tdd`) and `failHookAffectedTests`: `tests/common.test.ts`.
- Init, spec load, grep, `hasTests()`, run errors, UID assignment, and
  `mochaOpts.require`: `tests/adapter.test.ts`. Assert `hasTests()` from
  `_loadFiles`. Do not assign `_hasTests` and read it back.

`mochaOpts.compilers` was removed with the Mocha 12 upgrade. Do not put back
`requireExternalModules` or `loadModule`; nothing in the adapter calls them.
`mochaOpts.require` goes through Mocha's `handleRequires`.
