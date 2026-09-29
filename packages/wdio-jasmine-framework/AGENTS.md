# packages/wdio-jasmine-framework

Jasmine 6 adapter. The runner calls the default export's `init`, then `hasTests()` and `run()`.

## Tests

- `tests/reporter.test.ts` owns reporter events: status names, errors, stack cleaning, and the failed-spec count.
- `tests/nestedSuites.test.ts` owns nested `describe` titles and sibling suites after `suiteDone`.
- `tests/adapter.test.ts` owns hook wrapping, grep, spec loading, and `expectationResultHandler` against the shared Jasmine mock.
- `tests/real-jasmine.test.ts` owns `init` against the real Jasmine 6 dependency.

The Jasmine mock must match that dependency. Jasmine 6 has no `Spec.prototype.execute` and no public `Suite.result` (`#result` is private). A mock that invents either one will keep a dead adapter branch green.

`_loadFiles` failure coverage has to await the returned promise. On failure the adapter logs and leaves `hasTests()` true. Assert `hasTests()`, which is what `@wdio/runner` calls, rather than assigning the private flag.
