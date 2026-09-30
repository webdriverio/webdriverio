WDIO Jasmine Framework Adapter
==============================

> A WebdriverIO plugin. Adapter for Jasmine testing framework.

## Installation

The easiest way is to keep `@wdio/jasmine-framework` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/jasmine-framework --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

Following code shows the default wdio test runner configuration...

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'jasmine',
    jasmineOpts: {
        defaultTimeoutInterval: 60000
    },
    // ...
}
```

## Assertions

The global `expect` combines Jasmine's matchers and the WebdriverIO matchers. Jasmine's sync matchers and the matchers of `jasmine.addMatchers` return `undefined`. WebdriverIO matchers, Jasmine's async matchers and the matchers of `jasmine.addAsyncMatchers` return a promise, so `await` them:

```js
expect([1, 2]).toHaveSize(2)                                   // Jasmine, sync
await expect($('#logo')).toHaveSize({ width: 32, height: 32 }) // WebdriverIO, async
```

For TypeScript, add `jasmine` to `types` in your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "types": ["node", "jasmine", "@wdio/globals/types", "@wdio/jasmine-framework"]
    }
}
```

See [Using Jasmine](https://webdriver.io/docs/frameworks#assertions) for the details.

## `jasmineOpts` Options

### defaultTimeoutInterval

<Option type="Number" default="60000">

Timeout until specs will be marked as failed.

</Option>

### expectationResultHandler

<Option type="Function" default="null">

Called with `(passed, assertion)` for each expectation, for example to take a screenshot every time
an expectation fails. If the function throws for a passed expectation, the expectation fails with that error.

</Option>

### grep

<Option type="RegExp | string" default="undefined">

Optional pattern to selectively select it/describe cases to run from spec files.

</Option>

### invertGrep

<Option type="Boolean" default="false">

Inverts 'grep' matches.

</Option>

### cleanStack

<Option type="Boolean" default="true">

Clean up stack trace and remove all traces of node module packages.

</Option>

### random

<Option type="Boolean" default="false">

Run specs in semi-random order. Jasmine's own default is `true`, but WebdriverIO runs the specs in order unless you set this option.

</Option>

### stopOnSpecFailure

<Option type="Boolean" default="false">

Stop the spec file at its first failed spec (`it`): the other specs of the file do not run, also in other `describe` blocks. Other spec files run in their own workers and continue.

</Option>

### oneFailurePerSpec

<Option type="Boolean" default="false">

Stop a spec at its first failed expectation. A failed sync matcher stops the spec at once, and an awaited async matcher stops it when its promise settles.

</Option>

### failSpecWithNoExpectations

<Option type="Boolean" default="false">

Fail a spec that ran no expectations. By default, such a spec passes.

</Option>

### specFilter

<Option type="Function" default="undefined">

Function that selects the specs to run. When you set it, `grep` and `invertGrep` have no effect.

</Option>

### requires

<Option type="String[]" default="[]">

Require modules prior to requiring any helper or spec files.

</Option>

### helpers

<Option type="String[]" default="[]">

Require helper files prior to requiring any spec files.

</Option>
----

For more information on WebdriverIO see the [homepage](https://webdriver.io).


