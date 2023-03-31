WebdriverIO Shared Store Service
=========================

> Exchange data between main process and workers (specs).

## Installation

The easiest way is to keep `@wdio/shared-store-service` as a dev dependency in your `package.json`, via:

```sh
npm install @wdio/shared-store-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Usage

Get/set a value (a plain object) to/from the store by key (string). The key can be any arbitrary string except `*` which is reserved as it allows you to fetch the whole store.

### Set Values

To set values to the store call:

```js
await browser.sharedStore.set('key', 'foobar123')
```

### Get Values

To get values from the store call:

```js
const value = await browser.sharedStore.get('key')
console.log(value) // returns "foobar123"
```

You can also fetch all key values by using the `*` key:

```js
const store = await browser.sharedStore.get('*')
console.log(value) // returns `{ key: "foobar" }`
```

### Access Store in WDIO Hooks

You could also directly access to `setValue` and `getValue` async handlers.
Make sure you properly call them with the `await` keyword.

```js
// wdio.conf.js
import { setValue, getValue } from '@wdio/shared-store-service'

export const config = {
    // ...
    onPrepare: [async function (config, capabilities) {
        await setValue('foo', 'bar')
    }],
    // ...
    after: async () => {
        const value = await getValue('foo')
        // ...
    }
```

IMPORTANT! Every spec file should be atomic and isolated from others' specs.
The idea of the service is to deal with very specific environment setup issues.
Please avoid sharing test execution data!

## Configuration

Add `shared-store` to the services list and the `sharedStore` object will be accessible to you on the [`browser` scope](https://webdriver.io/docs/api/browser) in your test.

```js
// wdio.conf.js
export const config = {
    // ...
    services: ['shared-store'],
    // ...
};
```
