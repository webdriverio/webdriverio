WDIO Globals
============

> A helper utility for importing global variables directly

This package can be used to import global variables explicitly, e.g.

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

For more information on WebdriverIO Globals, check out the [docs](https://webdriver.io/docs/api/globals).
