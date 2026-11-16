# Missing await before an expect statement (wdio/await-expect)

`expect` calls must be prefixed with an `await`.

## Rule Details

Examples of **incorrect** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        await browser.url('/');
        expect(browser).toHaveTitle('Foobar');
        expect($('#spinner')).not.toBeDisplayed();
        expect.soft($('h1')).toHaveText('Welcome');
    });
});
```

Examples of **correct** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        await browser.url('/');
        await expect(browser).toHaveTitle('Foobar');
        await expect($('#spinner')).not.toBeDisplayed();
        await expect.soft($('h1')).toHaveText('Welcome');
    });
});
```
