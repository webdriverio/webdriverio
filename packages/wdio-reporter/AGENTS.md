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
`scripts/docs-generation/packagesDocs.ts`.

## Guardrails

- New reporters: `pnpm run create` and extend `@wdio/reporter`.
- Do not reach into `@wdio/runner` internals from a reporter. Consume the
  documented event API only.
- Smoke tests are the right proof for constructor / CLI string vs object
  config; unit tests are enough for formatting helpers.
