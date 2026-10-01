# Require promises to be handled (wdio/no-floating-promise)

WebdriverIO commands return promises. A command that is not awaited can run after the test ends, or its error is lost.

This rule is the type-aware [`no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises/) rule of `typescript-eslint`. It checks every promise, not only `expect` calls. The recommended configuration enables it, and turns off `wdio/await-expect`, when `typescript-eslint` is installed. See [TypeScript Support](../../README.md#typescript-support).

The rule needs type information. The recommended configuration sets `parserOptions.projectService: true`, so your spec files must be part of a `tsconfig.json`.

## Rule Details

Examples of **incorrect** code for this rule:

```ts
describe('my feature', () => {
    it('should do something', async () => {
        browser.url('/');
        expect(browser).toHaveTitle('Foobar');
    });
});
```

Examples of **correct** code for this rule:

```ts
describe('my feature', () => {
    it('should do something', async () => {
        await browser.url('/');
        await expect(browser).toHaveTitle('Foobar');
    });
});
```

## Config

The rule takes the same options as [`@typescript-eslint/no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises/#options).
