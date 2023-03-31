# Missing await before an expect statement (wdio/await-expect)

`expect` calls must be prefixed with an `await`.

## Rule Details

Examples of **incorrect** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        await browser.url('/');
        expect(browser).toHaveTitle('Foobar');
    });
});
```

Examples of **correct** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        await browser.url('/');
        await expect(browser).toHaveTitle('Foobar');
    });
});
```
