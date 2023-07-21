WebdriverIO Local Runner
========================

> A WebdriverIO runner to run tests locally within worker processes

The [Local Runner](https://www.npmjs.com/package/@wdio/local-runner) initiates your framework (e.g. Mocha, Jasmine or Cucumber) within worker a process and runs all your test files within your Node.js environment. Every test file is being run in a separate worker process per capability allowing for maximum concurrency. Every worker process uses a single browser instance and therefore runs its own browser session allowing for maximum isolation.

Given every test is run in its own isolated process, it is not possible to share data across test files. There are two ways to work around this:

- use the [`@wdio/shared-store-service`](https://www.npmjs.com/package/@wdio/shared-store-service) to share data across all workers
- group spec files (read more in [Organizing Test Suite](https://webdriver.io/docs/organizingsuites#grouping-test-specs-to-run-sequentially))

If nothing else is defined in the `wdio.conf.js` the Local Runner is the default runner in WebdriverIO.

## Install

To use the Local Runner you can install it via:

```sh
npm install --save-dev @wdio/local-runner
```

## Setup

The Local Runner is the default runner in WebdriverIO so there is no need to define it within your `wdio.conf.js`. If you want to explicitly set it, you can define it as follows:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'local',
    // ...
}
```

---

For more information on WebdriverIO runner, check out the [documentation](https://webdriver.io/docs/runner).
