---
cwd: ../
---

# Testing WebdriverIO

This project has a set of commands that help you to validate your code. Every test layer is described further below. You can run them individually or with a single command:

```sh { name=test }
$ npx runme run test:depcheck test:linting test:typings test:unit test:smoke test:component test:e2e
```

## Test Pipeline

When a PR gets submitted, WebdriverIO runs the following checks:

- [*Dependency Checks*](#dependency-checks)
  ```sh
  $ npx runme run test:depcheck
  ```

- [*Linting*](#linting)
  ```sh { name=test:linting }
  $ npx runme run --parallel test:eslint test:ejslint
  ```

- [*TypeScript Definition Tests*](#testing-type-definitions)
  ```sh
  $ npx runme run test:typings
  ```

- [*Unit Tests*](#unit-tests)
  ```sh
  $ npx runme run test:unit
  ```

- [*Smoke Tests*](#run-e2e-experience-with-smoke-tests)
  ```sh
  $ npx runme run test:smoke
  ```

- [*Component Tests*](#component-testing)
  ```sh
  $ npx runme run test:component
  ```

- [*e2e Tests*](#e2e-tests)
  ```sh
  $ npx runme run test:e2e
  ```

### Dependency Checks

We automatically check if every sub-package has all the dependencies from its `package.json` installed. This ensures that we don't forget to add any dependency to the package.
You can manually trigger this check by calling:

```sh { name=test:depcheck }
$ npx ts-node-esm ./scripts/depcheck.ts
```

### Linting

A common ESLint test to align code styles and detect syntax errors early.
You can manually trigger this check by calling:

```sh { name=test:eslint }
$ npx eslint --cache -c ./.eslintrc.cjs
```

There is also a linter for several EJS templates that help to detect errors early in development:

```sh { name=test:ejslint }
$ npx ejslint ./packages/wdio-cli/src/templates/**/*
```

### Testing Type Definitions

As we generate our type definitions, we want to be cautious that the generated definitions actually define the interface as expected. To make sure that we don't accidentally change the types and cause users' test to break, we run some simple TypeScript checks. You can run all the type definition tests by running:

```sh { name=test:typings }
# run tests for latest TypeScript version
npx runme run test:typings:setup
# Run Typing Tests
npx runme run --parallel test:typings:compile:webdriver test:typings:compile:devtools test:typings:compile:webdriverio test:typings:compile:mocha test:typings:compile:jasmine test:typings:compile:cucumber
# Clean Compiled Files
npx runme run test:typings:clean
```

This will:

- *Setup the Test Environment*
  In order to set up the correct environment for these tests we need to link WebdriverIO packages into a fake `node_modules` directory and install the required dependency for asserting types, via:
  ```sh { name=test:typings:setup }
  $ node ./tests/typings/setup.js
  $ npm i --no-save tsd
  ```

- *Run Typing Tests*
  Run all the tests for all the type definitions WebdriverIO provides. These tests just check if TypeScript can compile them according to the generated type definitions. All the type checks are located in `/webdriverio/tests/typings`. If you extend a WebdriverIO command or interfaces for other type definitions, please ensure that you have used it in these files. The directory contains tests for the asynchronous usage of WebdriverIO.

  The test process goes into every directory and tries to compile the file.

  __Test `webdriver` package based files__
  ```sh { name=test:typings:compile:webdriver }
  cd ./tests/typings/webdriver
  npx tsc --skipLibCheck
  ```

  __Test `devtools` package based files__
  ```sh { name=test:typings:compile:devtools }
  cd ./tests/typings/devtools
  npx tsc --skipLibCheck
  ```

  __Test `webdriverio` package based files__
  ```sh { name=test:typings:compile:webdriverio }
  cd ./tests/typings/webdriverio
  npx tsc --skipLibCheck
  ```

  __Test `@wdio/mocha-framework` package based files__
  ```sh { name=test:typings:compile:mocha }
  cd ./tests/typings/mocha
  npx tsc --skipLibCheck
  ```

  __Test `@wdio/jasmine-framework` package based files__
  ```sh { name=test:typings:compile:jasmine }
  cd ./tests/typings/jasmine
  npx tsc --skipLibCheck
  ```

  __Test `@wdio/cucumber-framework` package based files__
  ```sh { name=test:typings:compile:cucumber }
  cd ./tests/typings/cucumber
  npx tsc --skipLibCheck
  ```

- *Clean Compiled Files*
  ```sh { name=test:typings:clean }
  npx rimraf "./tests/typings/**/node_modules" "./tests/typings/**/dist"
  ```

For example, to test the `touchActions` properties, we have it tested in `/tests/typings/webdriverio/async.ts`:

```ts
// touchAction
const ele = await $('')
const touchAction: WebdriverIO.TouchAction = {
    action: "longPress",
    element: await $(''),
    ms: 0,
    x: 0,
    y: 0
}
await ele.touchAction(touchAction)
await browser.touchAction(touchAction)
```

as well as in `/tests/typings/sync/sync.ts`:

```ts
const ele = $('')
const touchAction: WebdriverIO.TouchAction = {
    action: "longPress",
    element: $(''),
    ms: 0,
    x: 0,
    y: 0
}
ele.touchAction(touchAction)
browser.touchAction(touchAction)
```

### Unit Tests

Like every project we unit-test our code and ensure that new patches are properly tested. The coverage threshold is pretty high so ensure that your changes cover all necessary code paths. WebdriverIO uses [Vitest](https://vitest.dev/) for running unit tests. You can trigger the test suite by calling:

```sh { name=test:unit }
npx vitest --config ./vitest.config.mts --run
```

If you are working on a specific package or test file you can narrow down the test specs to what is important to you, e.g. with watch mode enabled, via:

```sh
# run unit tests only for the webdriverio package
vitest --config ./vitest.config.mts ../packages/webdriverio --no-coverage --watch
# run unit tests only for a specific file
vitest --config ./vitest.config.mts ../packages/webdriverio/tests/module.test.ts --no-coverage --watch
```

The project tries to keep a high test coverage to ensure that changes to code are intentional and well thought through. Therefore "normally" there is a unit test file for every code file, located in a test directory. For example the unit tests for:

```
packages/webdriverio/src/commands/element/getCSSProperty.ts
```

are located in

```
packages/webdriverio/tests/commands/element/getCSSProperty.test.ts
```

If that is not the case the functionality of that file might be tested through a different file. We recommend to write unit tests for every new function being written in the code base. We advise to mock out every dependency to either other packages or modules using [Vitests mock capabilities](https://vitest.dev/guide/mocking.html).

During development it makes sense to focus running unit tests for a single file rather the whole code base. For example if you work on the `getCSSProperty` command it makes sense to run only the unit test for that specific command by calling:

```sh
npx vitest packages/webdriverio/tests/commands/element/getCSSProperty.test.ts
```

To clean up the coverage reports, run:

```sh { name=test:unit:clean }
npx rimraf ../coverage
```

### Smoke Tests

While unit tests already cover a lot of cases, we run in addition to that smoke tests that simulate test scenarios which are difficult to test on a unit level as they include functionality of dependencies that are stubbed out in unit tests. Such scenarios are, for example, proper test retries or failure handling. Smoke tests run actual e2e tests where the driver is being stubbed (via [`@wdio/smoke-test-service`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-smoke-test-service/package.json)) to return fake results. This offers you an opportunity to run a wdio test suite without setting up a browser driver and a test page. You can run all smoke tests via:

```sh { name=test:smoke }
node ./tests/smoke.runner.js
```

The [`smoke.runner.js`](https://github.com/webdriverio/webdriverio/blob/main/tests/smoke.runner.js) file triggers all tests. It contains several [test suites](https://github.com/webdriverio/webdriverio/blob/main/tests/smoke.runner.js#L365-L384) defined that run in different environments, e.g. Mocha, Jasmine and Cucumber. You can run a specific test suite by calling, e.g.:

```sh { name=test:smoke:mochaTestrunner }
node ./tests/smoke.runner.js mochaTestrunner
```

Every of these test suites are functions that trigger the wdio testrunner programmatically using the [`launch`](https://github.com/webdriverio/webdriverio/blob/main/tests/helpers/launch.js) helper method. All you need to pass in is a path to your config file and with what you want to overwrite the config. Most of the smoke test use a [common config file](https://github.com/webdriverio/webdriverio/blob/main/tests/helpers/config.js) and overwrite properties specific for their use case.

If you test custom WebDriver commands, you can define your own scenario of mock responses in the [`@wdio/webdriver-mock-service`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-webdriver-mock-service/src/index.js#L136-L147).

### Component Testing

With v8 of WebdriverIO a new testrunner was introduced that allows to run tests in the browser. To ensure that running tests on components written written in different frameworks in the browser works as expected, the project has defined a set of example component tests that verify from end to end that the browser runner works as expected. You can find all files related to component testing in `/e2e/browser-runner`.

To run the complete component test suite, run:

```sh { name=test:component }
npx runme run test:component-setup test:component-run
```

This will:

- *Setup required dependencies*
  ```sh { name=test:component-setup }
  cd ./e2e
  npm install
  ```

- *Run component test suite*
  ```sh { name=test:component-run }
  cd ./e2e
  npm run test:browser
  ```

### e2e Tests

Last but not least, we run actual e2e tests with a real browser to ensure that our WebDriver DevTools implementation is working as expected. These tests spin up headless Chrome and Firefox browsers to test the commands implemented in the `devtools` package. Given that the WebDriver functionality is already tested with [WPT](https://github.com/web-platform-tests/wpt), we don't need to do it there. In order to run these tests, an installation of [Firefox Nightly](https://www.mozilla.org/en-US/firefox/channel/desktop/#nightly) and [Google Chrome](https://www.google.com/chrome/) is required.

You can run the complete e2e test suite via:

```sh { name=test:e2e }
npx runme run --parallel test:e2e:devtools test:e2e:edge test:e2e:firefox test:e2e:cloud test:e2e-cjs
```

This will:

- *Validate `devtools` package*
  These tests verify that the WebDriver command implementations with Puppeteer behave as expected according to the WebDriver specification.
  ```sh { name=test:e2e:devtools }
  npx vitest --config ./e2e/vitest.config.ts --run
  ```

- *Validate Starting Edge Browser*
  This test validates if the `devtools` package can find and start the Microsoft Edge browser.
  ```sh { name=test:e2e:edge }
  npx vitest --config ./e2e/standalone/vitest.config.ts edge.e2e.ts --run
  ```

- *Validate Starting Firefox Browser*
  This test validates if the `devtools` package can find and start the Firefox browser.
  ```sh { name=test:e2e:firefox }
  npx vitest --config ./e2e/standalone/vitest.config.ts firefox.e2e.ts --run
  ```

- *Validate Cloud Connection*
  This test validates WebdriverIO can connect seamlessly with cloud vendors such as Sauce Labs.
  ```sh { name=test:e2e:cloud }
  node --loader ts-node/esm ./packages/wdio-cli/bin/wdio.js ./e2e/wdio/wdio.sauce.conf.ts
  ```

- *Validate CJS Support*
  With WebdriverIO v8 we transitioned the code base to ESM. This test validates that some packages can still be used within a CJS context.
  ```sh { name=test:e2e-cjs }
  node e2e/interop/webdriverio.e2e.js
  node e2e/interop/webdriver.e2e.js
  node e2e/interop/devtools.e2e.js
  node e2e/interop/cucumber-framework.e2e.js
  node e2e/interop/allure-reporter.e2e.js
  node e2e/interop/shared-store.e2e.js
  node e2e/interop/wdio-cli.e2e.js
  ```

