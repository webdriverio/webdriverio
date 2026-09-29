# @wdio/appium-service

Read the root [AGENTS.md](../../AGENTS.md) and [packages/AGENTS.md](../AGENTS.md) first.

## Test ownership

Selector suggestions come from page-source analysis:
`convertXPathToOptimizedSelector` calls `findElementByXPathWithFallback`, then
`buildSelectorFromElementData`. Do not add a static XPath-to-class-chain or
predicate converter, or tests for one, unless a production caller uses it.

Unmappable XPath features (axes, functions, and a top-level `|`) are owned by
`detectUnmappableXPathFeatures`. Converter tests that mock that function do
not prove detection. Keep a quoted-pipe case next to the union case so a
naive `includes('|')` check cannot satisfy the test.

`SelectorPerformanceService` classifies commands with `USER_COMMANDS` and an
internal `findElement` / `findElements` set. Report context (suite, test, and
file) is owned by `MobileSelectorPerformanceReporter`, which writes
`mspo-store`. Do not revive `isElementFindCommand` or a parallel
`test-context` helper that nothing in the service calls.

Service and reporter tests mock `mspo-store`, so store behavior stays in
`mspo-store.test.ts`. `clearPerformanceData` must leave suite context in place;
`clearStore` clears context, device name, and performance rows.
