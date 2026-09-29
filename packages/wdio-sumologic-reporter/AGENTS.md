# @wdio/sumologic-reporter

Sends runner events to a Sumo Logic HTTP collector. Extends `@wdio/reporter`.

```sh
pnpm run test:package wdio-sumologic-reporter
```

## Test ownership

Unit coverage lives in `tests/reporter.test.ts`.

- The constructor owns a missing or blank `sourceAddress`. `sync()` does not re-check it. The collector URL is fixed once the reporter is enabled. Do not assign `reporter['_options']` to reach a branch production never takes.
- The runner polls `isSynchronised` and does not call `sync()`. The interval must keep running after `runner:end` until the queue drains. `should stop the timer if runner ended` owns that ordering. A flush test that calls `sync()` itself still passes if the interval is cleared too early.
- `should start sync when reporter gets initiated` must invoke the scheduled callback. Asserting `setInterval` alone does not prove the reporter syncs.
