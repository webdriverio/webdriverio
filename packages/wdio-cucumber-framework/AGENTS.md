# @wdio/cucumber-framework

Adapts Cucumber into the WebdriverIO runner. Unit tests in this package own
adapter init, skip tags, and reporter events. Smoke suites in `tests/`
(`cucumberTestrunner`, `cucumberSkipTag`, and the other `cucumber*` names)
own the testrunner path.

## Test ownership

- Assert formatter behavior through `reporter.emit` payloads and the
  `getFailedCount` event. Do not read private fields.
- Do not mutate shared envelope fixtures at import time. Deleting
  `feature.location.line` made every feature id `undefined` and hid line
  regressions.
- `@skip` cases must use real tag text, such as `@skip(browserName="chrome")`.
  A string with escaped parentheses never matches the skip pattern, so a
  mismatch assertion passes for the wrong reason.
- `createStepArgument` and `getTestStepTitle` stay internal to
  `buildStepPayload`. Data-table arguments are proved by the formatter step
  snapshots. Do not export a helper only so a unit test can call it.
