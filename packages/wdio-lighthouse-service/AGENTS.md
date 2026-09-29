# @wdio/lighthouse-service

Read [packages/AGENTS.md](../AGENTS.md) first.

## Test ownership

- CDP events are observable through `browser.emit`. Do not keep a gatherer or log buffer whose only reader is a unit test.
- `getPageWeight` tests use the real byte totals. Do not stub `sumByKey` with a constant and assert that constant.
- Throttling profile numbers, traced command names, PWA scoring, trace-buffer parsing, and Lighthouse metric mapping each have one owner suite. Command-handler tests cover when a flow starts, falls back, or is cancelled.
- `checkPWA` returns one audit result for a single browser and an array for multi-remote. Keep that return-shape branch.
