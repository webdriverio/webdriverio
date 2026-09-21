---
id: v10-migration
title: From v9 to v10
---

## Cucumber

`@wdio/cucumber-framework` depends on [`@cucumber/cucumber` 13](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300).

Cucumber 13 requires Node.js 22, 24, or 26. It does not run on Node.js 20 or 25. The framework package declares `engines.node` of `>=22.19.0`, which is the v10 floor.

```diff
- cucumberOpts: { tagExpression: '@smoke' }
+ cucumberOpts: { tags: '@smoke' }
```

`tagExpression` is not aliased. Setting it throws, so a leftover filter cannot silently run every scenario.

Cucumber 13 no longer exports `Cli`. Programmatic runs go through `runCucumber` from `@cucumber/cucumber/api`, which is what the adapter already uses.

Other Cucumber 13 breaks (ambiguous formatter paths, parallel workers, `BeforeAll` / `AfterAll`) are described in [Cucumber's upgrade guide](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300).
