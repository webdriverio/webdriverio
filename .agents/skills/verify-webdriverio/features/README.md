# WebdriverIO verification map

This directory is the maintained source for proving user-facing behavior. Read this index, then drive the matching feature file.

## Baseline preconditions

- Repo root is the WebdriverIO checkout. Commands below are relative to it.
- `.agents/resume` prints `Ready.` The build stamp matches `HEAD`.
- `packages/webdriverio/build` exists because the harness imports compiled output.
- Run one smoke suite or one benchmark at a time. Both own the mock driver on port 4444 inside their process.
- Run one real-browser example at a time. Do not reuse a Chrome the user already opened.
- Cloud examples under `examples/cloudservices/` need vendor credentials. Without them, record the path as unreachable.

## Driving conventions

- Start from the baseline above unless the feature file adds preconditions.
- Treat commands as literal. Keep the suite name, script path, and flags unchanged.
- Pass a smoke suite name. `pnpm run test:smoke` with no name runs every suite in parallel on a laptop and is not a focused proof.
- Capture `command.txt`, `output.txt`, and `result.txt` under `.agents/verify-artifacts/<feature-id>/`.
- Do not delete those artifacts during cleanup.

## Proof and skip reporting

- Capture the command and the resulting state, not only the exit code.
- Name the feature id and the entry point in `result.txt`.
- An unreachable entry point is reported with the command you ran and the unmet precondition.
- Do not report a skipped entry point as verified through a different harness.

## Feature entry contract

Each feature file starts with an H1 and one paragraph, then these four H2 sections in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with the WebdriverIO harness`, `Gotchas`.

## Features

- [Smoke testrunner](./smoke-testrunner.md) runs the testrunner, CLI, frameworks, hooks, services, and reporters with `@wdio/webdriver-mock-service` instead of a browser.
- [Example pipeline](./example-pipeline.md) runs example scripts through a real browser and driver.
- [Runner benchmark](./runner-benchmark.md) measures testrunner hot-path wall clock against a baseline.
- [Typings](./typings.md) typechecks public command and config usage.
