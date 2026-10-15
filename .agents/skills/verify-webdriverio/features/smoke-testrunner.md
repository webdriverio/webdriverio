# Smoke testrunner

A user runs `wdio` and the testrunner loads config, starts workers, runs a framework, and applies hooks, services, and reporters. Smoke suites prove that path with the driver stubbed.

## Sub-features

- `smoke-mocha` runs a Mocha testrunner session and checks passed and skipped counts.
- `smoke-jasmine` runs a Jasmine session, including spec filtering and reporters.
- `smoke-cucumber` runs a Cucumber session, including line filters, tags, and pending steps.
- `smoke-cli` runs spec and exclude selection from the CLI.
- `smoke-plugin` runs a custom service and a custom reporter through the launcher.
- `smoke-spec-hook-counts` keeps failing hooks separate from test totals without hiding their errors.
- `smoke-standalone` runs `remote`, `attach`, and `multiRemote` inside a worker with the mock driver.
- `smoke-watch` runs the testrunner with `--watch` and checks that a spec change reruns in the same session, including a failing rerun and a `filesToWatch` rerun of every spec.

## How to get to it (user POV)

- List suite names: `pnpm run test:smoke:list`
- Run one suite by its function name in `tests/smoke.runner.js`: `pnpm run test:smoke <suite>`
- Common names: `mochaTestrunner`, `jasmineTestrunner`, `cucumberTestrunner`, `standaloneTest`, `customService`, `customReporterString`, `retryFail`, `mochaSpecFiltering`, `watchMode`, `watchFilesToWatch`
- The full name list is the `smokeTests` array at the bottom of `tests/smoke.runner.js` and in [tests/AGENTS.md](../../../../tests/AGENTS.md).

## Driving it with the WebdriverIO harness

Preconditions:

- `.agents/resume` prints `Ready.`
- No other smoke or benchmark process is running.

- **List names.** Run `pnpm run test:smoke:list`. Exit 0 and stdout includes `standaloneTest`. This does not launch WebdriverIO.
- **Mocha session.** Run `pnpm run test:smoke mochaTestrunner`. Exit 0, stdout contains `All smoke tests passed!`, and the suite assertion requires `passed` 4 and `skippedSpecs` 1. On Windows the suite returns before those counts; do not treat that early return as the count check.
- **Ambiguous Cucumber step.** Run `pnpm run test:smoke cucumberFailAmbiguousDefinitions`. Exit 0 and `All smoke tests passed!` mean the child run failed as expected and its spec report lists the matching step definitions of the ambiguous step.
- **Standalone client.** Run `pnpm run test:smoke standaloneTest`. Exit 0 and stdout contains `All smoke tests passed!`. The spec expects the mock title `Mock Page Title`.
- **Plugin.** Run `pnpm run test:smoke customService` or `pnpm run test:smoke customReporterString`. Exit 0 and stdout contains `All smoke tests passed!`.
- **Spec hook counts.** Run `pnpm run test:smoke specHookCounts`. Exit 0 and stdout contains `Spec summary: 1 passing test, 2 failing tests (including a setup-blocked test), 4 failing hooks; all hook errors preserved`. The fixture deliberately fails; the smoke suite checks setup, teardown, and root hook errors in its written report. Mocha's setup-blocked test remains failed; only hook events are excluded from the test count.
- **Jasmine root hook counts.** Run `pnpm run test:smoke jasmineSpecHookCounts`. Exit 0 and stdout contains `Jasmine spec summary: 1 passing test, 1 failing test, 1 failing root hook`. The fixture deliberately fails on a test and a root teardown; the hook title must remain visible and must not inflate the failed-test total.
- **Watch mode.** Run `pnpm run test:smoke watchMode`. Exit 0 and stdout contains `All smoke tests passed!`. The suite reruns a changed spec in the same WebDriver session, including one failing rerun.
- **filesToWatch.** Run `pnpm run test:smoke watchFilesToWatch`. Exit 0 and stdout contains `All smoke tests passed!`. Changing a watched file reruns every spec, each spec keeps its own session, and shutdown deletes every retained session.
- **Unknown name.** Run `pnpm run test:smoke notARealSuite`. Exit 1 and stdout names the suite and lists valid names. The runner prints that error with `console.log`.
- **Proof.** Save output to `.agents/verify-artifacts/smoke-testrunner/`. `result.txt` records the suite name, exit code, and the passed or skipped count the suite asserts when it prints them.

## Gotchas

- `pnpm run test:smoke` with no suite name runs every suite in parallel outside CI. That is not a focused proof and will contend on the mock.
- `@wdio/smoke-test-service` is a fixture used inside some suites. The driver stub is `@wdio/webdriver-mock-service`.
- A green smoke run never proves a real browser command. Use the example pipeline for that.
- Add a new scenario as its own named function in `tests/smoke.runner.js` and register it in `smokeTests`. Do not grow `mochaTestrunner` for a separate user flow.
- Do not "fix" a failure with retries, a longer timeout, or a weaker assertion.
