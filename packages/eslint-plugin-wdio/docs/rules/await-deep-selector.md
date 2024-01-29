# Missing await before a deep selector (wdio/await-deep-selector)

`$('>>>selector')` calls must be prefixed with an `await`.

## Rule Details

Examples of **incorrect** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        const myButton = $('>>>button');
        expect(myButton).toBeDisplayed();
    });
});
```

Examples of **correct** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        const myButton = await $('>>>button');
        expect(myButton).toBeDisplayed();
    });
});
```
