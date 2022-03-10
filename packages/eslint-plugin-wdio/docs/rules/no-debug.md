# Disallow browser.debug() in tests (wdio/no-debug)

`browser.debug()` statements are only useful for debuggging tests and should not be committed into the codebase.

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
