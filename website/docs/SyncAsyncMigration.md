---
id: async-migration
title: From Sync to Async
---

Due to changes in V8 the WebdriverIO team [announced](https://webdriver.io/blog/2021/07/28/sync-api-deprecation) to deprecate synchronous command execution by April 2023. The team has been working hard to make the transition as easy as possible. In this guide we explain how you can slowly migrate your test suite from sync to async. As an example project we use the [Cucumber Boilerplate](https://github.com/webdriverio/cucumber-boilerplate) but the approach is the same with all other projects as well.

## Promises in JavaScript

The reason why synchronous execution was popular in WebdriverIO is because it removes the complexity of dealing with promises. Particularly if you come from other languages where this concept doesn't exist this way, it can be confusing in the beginning. However Promises are a very powerful tool to deal with asynchronous code and today's JavaScript makes it actually easy to deal with it. If you never worked with Promises, we recommend to check out the [MDN reference guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) to it as it would be out of scope to explain it here.

## Async Transition

The WebdriverIO testrunner can handle async and sync execution within the same test suite. This means that you can slowly migrate your tests and PageObjects step by step at your pace. For example, the Cucumber Boilerplate has defined [a large set of step definition](https://github.com/webdriverio/cucumber-boilerplate/tree/main/src/support/action) for you to copy into your project. We can go ahead and migrate one step definition or one file at a time.

:::tip

WebdriverIO offers a [codemod](https://github.com/webdriverio/codemod) that allows to transform your sync code into async code almost full automatically. Run the codemod as described in the docs first and use this guide for manual migration if needed.

:::

In many cases, everything that is necessary to do is to make the function in which you call WebdriverIO commands `async` and add an `await` in front of every command. Looking at the first file `clearInputField.ts` to transform in the boilerplate project, we transform from:

```ts
export default (selector: Selector) => {
    $(selector).clearValue();
};
```

to:

```ts
export default async (selector: Selector) => {
    await $(selector).clearValue();
};
```

That's it. You can see the complete commit with all rewrite examples here:

#### Commits:

- _transform all step definitions_ [[af6625f]](https://github.com/webdriverio/cucumber-boilerplate/pull/481/commits/af6625fcd01dc087479e84562f237ecf38b3537d)

:::info
This transition is independent of whether you use TypeScript or not. If you use TypeScript just make sure that you eventually change the `types` property in your `tsconfig.json` from `webdriverio/sync` to `@wdio/globals/types`. Also make sure that your compile target is set to at least `ES2018`.
:::

## Special Cases

There are of course always special cases where you need to pay a bit more attention.

### ForEach Loops

If you have a `forEach` loop, e.g. to iterate over elements, you need to make sure that the iterator callback is handled properly in an async manner, e.g.:

```js
const elems = $$('div')
elems.forEach((elem) => {
    elem.click()
})
```

The function we pass into `forEach` is an iterator function. In a synchronous world it would click on all elements before it moves on. If we transform this into asynchronous code, we have to ensure that we wait for every iterator function to finish execution. By adding `async`/`await` these iterator functions will return a promise that we need to resolve. Now, `forEach` is then not ideal to iterate over the elements anymore because it doesn't return the result of the iterator function, the promise we need to wait for. Therefore we need to replace `forEach` with `map` which returns that promise. The `map` as well as all other iterator methods of Arrays like `find`, `every`, `reduce` and more are implemented via the [p-iteration](https://www.npmjs.com/package/p-iteration) package and are therefor simplified for using them in an async context. The above example looks transformed like this:

```js
const elems = await $$('div')
await elems.forEach((elem) => {
    return elem.click()
})
```

For example in order to fetch all `<h3 />` elements and get their text content, you can run:

```js
await browser.url('https://webdriver.io')

const h3Texts = await browser.$$('h3').map((img) => img.getText())
console.log(h3Texts);
/**
 * returns:
 * [
 *   'Extendable',
 *   'Compatible',
 *   'Feature Rich',
 *   'Who is using WebdriverIO?',
 *   'Support for Modern Web and Mobile Frameworks',
 *   'Google Lighthouse Integration',
 *   'Watch Talks about WebdriverIO',
 *   'Get Started With WebdriverIO within Minutes'
 * ]
 */
```

If this looks too complicated you might want to consider using simple for loops, e.g.:

```js
const elems = await $$('div')
for (const elem of elems) {
    await elem.click()
}
```

### WebdriverIO Assertions

If you use the WebdriverIO assertion helper [`expect-webdriverio`](https://webdriver.io/docs/api/expect-webdriverio) make sure to set an `await` in front of every `expect` call, e.g.:

```ts
expect($('input')).toHaveAttributeContaining('class', 'form')
```

needs to be transformed to:

```ts
await expect($('input')).toHaveAttributeContaining('class', 'form')
```

### Sync PageObject Methods and Async Tests

If you have been writing PageObjects in your test suite in a synchronous way, you won't be able to use them in asynchronous tests anymore. If you need to use a PageObject method in both sync and async tests we recommend duplicating the method and offer them for both environments, e.g.:

```js
class MyPageObject extends Page {
    /**
     * define elements
     */
    get btnStart () { return $('button=Start') }
    get loadedPage () { return $('#finish') }

    someMethod () {
        // sync code
    }

    someMethodAsync () {
        // async version of MyPageObject.someMethod()
    }
}
```

Once you've finished the migration you can remove the synchronous PageObject methods and clean up the naming.

If you don't like to maintain two different version of a PageObject method you can also migrate the whole PageObject to async and use [`browser.call`](https://webdriver.io/docs/api/browser/call) to execute the method in a synchronous environment, e.g.:

```js
// before:
// MyPageObject.someMethod()
// after:
browser.call(() => MyPageObject.someMethod())
```

The `call` command will make sure that the asynchronous `someMethod` is resolved before moving on to the next command.

## Conclusion

As you can see in the [resulting rewrite PR](https://github.com/webdriverio/cucumber-boilerplate/pull/481/files) the complexity of this rewrite is fairly easy. Remember you can rewrite one step-definition at the time. WebdriverIO is perfectly able to handle sync and async execution in a single framework.
