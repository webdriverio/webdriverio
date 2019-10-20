WebdriverIO Shared Store Service
=========================

> Exchange data between main process and workers (specs).

## Usage

Get/set a value (plain object) to/from the store by key (string).

`browser.sharedStore().set('key', 'value')` set value to store
`browser.sharedStore().get('key')` get value from store (returns `'value'`)

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
