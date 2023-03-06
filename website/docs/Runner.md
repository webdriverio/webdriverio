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

As opposed to the [Local Runner](https://www.npmjs.com/package/@wdio/local-runner) the [Browser Runner](https://www.npmjs.com/package/@wdio/browser-runner) initiates and executes the framework within the browser. This allows you to run unit tests or component tests in an actual browser rather than in a JSDOM like many other test frameworks.

While [JSDOM](https://www.npmjs.com/package/jsdom) is widely used for testing purposes, it is in the end not an actual browser nor can you emulate mobile environments with it. With this runner WebdriverIO enables you to easily run your tests in the browser and use WebDriver commands to interact with elements rendered on the page.

Here is an overview of running tests within JSDOM vs. WebdriverIOs Browser Runner

| | JSDOM | WebdriverIO Browser Runner |
|-|-------|----------------------------|
|1.| Runs your tests within Node.js using a re-implementation of web standards, notably the WHATWG DOM and HTML Standards | Executes your test in an actual browser and runs the code in an environment that your users use |
|2.| Interactions with components can only be imitated via JavaScript | You can use the [WebdriverIO API](api) to interact with elements through the WebDriver protocol |
|3.| Canvas support requires [additional dependencies](https://www.npmjs.com/package/canvas) and [has limitations](https://github.com/Automattic/node-canvas/issues) | You have access to the real [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
|4.| JSDOM has some [caveats](https://github.com/jsdom/jsdom#caveats) and unsupported Web APIs | All Web APIs are supported as test run in an actual browser |
|5.| Impossible to detect errors cross browser | Support for all browsers including mobile browser |
|6.| Can __not__ test for element pseudo states | Support for pseudo states such as `:hover` or `:active` |

This runner uses [Vite](https://vitejs.dev/) to compile your test code and load it in the browser. It comes with presets for the following component frameworks:

- React
- Preact
- Vue.js
- Svelte
- SolidJS

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

### Runner Options

The Browser runner allows following configurations:

#### `preset`

If you test components using one of the mentioned frameworks above, you can define a preset that ensures everything is configured out of the box. This option can't be used together with `viteConfig`.

__Type:__ `vue` | `svelte` | `solid` | `react` | `preact`<br />
__Example:__

```js title="wdio.conf.js"
export const {
    // ...
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
}
```

#### `viteConfig`

Define your own [Vite configuration](https://vitejs.dev/config/). You can either pass in a custom object or import an existing `vite.conf.ts` file if you use Vite.js for development. Note that WebdriverIO keeps custom Vite configurations to set up the test harness.

__Type:__ `string` or [`UserConfig`](https://github.com/vitejs/vite/blob/52e64eb43287d241f3fd547c332e16bd9e301e95/packages/vite/src/node/config.ts#L119-L272) or `(env: ConfigEnv) => UserConfig | Promise<UserConfig>`<br />
__Example:__

```js title="wdio.conf.ts"
import viteConfig from '../vite.config.ts'

export const {
    // ...
    runner: ['browser', { viteConfig }],
    // or just:
    runner: ['browser', { viteConfig: '../vites.config.ts' }],
    // or use a function if your vite config contains a lot of plugins
    // which you only want to resolve when value is read
    runner: ['browser', {
        viteConfig: () => ({
            // ...
        })
    }],
    // ...
}
```

#### `headless`

If set to `true` the runner will update capabilities to run tests headless. By default this is enabled within CI environments where a `CI` environment variable is set to `'1'` or `'true'`.

__Type:__ `boolean`<br />
__Default:__ `false`, set to `true` if `CI` environment variable is set

#### `rootDir`

Project root directory.

__Type:__ `string`<br />
__Default:__ `process.cwd()`

#### `coverage`

WebdriverIO supports test coverage reporting through [`istanbul`](https://istanbul.js.org/). See [Coverage Options](#coverage-options) for more details.

__Type:__ `object`<br />
__Default:__ `undefined`

### Coverage Options

The following options allow to configure coverage reporting.

#### `enabled`

Enables coverage collection.

__Type:__ `boolean`<br />
__Default:__ `false`

#### `include`

List of files included in coverage as glob patterns.

__Type:__ `string[]`<br />
__Default:__ `[**]`

#### `exclude`

List of files excluded in coverage as glob patterns.

__Type:__ `string[]`<br />
__Default:__

```
[
  'coverage/**',
  'dist/**',
  'packages/*/test{,s}/**',
  '**/*.d.ts',
  'cypress/**',
  'test{,s}/**',
  'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
  '**/__tests__/**',
  '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
  '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
]
```

#### `extension`

List of file extensions the report should include.

__Type:__ `string | string[]`<br />
__Default:__ `['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte']`

#### `reportsDirectory`

Directory to write coverage report to.

__Type:__ `string`<br />
__Default:__ `./coverage`

#### `reporter`

Coverage reporters to use. See [istanbul documentation](https://istanbul.js.org/docs/advanced/alternative-reporters/) for detailed list of all reporters.

__Type:__ `string[]`<br />
__Default:__ `['text', 'html', 'clover', 'json-summary']`

#### `perFile`

Check thresholds per file. See `lines`, `functions`, `branches` and `statements` for the actual thresholds.

__Type:__ `boolean`<br />
__Default:__ `false`

#### `clean`

Clean coverage results before running tests.

__Type:__ `boolean`<br />
__Default:__ `true`

#### `lines`

Threshold for lines.

__Type:__ `number`<br />
__Default:__ `undefined`

#### `functions`

Threshold for functions.

__Type:__ `number`<br />
__Default:__ `undefined`

#### `branches`

Threshold for branches.

__Type:__ `number`<br />
__Default:__ `undefined`

#### `statements`

Threshold for statements.

__Type:__ `number`<br />
__Default:__ `undefined`

### Examples

Make sure to check out the docs around [component testing](https://webdriver.io/docs/component-testing) and have a look into the [example repository](https://github.com/webdriverio/component-testing-examples) for examples using these and various other frameworks.

