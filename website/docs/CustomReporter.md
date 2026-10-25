---
id: customreporter
title: Custom Reporter
description: "Build a custom reporter for the WDIO testrunner on top of @wdio/reporter, handle runner events and publish it on NPM."
---

You can write your own custom reporter for the WDIO test runner that is tailored to your needs. And it’s easy!

All you need to do is to create a node module that inherits from the `@wdio/reporter` package, so it can receive messages from the test.

The basic setup should look like:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    constructor(options) {
        /*
         * make reporter to write to the output stream by default
         */
        options = Object.assign(options, { stdout: true })
        super(options)
    }

    onTestPass(test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`)
    }
}
```

To use this reporter, all you need to do is assign it to the `reporter` property in your configuration.


Your `wdio.conf.js` file should look like this:

```js
import CustomReporter from './reporter/my.custom.reporter'

export const config = {
    // ...
    reporters: [
        /**
         * use imported reporter class
         */
        [CustomReporter, {
            someOption: 'foobar'
        }],
        /**
         * use absolute path to reporter
         */
        ['/path/to/reporter.js', {
            someOption: 'foobar'
        }]
    ],
    // ...
}
```

You can also publish the reporter to NPM so everyone can use it. Name the package like other reporters `wdio-<reportername>-reporter`, and tag it with keywords like `wdio` or `wdio-reporter`.

## Event Handler

You can register an event handler for several events which are triggered during testing. All of the following handlers will receive payloads with useful information about the current state and progress.

The structure of these payload objects depend on the event, and are unified across the frameworks (Mocha, Jasmine, and Cucumber). Once you implement a custom reporter, it should work for all frameworks.

The following list contains all possible methods you can add to your reporter class:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onRunnerStart() {}
    onBeforeCommand() {}
    onAfterCommand() {}
    onSuiteStart() {}
    onHookStart() {}
    onHookEnd() {}
    onTestStart() {}
    onTestPass() {}
    onTestFail() {}
    onTestSkip() {}
    onTestEnd() {}
    onContextEnd() {} // experimental, see "Reporters and parallel tests"
    onSuiteEnd() {}
    onRunnerEnd() {}
}
```

The method names are pretty self explanatory.

After `onTestPass`, `onTestFail`, `onTestSkip` or `onTestPending`, every framework calls `onTestEnd` for the same test: Cucumber too, for each step (or each scenario with `scenarioLevelReporter`). When a test is retried, its failed attempt ends with `onTestRetry` and gets no `onTestEnd`. With Cucumber at step level, the scenario is retried: the step that fails gets `onTestRetry` instead of `onTestFail`, every step of the failed attempt ends with `onTestEnd` as usual, and `onSuiteRetry` starts the next attempt and removes the steps of the failed attempt from `this.counts` (`this.counts.hooks` keeps the hooks of every attempt, as for a Mocha retry). Finish your work for a test in `onTestEnd`, not in the result methods.

To print something on a certain event, use the `this.write(...)` method, which is provided by the parent `WDIOReporter` class. It either streams the content to `stdout`, or to a log file (depending on the options of the reporter).

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onTestPass(test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`)
    }
}
```

Note that you cannot defer the test execution in any way.

All event handlers should execute synchronous routines (or you'll run into race conditions).

Be sure to check out the [example section](https://github.com/webdriverio/webdriverio/tree/main/examples/wdio) where you can find an example custom reporter that prints the event name for each event.

If you have implemented a custom reporter that could be useful for the community, don't hesitate to make a Pull Request so we can make the reporter available for the public!

Also, if you run the WDIO testrunner via the `Launcher` interface, you can't apply a custom reporter as function as follows:

```js
import Launcher from '@wdio/cli'

import CustomReporter from './reporter/my.custom.reporter'

