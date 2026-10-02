# e2e/

Real-browser and component-test suites. Expensive. Run only when the change
can affect `wdio session`, session launch, browser-runner, display-server, or a live WebDriver path
that smoke tests cannot see.

## Commands

```sh
pnpm run test:e2e:standalone   # vitest standalone examples
pnpm run test:e2e:launch       # vitest launch helpers
pnpm run test:e2e:testrunner   # headless wdio testrunner
pnpm run test:e2e:webdriver    # local webdriver conf
pnpm run test:e2e:classic
pnpm run test:e2e:jasmine      # Jasmine framework: sync and async expect
pnpm run test:e2e:multi-remote
pnpm run test:component        # e2e/browser-runner (needs @wdio/browser-runner)
pnpm run test:e2e:session      # @wdio/session (Chrome, Firefox, Electron)
pnpm run test:e2e:display-server # @wdio/display-server
pnpm run test:e2e:cloud        # Sauce — needs credentials, main-branch CI
```

`pnpm run test:e2e` runs every `test:e2e:*` script, including cloud. Do not
use it in routine agent work. `pnpm run test:changed --e2e` runs component,
session, or display-server only when those CI lanes are in the diff.

## When CI already skips these

`.github/workflows/test.yml` path filters:

- `e2e/browser-runner` + `packages/wdio-browser-runner` → component
- `packages/wdio-session` + `e2e/session` → session e2e (ubuntu, parallel with component)
- `packages/wdio-display-server`, `wdio-local-runner`, `e2e/wdio/display-server` → display-server
- most other `packages/**` / `e2e/**` → core e2e + unit + smoke

Match that locally. A reporter-only change does not need this folder.

## Guardrails

- Requires Chrome / Firefox / Edge as in CONTRIBUTING. Headless configs live
  under `e2e/wdio/headless/`.
- `test:e2e:webdriver` runs a browser matrix. Locally it skips Edge when it is
  not installed and Safari (needs "Allow remote automation"); CI runs all of
  them. Pick browsers with `WDIO_E2E_BROWSERS=chrome,firefox`.
- `pnpm run test:typings:e2e` type-checks the testrunner specs in `e2e/wdio`.
- Do not commit screenshots (`e2e/screenshot.png`, `e2e/wdio/headless/*.png`).
- Framework-specific browser-runner scripts are in `e2e/package.json`
  (`test:browser:react`, …).
