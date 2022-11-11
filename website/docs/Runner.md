---
id: runner
title: Runner
---

import CodeBlock from '@theme/CodeBlock';

A runner in WebdriverIO orchestrates how and where tests are being run when using the testrunner. WebdriverIO currently supports two different types of runner: local and browser runner.

## Local Runner

The [Local Runner](https://www.npmjs.com/package/@wdio/local-runner) initiates your framework (e.g. Mocha, Jasmine or Cucumber) within worker a process and runs all your test files within your Node.js environment. Every test file is being run in a separate worker process per capability allowing for maximum concurrency. Every worker process uses a single browser instance and therefore runs its own browser session allowing for maximum isolation.

Given every test is run in its own isolated process, it is not possible to share data across test files. There are two ways to work around this:

- use the [`@wdio/shared-store-service`](https://www.npmjs.com/package/@wdio/shared-store-service) to share data across all workers
- group spec files (read more in [Organizing Test Suite](http://localhost:3000/docs/organizingsuites#grouping-test-specs-to-run-sequentially))

If nothing else is defined in the `wdio.conf.js` the Local Runner is the default runner in WebdriverIO.

### Install

To use the Local Runner you can install it via:

```sh
npm install --save-dev @wdio/local-runner
```

### Setup

The Local Runner is the default runner in WebdriverIO so there is no need to define it within your `wdio.conf.js`. If you want to explicitly set it, you can define it as follows:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'local',
    // ...
}
```

## Browser Runner

As opposed to the [Local Runner]((https://www.npmjs.com/package/@wdio/local-runner)) the [Browser Runner]((https://www.npmjs.com/package/@wdio/browser-runner)) initiates and executes the framework within the browser. This allows you to run unit tests or component tests in an actual browser rather than in a JSDOM like many other test frameworks.

While [JSDOM](https://www.npmjs.com/package/jsdom) is widely used for testing purposes, it is in the end not an actual browser nor can you emulate mobile environments with it. With this runner WebdriverIO enables you to easily run your tests in the browser and use WebDriver commands to interact with elements rendered on the page.

Here is an overview of running tests within JSDOM vs. WebdriverIOs Browser Runner

| | JSDOM | WebdriverIO Browser Runner |
|-|-------|----------------------------|
|1.| Runs your tests within Node.js using a re-implementation of web standards, notably the WHATWG DOM and HTML Standards | Executes your test in an actual browser and runs the code in an environment that your users use |
|2.| Interactions with components can only be imitated via JavaScript | You can use the [WebdriverIO API](api) to interact with elements through the WebDriver protocol |
|3.| Canvas support requires [additional dependencies](https://www.npmjs.com/package/canvas) and [has limitations](https://github.com/Automattic/node-canvas/issues) | You have access to the real [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
|4.| JSDOM has some [caveats](https://www.npmjs.com/package/jsdom#user-content-caveats) and unsupported Web APIs | All Web APIs are supported as test run in an actual browser |
|5.| Impossible to detect errors cross browser | Support for all browsers including mobile browser |

This runner uses [Vite](https://vitejs.dev/) to compile your test code and load it in the browser. It comes with presets for the following component frameworks:

- React
- Preact
- Vue.js
- Svelte

Every test file / test file group runs within a single page which means that between each test the page is being reloaded to guarantee isolation between tests.

### Install

To use the Browser Runner you can install it via:

```sh
npm install --save-dev @wdio/browser-runner
```

### Setup

To use the Browser runner, you have to define a `runner` property within your `wdio.conf.js` file, e.g.:

```js
// wdio.conf.js
export const {
    // ...
    runner: 'browser',
    // ...
}
```

If you test components using one of the mentioned frameworks above, you can define a preset that ensures everything is configured out of the box, e.g. when you want to import and test Svelte components, define the Browser Runner as follows:

```js
// wdio.conf.js
export const {
    // ...
    runner: ['browser', {
        preset: 'Svelte'
    }],
    // ...
}
```

Make sure to check out the docs around [component testing](https://webdriver.io/docs/component-testing) and have a look into the [example repository](https://github.com/webdriverio/component-testing-examples) for examples using these and various other frameworks.

