---
id: globals
title: Globals
---

In your test files, WebdriverIO puts each of these methods and objects into the global environment. You don't have to import anything to use them. However, if you prefer explicit imports, you can do `import { browser, $, $$, expect } from '@wdio/globals'` and set `injectGlobals: false` in your WDIO configuration.

The following global objects are set if not configured otherwise:

- `browser`: WebdriverIO [Browser object](https://webdriver.io/docs/api/browser)
- `driver`: alias to `browser` (used when running mobile tests)
- `multiremotebrowser`: alias to `browser` or `driver` but only set for [Multiremote](/docs/multiremote) sessions
- `$`: command to fetch an element (see more in [API docs](/docs/api/browser/$))
- `$$`: command to fetch elements (see more in [API docs](/docs/api/browser/$$))
- `expect`: assertion framework for WebdriverIO (see [API docs](/docs/api/expect-webdriverio))

__Note:__ WebdriverIO has no control of used frameworks (e.g. Mocha or Jasmine) setting global variables when bootstrapping their environment.
