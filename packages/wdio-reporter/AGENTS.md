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

## Test ownership

- Assertion diffs belong to `tests/stats/test.test.ts`. Prove them through
  the error message reporters display. A skipped diff leaves that message
  unchanged.
- Listener behavior belongs to `tests/reporter.listeners.test.ts`.
  `tests/reporter.test.ts` covers construction, the output stream, and the
  event subscription list.
- `tests/utils.test.ts` owns `color`, including the ANSI wrap when stdout
  supports color.
