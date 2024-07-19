---
id: coverage
title: Coverage
---

WebdriverIO's browser runner supports code coverage reporting using [`istanbul`](https://istanbul.js.org/). The testrunner will automatically instrument your code and and capture code coverage for you.

## Setup

In order to enable code coverage reporting, enable it through the WebdriverIO browser runner configuration, e.g.:

```js title=wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: process.env.WDIO_PRESET,
        coverage: {
            enabled: true
        }
    }],
    // ...
}
```

Checkout all [coverage options](/docs/runner#coverage-options), to learn how to properly configure it.

## Ignoring Code

There may be some sections of your codebase that you wish to purposefully exclude from coverage tracking, to do so you can use the following parsing hints:

- `/* istanbul ignore if */`: ignore the next if statement.
- `/* istanbul ignore else */`: ignore the else portion of an if statement.
- `/* istanbul ignore next */`: ignore the next thing in the source-code ( functions, if statements, classes, you name it).
- `/* istanbul ignore file */`: ignore an entire source-file (this should be placed at the top of the file).

:::info

It is recommended to exclude your test files from the coverage reporting as it could cause errors, e.g. when calling `execute` or `executeAsync` commands. If you like to keep them in your report, ensure your exclude instrumenting them via:

```ts
await browser.execute(/* istanbul ignore next */() => {
    // ...
})
```

:::
