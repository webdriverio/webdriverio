# @wdio/reporter

Base class for reporters. Concrete reporters (`wdio-spec-reporter`,
`wdio-junit-reporter`, …) extend this package.

## When to edit which package

| Change | Package |
|--------|---------|
| Runner events, output path, base lifecycle | `@wdio/reporter` |
| Spec / JUnit / Allure / … formatting | that reporter package |
| How the runner constructs reporters | `@wdio/runner` |

## Commands

```sh
pnpm run test:package wdio-reporter
pnpm run test:package wdio-spec-reporter
pnpm run test:smoke customReporterString
pnpm run test:smoke customReporterObject
pnpm run test:smoke reporterTestrunner
```

User-facing reporter docs are the package `README.md`, ingested by
`infra/docs/src/packagesDocs.ts`.

## Guardrails

- New reporters: `pnpm run create` and extend `@wdio/reporter`.
- Do not reach into `@wdio/runner` internals from a reporter. Consume the
  documented event API only.
- Smoke tests are the right proof for constructor / CLI string vs object
  config; unit tests are enough for formatting helpers.

## Spec reporter test ownership

`packages/wdio-spec-reporter/tests/index.test.ts` owns spec formatting.
Assert the written report. Do not lock private flags or `printCurrentStats`
call shape.

- `showPreface: false`, `onlyFailures`, and `sauceLabsSharableLinks: false`
  must attach suites before asserting `write()`. Sauce job links also need
  `runnerStat.instanceOptions`. An empty `write()` call list does not prove
  the option. Default preface text belongs to the existing `printReport`
  snapshots.
- Console-log filtering goes through the patched `stdout.write`. Assigning
  `_consoleOutput` does not exercise the `mwebdriver` exclusion.
- Realtime reporting is the `reporterRealTime` payload on `process.send`.
  The unit-test env var `WDIO_UNIT_TESTS` suppresses that send, so a test
  of the payload has to unset it and restore it.
- `getHeaderDisplay` does not print spec paths.
- Default symbols and pass/fail/skip colors belong to the printed report.
  Custom `symbols` belong on that same report. Keep the multi-remote
  instance name `"app"`: combo formatting throws if that name is read as
  an app capability.
