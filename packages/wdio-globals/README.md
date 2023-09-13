WDIO Globals
============

> A helper utility for importing global variables directly

In your test files, WebdriverIO puts each of these methods and objects into the global environment. You don't have to import anything to use them. However, if you prefer explicit imports, you can do `import { browser, $, $$, expect } from '@wdio/globals'` and set `injectGlobals: false` in your WDIO configuration.

The following global objects are set if not configured otherwise:

- `browser`: WebdriverIO Browser object
- `driver`: alias to browser (used when running mobile tests)
- `multiremotebrowser`: alias to browser or driver but only set for Multiremote sessions
- `$`: command to fetch an element (see more in API docs)
- `$$`: command to fetch elements (see more in API docs)
- `expect`: assertion framework for WebdriverIO (see API docs)

Note: WebdriverIO has no control of used frameworks (e.g. Mocha or Jasmine) setting global variables when bootstrapping their environment.

## Install

To install the package, run:

```sh
npm i @wdio/globals --save-dev
```

## Usage

You can implicitly import WebdriverIO primitives as following:

```ts
import { browser, $, $$, expect } from '@wdio/globals'

describe('my test', () => {
    // ...

    it('can do something', async () => {
        // ...
    })

    // ...
})
```

## TypeScript

If you have a TypeScript project you can propagate the WebdriverIO namespace by adding this package to the `types` list, e.g.:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types"]
    }
}
```

For more information on WebdriverIO Globals, check out the [docs](https://webdriver.io/docs/api/globals).
