---
id: custommatchers
title: Custom Matchers
---

WebdriverIO uses a Jest style [`expect`](https://webdriver.io/docs/api/expect-webdriverio) assertion library that comes with special features and custom matchers specific for running web and mobile tests. While the library of matchers is big, it certainly doesn't fit all possible situations. Therefore it is possible to extend the existing matchers with custom ones defined by you.

:::warning

While there is currently no difference in how matchers are defined that are specific to the [`browser`](/docs/api/browser) object or an [element](/docs/api/element) instance, this certainly might change in the future. Keep an eye on [`webdriverio/expect-webdriverio#1408`](https://github.com/webdriverio/expect-webdriverio/issues/1408) for further information on this development.

:::

## Custom Browser Matchers

To register a custom browser matcher, call `extend` on the `expect` object either in your spec file directly or as part of the e.g. `before` hook in your `wdio.conf.js`:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e719632df8f241f923c8d9301aab6bccee5cb109/customMatchers/example.ts#L3-L18
```

As shown in the example the matcher function takes the expected object, e.g. the browser or element object, as the first parameter and the expected value as the second. You can then use the matcher as follows:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e719632df8f241f923c8d9301aab6bccee5cb109/customMatchers/example.ts#L50-L52
```

## Custom Element Matchers

Similar to custom browser matchers, element matchers don't differ. Here is an example of how to create a custom matcher to assert the aria-label of an element:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e719632df8f241f923c8d9301aab6bccee5cb109/customMatchers/example.ts#L20-L38
```

This allows you to call the assertion as follows:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e719632df8f241f923c8d9301aab6bccee5cb109/customMatchers/example.ts#L54-L57
```

## TypeScript Support

If you are using TypeScript, one more step is required to ensure the type safety of your custom matchers. By extending the `Matcher` interface with your custom matchers, all type issues vanish:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e719632df8f241f923c8d9301aab6bccee5cb109/customMatchers/example.ts#L40-L47
```

If you created a custom [asymmetric matcher](https://jestjs.io/docs/expect#expectextendmatchers), you can similarly extend the `expect` types as follows:

```ts
declare global {
  namespace ExpectWebdriverIO {
    interface AsymmetricMatchers {
      myCustomMatcher(value: string): ExpectWebdriverIO.PartialMatcher;
    }
  }
}
```
