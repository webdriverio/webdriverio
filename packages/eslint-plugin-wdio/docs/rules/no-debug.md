# Disallow browser.debug() in tests (wdio/no-debug)

`browser.debug()` statements are only useful for debugging tests and should not be committed into the codebase.

## Rule Details

Examples of **incorrect** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        await browser.url('/');
        await browser.debug('/');
        // ...
    });
});
```

Examples of **correct** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        await browser.url('/');
        // ...
    });
});
```

## Config

An object containing:

- `instances`: **string[]** name of instances to check, default is `["browser"]`, this is useful if you are using [multiremote](https://webdriver.io/docs/multiremote) instances.

### Config examples

```js
{
    'wdio/no-debug': ['error', { instances: ['myChromeBrowser', 'myFirefoxBrowser'] }]
}
```
