# Missing await before a deep selector (wdio/await-deep-selector)

`$('>>>selector')` calls must be prefixed with an `await`.

## Rule Details

Examples of **incorrect** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        const myButton = $('>>>button');
         const myButtons = $$('>>>button');
        await expect(myButton).toBeDisplayed();
        await expect($('>>>.foo')).toBeDisplayed();
    });
});
```

Examples of **correct** code for this rule:

```js
describe('my feature', () => {
    it('should do something', async () => {
        const myButton = await $('>>>button');
        const myButtons = await $$('>>>button');
        await expect(myButton).toBeDisplayed();
        await expect(await $('>>>.foo')).toBeDisplayed();
    });
});
```
