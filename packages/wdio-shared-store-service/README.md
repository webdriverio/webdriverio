WebdriverIO Shared Store Service
=========================

> Exchange data between main process and workers (specs).

## Usage

Get/set a value (plain object) to/from the store by key (string).

`browser.sharedStore().set('key', 'value')` set value to store
`browser.sharedStore().get('key')` get value from store (returns `'value'`)

IMPORTANT! Every spec file should be atomic and isolated from others specs.
The idea of the service is to deal with very specific environment setup issues.
Please avoid sharing test execution data!

## Configuration

Just add service to services

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['shared-store'],
  // ...
};
```
