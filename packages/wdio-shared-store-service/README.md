WebdriverIO Shared Store Service
=========================

> Exchange data between main process and workers (specs).

## Installation

The easiest way is to keep `@wdio/shared-store-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/shared-store-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Usage

Get/set a value (plain object) to/from the store by key (string).

`browser.sharedStore.set('key', 'value')` set value to store

`browser.sharedStore.get('key')` get value from store (returns `'value'`)

You could also directly access to `setValue` and `getValue` async handlers.
Make sure you properly call them with the `await` keyword.

```js
import { setValue } from '@wdio/shared-store-service'

// ...
onPrepare: [async function (config, capabilities) {
    await setValue('foo', 'bar')
}],
```

IMPORTANT! Every spec file should be atomic and isolated from others specs.
The idea of the service is to deal with very specific environment setup issues.
Please avoid sharing test execution data!

## Configuration

Just add `shared-store` to services list and the `sharedStore` object will be accessible to you in your test.

```js
// wdio.conf.js
export.config = {
    // ...
    services: ['shared-store'],
    // ...
};
```
