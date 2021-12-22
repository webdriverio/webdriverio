WebdriverIO Types
=================

This package contains a bunch of TypeScript types for internal WebdriverIO consumption. Feel free however to use them in your TypeScript project too.

## Install

To install this package from NPM run:

```sh
npm i @wdio/types
```

## Example

The package exports the following major type bundles: `Capabilities`, `Clients`, `Options`, `Services`, `Frameworks` and ` Reporters`. A lot of them are very WebdriverIO specific but you can leverage some, e.g.

```js
import { Capabilities } from '@wdio/types';

const w3cCaps: Capabilities.W3CCapabilities = {
    alwaysMatch: {...},
    firstMatch: [],
    // fails with "Object literal may only specify known properties, and 'invalid' does not exist in type 'W3CCapabilities'.ts(2322)"
    invalid: 42
}
```

For details please take a look into the individual files.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
