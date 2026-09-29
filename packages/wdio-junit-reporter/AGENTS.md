# @wdio/junit-reporter

JUnit XML reporter. It extends `@wdio/reporter`. User docs are this package's `README.md`.

## Commands

```sh
pnpm run test:package wdio-junit-reporter
```

CJS `addProperty` load check: `pnpm --filter @wdio/test-interop-cjs run test:junit-reporter`.

## Test ownership

- JUnit XML shape (suites, failures, skips, Cucumber scenarios, BrowserStack package names, and file association) is owned by `tests/reporter.test.ts` through `_buildJunitXml`. Keep those snapshots. Do not stub the suite builders and assert the stub.
- `onRunnerEnd` must write the built report. Assert that document. A mocked `undefined` snapshot does not.
- Whitespace-stripped snapshots do not lock command-log spacing. Exact `COMMAND:` / `RESULT:` text stays on the stdout test.
- `addProperty` is the public worker API (process event `junit:addProperty`). Call `addProperty`, not the private listener.
- `addWorkerLogs` is owned by writing to `stdout` while a test is current, then restoring `stdout.write`.
- The CJS interop check uses `assert.equal(typeof fn, 'function')`. `assert(typeof fn, 'function')` cannot fail.
