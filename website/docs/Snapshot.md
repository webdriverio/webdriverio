---
id: snapshot
title: Snapshot
---

Snapshot tests can be very useful for asserting a wide range of aspects of your component or logic at the same time. In WebdriverIO you can take snapshots of any arbitrary object as well as a WebElement DOM structure or WebdriverIO command results.

Similar to other test frameworks WebdriverIO will take a snapshot of the given value, then compare it to a reference snapshot file stored alongside the test. The test will fail if the two snapshots do not match: either the change is unexpected, or the reference snapshot needs to be updated to the new version of the result.

:::info Cross Platform Support

These snapshot capabilities are available for running end-to-end tests within the Node.js environment as well as for running [unit and component](/docs/component-testing) tests in the browser or on mobile devices.

:::

## Use Snapshots
To snapshot a value, you can use the `toMatchSnapshot()` from [`expect()`](/docs/api/expect-webdriverio) API:

```ts
import { browser, expect } from '@wdio/globals'

it('can take a DOM snapshot', () => {
    await browser.url('https://guinea-pig.webdriver.io/')
    await expect($('.findme')).toMatchSnapshot()
})
```

The first time this test is run, WebdriverIO creates a snapshot file that looks like this:

```js
// Snapshot v1

exports[`main suite 1 > can take a DOM snapshot 1`] = `"<h1 class="findme">Test CSS Attributes</h1>"`;
```

The snapshot artifact should be committed alongside code changes, and reviewed as part of your code review process. On subsequent test runs, WebdriverIO will compare the rendered output with the previous snapshot. If they match, the test will pass. If they don't match, either the test runner found a bug in your code that should be fixed, or the implementation has changed and the snapshot needs to be updated.

To update the snapshot, pass in the `-s` flag (or `--updateSnapshot`) to the `wdio` command, e.g.:

```sh
npx wdio run wdio.conf.js -s
```

__Note:__ if you run tests with multiple browsers in parallel only one snapshot is being created and compared against. If you like to have a separate snapshot per capability, please [raise an issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Idea+%F0%9F%92%A1%2CNeeds+Triaging+%E2%8F%B3&projects=&template=feature-request.yml&title=%5B%F0%9F%92%A1+Feature%5D%3A+%3Ctitle%3E) and let us know about your use case.

## Inline Snapshots

Similarly, you can use the `toMatchInlineSnapshot()` to store the snapshot inline within the test file.

```ts
import { expect, $ } from '@wdio/globals'

it('can take inline DOM snapshots', () => {
  const elem = $('.container')
  await expect(elem.getCSSProperty()).toMatchInlineSnapshot()
})
```

Instead of creating a snapshot file, Vitest will modify the test file directly to update the snapshot as a string:

```ts
import { expect, $ } from '@wdio/globals'

it('can take inline DOM snapshots', () => {
    const elem = $('.container')
    await expect(elem.getCSSProperty()).toMatchInlineSnapshot(`
        {
            "parsed": {
                "alpha": 0,
                "hex": "#000000",
                "rgba": "rgba(0,0,0,0)",
                "type": "color",
            },
            "property": "background-color",
            "value": "rgba(0,0,0,0)",
        }
    `)
})
```

This allows you to see the expected output directly without jumping across different files.

## Visual Snapshots

Taking a DOM snapshot of an element might not be the best idea, especially if the DOM structure is too big and contains dynamic element properties. In these cases, it is recommended to rely on visual snapshots for elements.

To enable visual snapshots, add the `@wdio/visual-service` to your setup. You can follow the set-up instructions in the [documentation](/docs/visual-testing#installation) for Visual Testing.

You can then take a visual snapshot via `toMatchElementSnapshot()`, e.g.:

```ts
import { expect, $ } from '@wdio/globals'

it('can take inline DOM snapshots', () => {
  const elem = $('.container')
  await expect(elem.getCSSProperty()).toMatchInlineSnapshot()
})
```

An image is then stored in the baseline directory. Check out the [Visual Testing](/docs/visual-testing) for more information.
