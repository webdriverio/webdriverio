---
id: component-testing
title: Component Testing
---

With WebdriverIOs [Browser Runner](/docs/runner#browser-runner) you can run tests within an actual desktop or mobile browser while using WebdriverIO and the WebDriver protocol to automate and interact what gets rendered on the page. This approach has [many advantages](/docs/runner#browser-runner) compared to other test frameworks that only allow testing against [JSDOM](https://www.npmjs.com/package/jsdom). This approach has [many advantages](/docs/runner#browser-runner) compared to other test frameworks that only allow testing against [JSDOM](https://www.npmjs.com/package/jsdom).

## How does it Work?

The Browser Runner uses [Vite](https://vitejs.dev/) to render a test page and initialize a test framework to run your tests in the browser. Currently it only supports Mocha but Jasmine and Cucumber are [on the roadmap](https://github.com/orgs/webdriverio/projects/1). This allows to test any kind of components even for projects that don't use Vite. Currently it only supports Mocha but Jasmine and Cucumber are [on the roadmap](https://github.com/orgs/webdriverio/projects/1). This allows to test any kind of components even for projects that don't use Vite.

The Vite server is started by the WebdriverIO testrunner and configured so that you can use all reporter and services as you used to for normal e2e tests. Furthermore it initialises a [`browser`](/docs/api/browser) instance that allows you to access a subset of the [WebdriverIO API](/docs/api) to interact with the any elements on the page. Similar as e2e tests you can access that instance through the `browser` variable attached to the global scope or by importing it from `@wdio/globals` depending on how [`injectGlobals`](/docs/api/globals) is set. Furthermore it initialises a [`browser`](/docs/api/browser) instance that allows you to access a subset of the [WebdriverIO API](/docs/api) to interact with the any elements on the page. Similar as e2e tests you can access that instance through the `browser` variable attached to the global scope or by importing it from `@wdio/globals` depending on how [`injectGlobals`](/docs/api/globals) is set.

## Setup

To set-up WebdriverIO for unit or component testing in the browser, initiate a new WebdriverIO project via:

```bash
npm init wdio@latest ./
# or
yarn create wdio ./
```

Once the configuration wizard starts, pick `browser` for running unit and component testing and choose one of the presets if desired otherwise go with _"Other"_ if you only want to run basic unit tests. You can also configure a custom Vite configuration if you use Vite already in your project. For more information check out all [runner options](/docs/runner#runner-options). You can also configure a custom Vite configuration if you use Vite already in your project. For more information check out all [runner options](/docs/runner#runner-options).

:::info

__Note:__ WebdriverIO by default will run browser tests in CI headlessly, e.g. a `CI` environment variable is set to `'1'` or `'true'`. You can manually configure this behavior using the [`headless`](/docs/runner#headless) option for the runner. You can manually configure this behavior using the [`headless`](/docs/runner#headless) option for the runner.

:::

At the end of this process you should find a `wdio.conf.js` that contains various WebdriverIO configurations, including a `runner` property, e.g.:

```ts reference useHTTPS runmeRepository="git@github.com:webdriverio/example-recipes.git" runmeFileToOpen="component-testing%2FREADME.md"
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/wdio.comp.conf.js
```

By defining different [capabilities](/docs/configuration#capabilities) you can run your tests in different browser, in parallel if desired.

## Test Harness

It is totally up to you what you want to run in your tests and how you like to render the components. It is totally up to you what you want to run in your tests and how you like to render the components. However we recommend to use the [Testing Library](https://testing-library.com/) as utility framework as it provides plugins for various of component frameworks, such as React, Preact, Svelte and Vue. It is very useful for rendering components into the test page and it automatically cleans up these components after every test. It is very useful for rendering components into the test page and it automatically cleans up these components after every test.

You can mix Testing Library primitives with WebdriverIO commands as you wish, e.g.:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fd54f94306ed8e7b40f967739164dfe4d6d76b41/component-testing/svelte-example.js
```

__Note:__ using render methods from Testing Library helps remove created components between the tests. If you don't use Testing Library ensure to attach your test components to a container that gets cleaned up between tests. If you don't use Testing Library ensure to attach your test components to a container that gets cleaned up between tests.

## Setup Scripts

You can set up your tests by running arbitrary scripts in Node.js or in the browser, e.g. injecting styles, mocking browser APIs or connecting to a 3rd party service. The WebdriverIO [hooks](/docs/configuration#hooks) can be used to run code in Node.js while the [`mochaOpts.require`](/docs/frameworks#require) allows you to import scripts into the browser before tests are loaded, e.g.: The WebdriverIO [hooks](/docs/configuration#hooks) can be used to run code in Node.js while the [`mochaOpts.require`](/docs/frameworks#require) allows you to import scripts into the browser before tests are loaded, e.g.:

```js wdio.conf.js
export const config = {
    // ...
    mochaOpts: {
        ui: 'tdd',
        // provide a setup script to run in the browser
        require: './__fixtures__/setup.js'
    },
    before: () => {
        // set up test environment in Node.js
    }
    // ...
}
```

For example, if you like to mock all [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) calls in your test with the following set-up script:

```js ./fixtures/setup.js
import { fn } from '@wdio/browser-runner'

// run code before all tests are loaded
window.fetch = fn()

export const mochaGlobalSetup = () => {
    // run code after test file is loaded
}

export const mochaGlobalTeardown = () => {
    // run code after spec file was executed
}

```

Now in your tests you can provide custom response values for all browser requests. Read more on global fixtures in the [Mocha docs](https://mochajs.org/#global-fixtures). Read more on global fixtures in the [Mocha docs](https://mochajs.org/#global-fixtures).

## Watch Test and Application Files

There are multiple ways how you can debug your browser tests. There are multiple ways how you can debug your browser tests. The easiest is to start the WebdriverIO testrunner with the `--watch` flag, e.g.:

```sh
$ npx wdio run ./wdio.conf.js --watch
```

This will run through all tests initially and halt once all are run. You can then make changes to individual files which then will be rerun individually. This will run through all tests initially and halt once all are run. You can then make changes to individual files which then will be rerun individually. If you set a [`filesToWatch`](/docs/configuration#filestowatch) pointing to your application files, it will re-run all tests when changes to your app are being made.

## Debugging

While it is not (yet) possible to set breakpoints in your IDE and have them being recognised by the remote browser, you can use the [`debug`](/docs/api/browser/debug) command to stop the test at any point. This allows you to open DevTools to then debug the test by setting breakpoints in the [sources tab](https://buddy.works/tutorials/debugging-javascript-efficiently-with-chrome-devtools). This allows you to open DevTools to then debug the test by setting breakpoints in the [sources tab](https://buddy.works/tutorials/debugging-javascript-efficiently-with-chrome-devtools).

When the `debug` command is called, you will also get a Node.js repl interface in your terminal, saying:

```
The execution has stopped!
You can now go into the browser or use the command line as REPL
(To exit, press ^C again or type .exit)
```

Press `Ctrl` or `Command` + `c` or enter `.exit` to continue with the test.

## Examples

You can find various examples for testing components using popular component frameworks in our [example repository](https://github.com/webdriverio/component-testing-examples).