const launcher = new Launcher('/path/to/config.file.js', {
    // this will NOT work, because CustomReporter is not serializable
    reporters: ['dot', CustomReporter]
})
```

## Reporters and parallel tests

With [parallel tests in a spec file](./ParallelTests.md), the tests of one spec file overlap: `onTestStart` of one test can come before `onTestEnd` of another, and commands of different tests interleave. `WDIOReporter` handles this for you. In parallel mode the framework events carry two extra fields:

- `parentUid` on `suite:start`, `hook:start` and `test:start`: the uid of the owning suite (`null` for a top-level suite). The reporter adds the suite, hook or test to that suite, not to the suite that started last.
- `contextId` on test and command events: the browsing context of the test. The reporter adds command output to the test that ran in that context.

The test, hook and suite stats keep these fields when the event has them: in `onTestEnd(test)`, `test.contextId` is the browsing context of the test and `test.parentUid` the uid of its suite. Without parallel mode, the stats have no such properties.

The `suites`, `tests` and `hooks` trees of the reporter are therefore correct. If your reporter keeps its own state, key it by the `uid` of the test or suite instead of tracking a single current test.

Output that comes without an event, such as console output or a custom `process.emit` event, has no `uid`. Call `this.getContextTest()` to get the test whose browsing context wrote it. In parallel mode it returns the test that started last in that context, also after its `test:end`, when its `afterEach` and `after` hooks run, and `undefined` when no test started in that context or after its `context:end`; without parallel mode it returns the test that started last. `before()` hooks of a parallel test run before its `test:start`, so no test owns the context yet; `this.getContextId()` returns the raw context id, which stays the same for the whole test.

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onTestStart(test) {
        this.write(`start ${test.uid} ${test.title}\n`)
    }
    onTestEnd(test) {
        this.write(`end   ${test.uid} ${test.state}\n`)
    }
}
```

The `afterEach` and `after` hooks of a parallel test run after its `test:end`. To know when a context is done, use `onContextEnd(payload)`. It is called after the last hook of the test (with Cucumber: after the `After` hooks of the last attempt of the scenario), and the context sends no more events after it. The payload has `cid`, `specs`, `uid` (the last test of the context; for a Cucumber scenario with no step, the scenario) and `contextId`. Close or write what your reporter keeps for that context there.

:::warning Experimental

`context:end` and `onContextEnd` are experimental: only Mocha and Cucumber `parallelMode` send them for now, and the name and the payload can change.

:::

## Wait Until `isSynchronised`

If your reporter has to execute async operations to report the data (e.g. upload of log files or other assets) you can overwrite the `isSynchronised` method in your custom reporter to let the WebdriverIO runner wait until you have computed everything. An example of this can be seen in the [`@wdio/sumologic-reporter`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-sumologic-reporter/src/index.ts):

```js
export default class SumoLogicReporter extends WDIOReporter {
    constructor (options) {
        // ...
        this.unsynced = []
        this.interval = setInterval(::this.sync, this.options.syncInterval)
        // ...
    }

    /**
     * overwrite isSynchronised method
     */
    get isSynchronised () {
        return this.unsynced.length === 0
    }

    /**
     * sync log files
     */
    sync () {
        // ...
        request({
            method: 'POST',
            uri: this.options.sourceAddress,
            body: logLines
        }, (err, resp) => {
            // ...
            /**
             * remove transferred logs from log bucket
             */
            this.unsynced.splice(0, MAX_LINES)
            // ...
        }
    }
}
```

This way the runner will wait until all log information are uploaded.

## Publish Reporter on NPM

To make reporter easier to consume and discover by the WebdriverIO community, please follow these recommendations:

* Services should use this naming convention: `wdio-*-reporter`
* Use NPM keywords: `wdio-plugin`, `wdio-reporter`
* The `main` entry should `export` an instance of the reporter
* Example reporter: [`@wdio/dot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-dot-reporter)

Following the recommended naming pattern allows services to be added by name:

```js
// Add wdio-custom-reporter
export const config = {
    // ...
    reporter: ['custom'],
    // ...
}
```

### Add Published Service to WDIO CLI and Docs

We really appreciate every new plugin that could help other people run better tests! If you have created such a plugin, please consider adding it to our CLI and docs to make it easier to be found.

Please raise a pull request with the following changes:

- add your service to the list of [supported reporters](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/constants.ts#L74-L91)) in the CLI module
- enhance the [reporter list](https://github.com/webdriverio/webdriverio/blob/main/infra/docs/src/3rd-party/reporters.json) for adding your docs to the official Webdriver.io page
