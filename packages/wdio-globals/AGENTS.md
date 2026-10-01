# @wdio/globals

Import proxies for `browser`, `driver`, `multiRemoteBrowser`, `$`, `$$`, and
`expect`. The testrunner installs values with `_setGlobal`. That export is a
production seam (`@wdio/runner`, `@wdio/jasmine-framework`,
`@wdio/browser-runner`). Do not remove it, and do not add a test-only reset
helper. Tests reset `globalThis._wdioGlobals` directly.

## Commands

```sh
pnpm run test:package wdio-globals
```

`tests/mocha/noGlobals.ts` is the runner-level owner of `injectGlobals: false`.
This package's unit file owns the proxy and the `setGlobal` flag.

## Test ownership

- Assert the registration error text. A bare `toThrow()` still passes when
  the guard is removed, because the following call throws `TypeError`.
- Assert forwarded arguments and return values. `not.toThrow()` stays green
  when a matcher wrapper drops the underlying call.
- `typeof browser === 'function'` follows the proxy target (a class), not a
  user contract. Do not restore that assertion.
- The `browser` test covers the shared property proxy, including method
  `this`. Do not copy it for `driver` or `multiRemoteBrowser`.
- `closeTo` represents the asymmetric-matcher loop. `some` is a separate
  wrapper. One forwarding assertion each is enough.
- Pass `false` for `setGlobal` unless the test is the global-install
  contract, and clear the shared map between tests.
