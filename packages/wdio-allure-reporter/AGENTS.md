# @wdio/allure-reporter

Concrete Allure reporter. Extends `@wdio/reporter`. User docs are this
package's `README.md`.

## Commands

```sh
pnpm run test:package wdio-allure-reporter
```

## Guardrails

- Hook kind is decided in `AllureReportState` from the leading quoted hook
  phrase (`"before each" hook`, `"before all" hook`). Do not bring back
  `title.includes` classifiers; a suite or test title that contains "all" or
  "each" must not change the hook kind.
- `issueLinkTemplate` and `tmsLinkTemplate` replace `{}` with `%s` in the
  reporter constructor and are passed to Allure as `links.*.urlTemplate`.
  There is no local link-template helper.
- Assert reporter output from result files at the runner-event boundary
  (`suite.test.ts`, `cucumber.suite.test.ts`, `allureFeatures.test.ts`).
  Do not add state getters whose only caller is a unit test.
