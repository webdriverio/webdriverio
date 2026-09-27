---
name: wdio-testing
description: Choose the smallest WebdriverIO proof for a code change (unit, typings, smoke, component, e2e).
---

# WDIO testing

Use this skill when deciding which tests to run or add. Read
[AGENTS.md](../../../AGENTS.md) and [tests/AGENTS.md](../../../tests/AGENTS.md)
first.

Passing a lane below does not prove a feature works the way a user runs it.
That proof is [verify-webdriverio](../verify-webdriverio/SKILL.md). Do not
cite a unit test as that proof.

## Pick a lane

1. Identify the owning package (see the root repo map or [OWNERSHIP.md](../../../.github/OWNERSHIP.md)).
2. Compile that package (`pnpm run dev <name>` or `pnpm run compile:all`).
3. Prefer `pnpm run test:changed --dry-run` to see the CI lanes for this diff.
4. Run the first matching row, then stop unless a lower row also applies.
5. Prove the user-facing path with verify-webdriverio. Stopping after a unit lane is not done.

| If you touched | Run |
|----------------|-----|
| Mixed paths / unsure | `pnpm run test:changed` (add `--smoke` or `--e2e` when those lanes apply) |
| `packages/<pkg>/src/**` | `pnpm run test:package <pkg>` or a single `npx vitest` file next to the source |
| Exported types / new commands | matching `pnpm run test:typings:*` |
| CLI flags, spec filters, retries, custom services/reporters, framework adapters | `pnpm run test:smoke <suite>` |
| `packages/wdio-browser-runner/**` or `e2e/browser-runner/**` | `pnpm run test:component` |
| `packages/wdio-display-server/**` or `e2e/wdio/display-server/**` | `pnpm run test:e2e:display-server` |
| Session launch / real WebDriver path not stubbed by the mock service | the specific `test:e2e:*` script, not `test:e2e` |
| `website/**` or `scripts/docs-generation/**` only | docs skill; no unit/smoke |
| `.github/workflows/**`, root `package.json`, lockfile, `vitest.config.ts`, `.oxlintrc.json` | `pnpm run test:local` |

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

`pnpm run test:smoke:list` prints every named suite. Common ones:
`mochaTestrunner`, `standaloneTest`, `customService`, `customReporterString`,
`retryFail`, `cucumberTestrunner`. Full list: [tests/AGENTS.md](../../../tests/AGENTS.md).
