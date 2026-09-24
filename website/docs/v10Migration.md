---
id: v10-migration
title: From v9 to v10
---

## Node.js

WebdriverIO v10 requires Node.js 22.19.0 or later. Node.js 18 and 20 are no longer supported. CI covers Node.js 22, 24, and 26.

## Cucumber

`@wdio/cucumber-framework` depends on [`@cucumber/cucumber` 13](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300).

Cucumber 13 requires Node.js 22, 24, or 26 or later. It does not run on Node.js 20, 23, or 25. The framework package declares that same range, starting at the v10 floor of 22.19.0.

```diff
- cucumberOpts: { tagExpression: '@smoke' }
+ cucumberOpts: { tags: '@smoke' }
```

`tagExpression` is not aliased. Setting it throws, so a leftover filter cannot silently run every scenario.

Cucumber 13 no longer exports `Cli`. Programmatic runs go through `runCucumber` from `@cucumber/cucumber/api`, which is what the adapter already uses.

Other Cucumber 13 breaks (ambiguous formatter paths, parallel workers, `BeforeAll` / `AfterAll`) are described in [Cucumber's upgrade guide](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300).

## Jasmine

The legacy `jasmineNodeOpts` option is no longer read. Move its settings to `jasmineOpts`, otherwise they are ignored.

```diff
- jasmineNodeOpts: { defaultTimeoutInterval: 60000 }
+ jasmineOpts: { defaultTimeoutInterval: 60000 }
```

The deprecated `jasmineOpts.failFast` option was removed. Use `stopOnSpecFailure` instead.

```diff
- jasmineOpts: { failFast: true }
+ jasmineOpts: { stopOnSpecFailure: true }
```

## Multiremote Global

The lowercase `multiremotebrowser` global was removed, from `@wdio/globals` and from the globals of `eslint-plugin-wdio` too. Use `multiRemoteBrowser`.

```diff
- import { multiremotebrowser } from '@wdio/globals'
+ import { multiRemoteBrowser } from '@wdio/globals'
```

## Capabilities

`specs` and `exclude` in capabilities are no longer read. Use `wdio:specs` and `wdio:exclude`.

```diff
  capabilities: [{
      browserName: 'chrome',
-     specs: ['./test/specs/chrome/**/*.js'],
-     exclude: ['./test/specs/chrome/skip.js']
+     'wdio:specs': ['./test/specs/chrome/**/*.js'],
+     'wdio:exclude': ['./test/specs/chrome/skip.js']
  }]
```

The `tunnelIdentifier` and `parentTunnel` aliases were removed from the Sauce Labs options types. Use `tunnelName` and `tunnelOwner`.

## TypeScript

The `Element`, `MultiRemoteBrowser` and `MultiRemoteElement` types exported by `webdriverio` were removed. Use the global `WebdriverIO` namespace.

```diff
- import type { Element } from 'webdriverio'
- const elem: Element = await $('#foo')
+ const elem: WebdriverIO.Element = await $('#foo')
```

## Reporters

The command `result` event and the `AfterCommandArgs` type no longer have a `name` property. Read `command` instead.

```diff
  onAfterCommand(args) {
-     console.log(args.name)
+     console.log(args.command)
  }
```

The `addEnvironment` function of `@wdio/allure-reporter` was removed. It already did nothing. Use the [`reportedEnvironmentVars`](/docs/allure-reporter) reporter option instead.
