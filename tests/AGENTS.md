# tests/ (smoke)

Full testrunner sessions with `@wdio/webdriver-mock-service` stubbing the
driver. No real browser. This is the right proof for CLI, retries, framework
adapters, custom services/reporters, and spec filtering.

Unit tests live next to each package (`packages/<pkg>/tests`). Do not add
package-level unit tests here.

## Run

```sh
pnpm run test:smoke                 # all suites
pnpm run test:smoke mochaTestrunner # one suite (function name)
```

Shared config: `tests/helpers/config.js`. Suites call `tests/helpers/launch.js`.

## Named suites (from `smoke.runner.js`)

Frameworks: `mochaTestrunner`, `mochaAsyncTestrunner`, `jasmineTestrunner`,
`cucumberTestrunner`, `cjsTestrunner`, `standaloneTest`, `nonGlobalTestrunner`

Cucumber extras: `cucumberTestrunnerByLineNumber`,
`cucumberTestrunnerMultipleByLineNumber`, `cucumberFailAmbiguousDefinitions`,
`cucumberPendingTest`, `cucumberReporter`, `cucumberFileOption`,
`cucumberSkipTag`

Jasmine extras: `jasmineSpecFiltering`, `jasmineReporter`, `jasmineTimeout`,
`jasmineAfterAll`, `jasmineFailSpecWithNoExpectations`,
`jasmineHooksTestrunner`, `jasmineAfterHookArgsValidation`

CLI / specs: `mochaSpecGrouping`, `mochaSpecFiltering`, `mochaHooksTestrunner`,
`runSpecsWithFlagAllPassed`, `runSpecsWithFlagSeveralPassed`,
`runSpecsWithFlagDirectPath`, `runSpecsWithFlagNoArg`,
`cliExcludeParamValidation*`, `cliSpecsWithWildCard*`, `cliExclude*WithWildCard*`

Plugins: `customService`, `customCJSService`, `customReporterString`,
`customReporterObject`, `reporterTestrunner`, `sharedStoreServiceTest`

Other: `multiremote`, `parallelMultiremote`, `wdioHooks`, `retryFail`,
`retryPass`, `severeErrorTest`

Unknown names fail with a list of valid suite names.

## Guardrails

- `@wdio/smoke-test-service` is a fixture service used *inside* some suites.
  The driver stub is `@wdio/webdriver-mock-service`.
- Custom WebDriver mock responses: extend the mock service, do not add a
  second stub.
- Prefer adding a focused suite over growing `mochaTestrunner` when the
  scenario is a distinct user flow.
