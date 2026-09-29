# @wdio/concise-reporter

Concise end-of-run reporter. Extends `@wdio/reporter`. Formatting lives here;
runner events and the output stream live in `@wdio/reporter`.

## Tests

```sh
pnpm run test:package wdio-concise-reporter
```

Assert the string `onRunnerEnd` writes. That printed report is the contract for
the header, the capability line, the pass / fail / empty counts, and failure
lines.

Do not assert private `_suiteUids`, `_suites`, or `_stateCounts`. Do not spy on
`printReport` in place of `write`. Give each case its own reporter. A shared
instance updated from `beforeAll` made later cases depend on earlier ones.

Suite start order is visible only in the failure lines. Passing suites are
omitted, so a single failure cannot prove order. Cover order with two failures
that end in a different order than they started, and omit a suite that started
but never ended.
