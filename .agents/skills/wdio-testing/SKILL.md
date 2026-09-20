---
name: wdio-testing
description: Choose the smallest WebdriverIO proof for a code change (unit, typings, smoke, component, e2e).
---

# WDIO testing

Use this skill when deciding which tests to run or add. Read
[AGENTS.md](../../../AGENTS.md) and [tests/AGENTS.md](../../../tests/AGENTS.md)
first.

## Pick a lane

1. Identify the owning package (see the root repo map).
2. Compile that package (`pnpm run dev <name>` or `pnpm run compile:all`).
3. Run the first matching row, then stop unless a lower row also applies.

| If you touched | Run |
|----------------|-----|
| `packages/<pkg>/src/**` | `pnpm run test:package <pkg>` or a single `npx vitest` file next to the source |
| Exported types / new commands | matching `pnpm run test:typings:*` |
| CLI flags, spec filters, retries, custom services/reporters, framework adapters | `pnpm run test:smoke <suite>` |
| `packages/wdio-browser-runner/**` or `e2e/browser-runner/**` | `pnpm run test:component` |
| `packages/wdio-xvfb/**` or `e2e/wdio/xvfb/**` | `pnpm run test:e2e:xvfb` |
| Session launch / real WebDriver path not stubbed by the mock service | the specific `test:e2e:*` script, not `test:e2e` |
| `website/**` or `scripts/docs-generation/**` only | docs skill; no unit/smoke |
| `.github/workflows/**`, root `package.json`, lockfile, `vitest.config.ts` | `pnpm run test:local` |

Never start with `pnpm test` or `pnpm run ci`.

## Adding tests

- Unit: one file per source file under `packages/<pkg>/tests/`, mock other
  packages, no real browser.
- Typings: add a usage snippet to `tests/typings/webdriverio/async.ts` (or
  the webdriver / framework file you changed).
- Smoke: add a named function in `tests/smoke.runner.js` and register it in
  the `smokeTests` array. Reuse `tests/helpers/config.js`.
- Do not "fix" a flake with `retries`, a longer timeout, or a weaker
  assertion. Fix the cause.

## Smoke suite names

`pnpm run test:smoke` with a wrong name prints the valid list. Common ones:
`mochaTestrunner`, `standaloneTest`, `customService`, `customReporterString`,
`retryFail`, `cucumberTestrunner`. Full list: [tests/AGENTS.md](../../../tests/AGENTS.md).
