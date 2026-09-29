# @wdio/browser-runner

Vite-based runner that executes Mocha tests in the browser.

## Test ownership

Unit tests live in `packages/wdio-browser-runner/tests/` and mirror `src/`.
Component proof is `pnpm run test:component` (`e2e/browser-runner`). Prefer
package unit tests for test-only cleanups.

- Headless and watch-mode capability changes are the return value of
  `makeHeadless` and `adjustWindowInWatchMode`. Assert the merged capabilities.
  Do not mock `deepmerge` and count calls.
- Custom `viteConfig` is merged in `ViteServer.start`, then `getPort()`
  overwrites `server.port`. A test of that option must assert a field the
  port overwrite does not erase.
- Vite servers created in `run()` are closed in `shutdown()`. Assert `close()`
  on the server test double. Do not add a production field whose only caller
  is a test.

## Commands

```sh
pnpm run test:package wdio-browser-runner
```
