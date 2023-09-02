---
id: bestpractices
title: Best Practices
---

# Best Practices

This guide aims to share our best practices that help you write performant and resilient tests. 

## Use resilient selectors

__Note:__ To find out all the possible selectors WebdriverIO supports, checkout our [Selectors](./Selectors.md) page.

Use selectors that are resilient to changes in the DOM.

```js reference useResilientSelectors
await $('button[type="submit"]');
```

## Limit DOM interactions

Everytime you use the $ or $$ command, WebdriverIO tries to locate the element in the DOM. These operations are very expensive so you should try to limit them as much as possible.

### Prefer using a single selector over chaining

Interacts with the DOM three times.

```js
// 👎
await $('table').$('tr').$('td');
```

interacts with the DOM only once.

``` js
// 👍
await $('table tr td');
```

### Prefer locating a single element instead of taking one from a list

It is not always possible to do this but using CSS pseudo-classes like [:nth-child](https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child) you can match elements based on the indexes of the elements in the child list of their parents.

Queries all table rows.

```js
// 👎
await $$('table tr')[15];
```

Queries a single table row.

```js
// 👍
await $('table tr:nth-child(15)');
```

## Use the built-in assertions

Don't use manual assertions that do not automatically wait for the results to match as this will cause for flaky tests.

```js
// 👎
expect(await button.isDisplayed()).toBe(true);
```

By using the built-in assertions WebdriverIO will automatically wait for the actual result to match the expected result resulting in resilient tests.

```js
// 👍
await expect(button).toBeDisplayed();
```

## Don't overuse commands and assertions

When using expect.toBeDisplayed you implicitly also wait for the element to exist. There isn't a need to use the waitForXXX commands when you already have an assertion doing the same thing.

```js
// 👎
await button.waitForExist();
await expect(button).toBeDisplayed();

// 👎
await button.waitForDisplayed();
await expect(button).toBeDisplayed();

// 👍
await expect(button).toBeDisplayed();
```

No need to wait for an element to exist or be displayed when interacting or when asserting something like it's text unless the element can explicitly be invisible (opacity: 0; for example) or can explicitly be disabled (disabled attribute for example) in which case waiting for the element to be displayed makes sense.

```js
// 👎
await expect(button).toBeExisting();
await expect(button).toHaveText('Submit');

// 👎
await expect(button).toBeDisplayed();
await expect(button).toHaveText('Submit');

// 👎
await expect(button).toBeDisplayed();
await expect(button).click();
```

```js
// 👍
await expect(button).click();

// 👍
await expect(button).toHaveText('Submit');
```

## Lint your code

Using eslint to lint your code you can potentionally catch errors early, use our [linting rules](https://www.npmjs.com/package/eslint-plugin-wdio) to make sure that some of the best practices are always applied.

## Don't pause

It can be tempting to use the pause command but using this is a bad idea as it isn't resilient and will only cause for flaky tests in the long run.

```js
// 👎
await nameInput.setValue('Bob');
await browser.pause(200); // wait for submit button to enable
await submitFormButton.click();

// 👍
await nameInput.setValue('Bob');
await submitFormButton.waitForEnabled();
await submitFormButton.click();
```

## Async loops

When you have some asynchronous code that you want to repeat, it is important to know that not all loops can do this.

The following will not click the elements in order.

```js
// 👎
elements.forEach(async (element) => {
    await element.click();
});
```

The following will click the elements in order.

```js
// 👍
for (const element of elements) {
    await element.click();
}
```

## Executing code in parallel

If you do not care about the order in which some code is ran you can utilze Promise.all to speed up the execution.

__Note:__ Since this makes the code harder to read you could abstract this away using a page object or a function, although you should also question if the benefit in performance is worth the cost of readability.

```js
// 👎
await name.setValue('Bob');
await email.setValue('bob@webdriver.io');
await age.setValue('50');
await submitFormButton.waitForEnabled();
await submitFormButton.click();

// 👍
await Promise.all([
    name.setValue('Bob'),
    email.setValue('bob@webdriver.io'),
    age.setValue('50'),
]);
await submitFormButton.waitForEnabled();
await submitFormButton.click();
```

If abstracted away it could look something like below where the logic is put in a method called submitWithDataOf and the data is retrieved by the Person class.

```js
// 👍
await form.submitData(new Person('bob@webdriver.io'))
```