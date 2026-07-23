---
id: coverage
title: Coverage
---

WebdriverIO's browser runner supports code coverage reporting using [`istanbul`](https://istanbul.js.org/). The testrunner will automatically instrument your code using Vite and capture code coverage for you.

## How it Works

The `@wdio/browser-runner` uses Vite to serve your application. When you enable coverage, it adds a plugin to the Vite server that attempts to instrument your source code on the fly as it is requested by the browser.

:::warning Important
**Do not navigate away from the test runner!**

Code coverage relies on the files being served and instrumented by the local Vite server started by WebdriverIO.
If you use `browser.url('http://...')` or `browser.url('file://...')` to navigate to a different page, you are leaving the instrumented environment. Your code will run, but **no coverage will be collected**.

**Correct Approach (Component Testing):**
Render your component or import your module directly in the test file.

```js
import { myFunction } from '../src/utils.js'

it('should cover my function', () => {
    myFunction() // This is covered
})
```

**Incorrect Approach (E2E Style):**
```js
it('will not have coverage', async () => {
    // ❌ navigating away breaks instrumentation
    await browser.url('http://localhost:3000')
})
```
:::

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

:::tip Configuration Tips
If you are testing non-standard files (like inline scripts in `.html`) or if your files are not being picked up, you may need to explicitly verify your `include` and `extension` options:

```js
coverage: {
    enabled: true,
    // Explicitly target your source files if default resolution fails
    include: ['src/**/*.js', 'src/**/*.vue'],
    // Add .html if you have inline scripts
    extension: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.html']
}
```
:::

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
