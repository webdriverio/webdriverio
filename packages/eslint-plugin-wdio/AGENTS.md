# eslint-plugin-wdio

ESLint rules and the `flat/recommended` config. Read the root [AGENTS.md](../../AGENTS.md) and [packages/AGENTS.md](../AGENTS.md) first.

## Tests

`tests/index.test.ts` owns the public plugin export: meta, `flat/recommended` severities, ignores, parser options, registered rule names, and recommended globals.

Recommended globals are the WebdriverIO names (`$`, `$$`, `browser`, `driver`, `expect`, `multiRemoteBrowser`) plus `globals.mocha` and `globals.node`, spread in that order. Assert that composition. Do not paste a snapshot of every Mocha and Node global. That list fails when the `globals` package adds a name and does not fail when this package changes the contract.

Rule behavior stays in that rule's test (`await-expect`, `no-debug`, `no-pause`) through ESLint `RuleTester`. `tests/await-expect.test.ts` also keeps `MATCHERS` aligned with `expect-webdriverio` custom matchers. Snapshot matchers are not part of that list; the rule tester owns them.
