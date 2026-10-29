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
    onBeforeUserCommand() {} // experimental, see "User commands"
    onAfterUserCommand() {} // experimental, see "User commands"
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

After `onTestPass`, `onTestFail`, `onTestSkip` or `onTestPending`, every framework calls `onTestEnd` for the same test: Cucumber too, for each step (or each scenario with `scenarioLevelReporter`). When a test is retried, its failed attempt ends with `onTestRetry` and gets no `onTestEnd`. With Cucumber at step level, the scenario is retried: the step that fails gets `onTestRetry` instead of `onTestFail`, every step of the failed attempt ends with `onTestEnd` as usual, and `onSuiteRetry` starts the next attempt and removes the steps of the failed attempt from `this.counts` (`this.counts.hooks` keeps the hooks of every attempt, as for a Mocha retry). `onSuiteRetry` sees the new `suite.retries` and the tests and hooks of the failed attempt; the base clears them after it. Finish your work for a test in `onTestEnd`, not in the result methods. A Cucumber `BeforeAll` or `AfterAll` runs once, outside of any scenario: it comes as `onHookStart` when it starts and `onHookEnd` when it ends (with `error` when it fails), under the feature suite, with `hookKind` `beforeAll` / `afterAll` and `hookSuiteUid` set to the uid of the feature. A passed one comes too, so the commands and logs of its body belong to it. WebdriverIO's own `beforeFeature` / `afterFeature` hooks send no hook event.

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
- `contextId` on test and command events: the browsing context of the test. The reporter adds command output to the test that ran in that context. With Vitest, all tests of a spec file that has a concurrent test (`test.concurrent`, `describe.concurrent`) have a `contextId`: the id of the Vitest test, not a browsing context.

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

Some frameworks count the error of a failed hook one time, as the failure of a test. Vitest does this for `beforeEach` and `afterEach`: the test fails with the error of the hook. Such a hook has `hook.failedTestUid`, the uid of that test, and the test has the error too (in `test.errors`, next to its own error, when the test body also failed). Show the hook as failed, but do not count it as one more failure. The hooks of an attempt that Vitest runs again (`retry`) also have `hook.retried === true`; the error of that attempt is on its `test:retry` (`onTestRetry`), and its test stats have `test.retried === true` (with every framework). To count failures, use the helper `hookCountsAsFailure(hook)` from `@wdio/reporter` and skip the tests with `test.retried`, so that your reporter follows the same rule as the WebdriverIO reporters:

```js
import WDIOReporter, { hookCountsAsFailure } from '@wdio/reporter'

export default class CountingReporter extends WDIOReporter {
    failures = 0
    onHookEnd(hook) {
        if (hookCountsAsFailure(hook)) {
            this.failures++
        }
    }
    onTestFail(test) {
        this.failures++
    }
    onTestRetry() {
        // a retried attempt does not count: its test:retry comes instead of test:fail
    }
}
```

`failedTestUid`, `retried` and `hookCountsAsFailure` are experimental.

The `afterEach` and `after` hooks of a parallel test run after its `test:end`. To know when a context is done, use `onContextEnd(payload)`. It is called after the last hook of the test (with Cucumber: after the `After` hooks of the last attempt of the scenario), and the context sends no more events after it. The payload has `cid`, `specs`, `uid` (the last test of the context; for a Cucumber scenario with no step, the scenario) and `contextId`. Close or write what your reporter keeps for that context there.

:::warning Experimental

`context:end` and `onContextEnd` are experimental: only Mocha and Cucumber `parallelMode` and Vitest concurrent tests send them for now, and the name and the payload can change.

:::

### Units

A unit is one test or scenario with all its attempts. In parallel mode, a unit is one browsing context, from its first event to `context:end`. In a sequential run, a unit is a test, or a Cucumber scenario (at step level, the suite of the scenario). The unit is the key to use for per-test state of a reporter, in both modes.

A `ReporterUnit` has these fields:

| Field | Description |
|-------|-------------|
| `contextId` | The browsing context of a parallel unit. `undefined` in a sequential run. |
| `stats` | The scenario (Cucumber step level) or the test. `undefined` before it starts, for example in a Mocha `parallelMode` `before all` hook (its unit opens at `hook:start`). |
| `test` | The test or step that started last in the unit. |
| `attempt` | `0` for the first attempt. It changes at the start of the next attempt: at the next `test:start`, or at `suite:retry` for a Cucumber scenario at step level. |
| `ended` | `true` from `onUnitEnd` on. |

The reporter calls these methods. In them, `getContextUnit()`, `unitState()` and `attemptState()` use the unit of the event:

- `onUnitStart(unit)`: at the first event of a parallel context (a `test:start`, a `test:pending` or a scenario `suite:start` in a context that ended starts a new unit), or at a sequential test or scenario.
- `onUnitRetry(unit)`: an attempt failed and runs again (`test:retry`, `suite:retry`). It comes before the base clears the stats of the attempt.
- `onUnitEnd(unit)`: at `context:end`. In a sequential run, after the `afterEach` hooks of the test (at the next hook, test or suite event), or at the `suite:end` of the scenario. A test with no `test:end` ends when the next unit starts or at the end of its suite. Else the unit ends at `runner:end`. `onUnitEnd` comes after `onContextEnd` and after the `onSuiteEnd` of the scenario, so these methods still see the open unit. At any other event that ends the unit (the next hook, test or suite, `runner:end`), it comes before the `on*` method of that event.

Use these methods to find the unit and to keep state for it:

- `this.getContextUnit(contextId?)`: the unit of the caller. In an `on*` method, this is the unit of the event. Else it is the unit of the parallel context of the caller, or the sequential unit. With `contextId`, it is the last unit of that context. The units and their state stay for the life of the reporter, also after `runner:end`. It returns `undefined` for runner events, suite events (except a Cucumber scenario), a `beforeAll` / `afterAll` hook that has a `hookKind` and no context, and for code outside every context after the first parallel context.
- `this.unitOf(stats)`: the unit of a suite, hook or test stats.
- `this.unitState(key, init, target?)`: state of your reporter for the unit. `init(unit)` runs at the first call, and the same value comes back after that. It returns `undefined` when there is no unit. `target` is a context id or a unit.
- `this.attemptState(key, init, target?)`: as `unitState`, but new for each attempt of the unit.

In an async `on*` method, the unit of the event is known only before the first `await`. Keep it (`const unit = this.unitOf(test)`) and pass it to `unitState()` / `attemptState()` after the `await`:

```ts
async onTestEnd(test: TestStats) {
    const unit = this.unitOf(test)
    await this.upload(test)
    this.unitState('uploads', () => [] as string[], unit)?.push(test.title)
}
```

This reporter keeps the lines of each test in `unitState` and prints them at `onUnitEnd`, also when tests run at the same time:

```ts
import WDIOReporter, { type ReporterUnit, type TestStats } from '@wdio/reporter'

export default class PerTestReporter extends WDIOReporter {
    #lines = (unit: ReporterUnit) => this.unitState('lines', () => [] as string[], unit)!

    onTestEnd(test: TestStats) {
        const unit = this.unitOf(test)
        if (unit) {
            this.#lines(unit).push(`${test.state} ${test.title}`)
        }
    }

    onUnitEnd(unit: ReporterUnit) {
        const lines = this.#lines(unit)
        this.write(`${unit.stats?.title} (attempt ${unit.attempt})\n  ${lines.join('\n  ')}\n`)
    }
}
```

### Tree helpers

The reporter keeps the suite of each stats object. Use these methods to read the tree without your own bookkeeping:

- `this.parentOf(stats)`: the suite that holds the suite, hook or test stats. `undefined` for a stats object under the root suite.
- `this.pathOf(stats)`: the suites above the stats, outermost first, without the root suite.
- `this.depthOf(stats)`: the number of these suites.

### Owner of a log and a command

For a log that has no event, `getContextTest()` does not always return its owner. In a hook, it can return `undefined` or the test that started last. Call `this.getContextOwner()` to get the stats that own the output of the caller: the test of its parallel context, else the open hook of that context (before its test, and after a `suite:retry` until the next attempt starts a step), else the open `beforeAll` / `afterAll` hook that has a `hookKind` and no context, else in a sequential Cucumber scenario before its first step the open hook (with a `hookKind`) of that scenario. If there is no context in a parallel run and no parallel test runs, the owner is the last test of the unit that opened last, not the test that started last. In all other cases, it is the same as `getContextTest()`. The behavior of `getContextTest()` and `getContextId()` does not change.

### Hooks

Frameworks can send these fields on a hook. A framework that sends no `hookKind` keeps the old owner rules of the reporter, which use the title of the hook. If you write an adapter for a framework, send `hookKind` to get the new rules.

- `hook.hookKind`: `'beforeAll'`, `'beforeEach'`, `'afterEach'`, `'afterAll'`, `'beforeStep'` or `'afterStep'`.
- `hook.hookSuiteUid`: the uid of the suite that declares a `beforeAll` / `afterAll` hook.
- `this.hookOwner(hook)`: the owner of a hook (`ReporterUnit | SuiteStats | undefined`). This is its unit, or `undefined` when the hook has no unit. For a `beforeAll` / `afterAll` hook that has a `hookKind` and no context, it is the suite (`hookSuiteUid`, else `parentOf(hook)`). When that hook is a hook of the root suite (for example a root Mocha `before`), it is also `undefined`.
- `isContextlessAllHook(hook)` (an export of `@wdio/reporter`): `true` for a `beforeAll` / `afterAll` hook that has a `hookKind` and no context. Such a hook belongs to its suite, not to a unit.
- `this.isFeatureHook(hook)`: `true` for a hook of a Cucumber feature (`BeforeAll` / `AfterAll`): the suite of the hook is a `feature`.
- `hook.output`: the commands of a `beforeAll` / `afterAll` hook that has a `hookKind` and no context, of a hook of a parallel context that runs before its test, and of a hook with a `hookKind` of a sequential Cucumber scenario before its first step (a `Before`). The array exists after the first command.
- `suite.isRoot`: `true` only for the root suite of the reporter (`this.currentSuites[0]`). It has the tests and hooks that are in no suite, for example a Mocha `it()` or `before()` with no `describe()`. It gets no `suite:start`. Use this field, not the title `(root)`, to find it.
- `test.file`: the path of the spec file of the test (the feature file for Cucumber), when the framework sends it (Mocha, Jasmine, Cucumber and Vitest do). With grouped spec files, each Mocha test outside every `describe()` has its own spec file. A Jasmine test outside every `describe()` has no file.
- `hookStats.state`: the base reporter sets `'failed'` when the hook failed, or `'skipped'` when the framework skipped the hook (Mocha `this.skip()`, Cucumber hook result `SKIPPED`). A passed hook keeps `undefined`. A reporter can set `'passed'` on its own stats (`AllureReporter` does). Each reporter has its own `HookStats`.

### Browser name

`runner.capabilities` are the capabilities of the session (in a multi-remote run, a map of the instance names to their capabilities). To show the browser that ran, use `getBrowserNames(runner.capabilities, runner.isMultiRemote)` (an export of `@wdio/reporter`). It returns one name for each session, in the order of the multi-remote instances: the result of `getBrowserName(caps)` (the browser, else the Appium app), else the Appium device name. A session with none of these has no entry. If your reporter has an option for the browser name, show that option when the user sets it, else these names. To put the capabilities in a file name or a package name, use `sanitizeCaps(caps)`: it returns one capability string. To get the capabilities of each session with the name of its multi-remote instance, use `getSessions(runner.capabilities, runner.isMultiRemote)`: it returns `{ name?, capabilities }[]` (`name` is set only in a multi-remote run), unwraps `alwaysMatch`, and keeps a multi-remote instance with no capabilities with its name and empty capabilities. To show a mobile session with its device and platform, use `getSessionNames(runner.capabilities, runner.isMultiRemote)`: it adds ` on <device> (<platform> <version>)` to the name, for example `MyApp.app on iPhone 17 (iOS 18.2)`, and leaves a desktop browser as it is.

:::warning Experimental

The unit API, `getBrowserNames`, `getSessionNames`, `getSessions` and `sanitizeCaps` are experimental: `ReporterUnit`, `onUnitStart`, `onUnitRetry`, `onUnitEnd`, `getContextUnit`, `unitOf`, `unitState`, `attemptState`, `parentOf`, `pathOf`, `depthOf`, `getContextOwner`, `hookOwner`, `isContextlessAllHook`, `isFeatureHook`, `HookKind`, `hookKind`, `hookSuiteUid`, `hook.output`, `suite.isRoot`, `test.file`, `SuiteStats.clearAttempt()` and the `'skipped'` state of a hook. The names and the results can change.

:::

## User commands

A user command is a command that your test code calls directly: a WebdriverIO command or a custom command. In a WebDriver BiDi session, WebdriverIO sends an event before and after each user command: by default in a session with the `wdio:experimentalBiDiCommands` capability, and in other WebDriver BiDi sessions when you set [`userCommandEvents: true`](./Configuration.md#usercommandevents). WebDriver Classic and Appium sessions do not send these events.

To get the user commands, override `onBeforeUserCommand`, `onAfterUserCommand` or both:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onBeforeUserCommand(command) {
        this.write(`${command.command}(${JSON.stringify(command.body)})\n`)
    }
    onAfterUserCommand(command) {
        this.write('error' in command.result ? `${command.command} failed\n` : `${command.command} passed\n`)
    }
}
```

The payload has these fields:

| Field | Description |
|-------|-------------|
| `id` | A number for each user command. The protocol commands that the user command runs have this number in their `parent` field. |
| `command` | The name of the command, for example `click` or the name of a custom command. |
| `body` | The arguments of the command. |
| `protocol` | `'bidi'` |
| `sessionId` | The session of the command. In a multi-remote run, the session of the instance. |
| `contextId` | The parallel-mode context of the command, as for `onBeforeCommand`. |
| `result` | `onAfterUserCommand` only: `{ value }` when the command passed, `{ error }` when it failed. |

WebdriverIO masks and shortens the `body` and the `value` before it sends the event, so your reporter does not have to do it. Text that you give with the `mask: true` option is `**MASKED**`. Binary data is a label, for example `<Buffer n bytes>` or `<Uint8Array n bytes>`, and a `Map` or a `Set` is `Map(n)` or `Set(n)`. A string that is longer than 1024 characters is cut. An array or an object keeps 50 items and a `… [n more]` marker, and a value that is deeper than 4 levels is `[…]`. An element is a short label with its selector, then its id or `(not found)`, for example `WebdriverIO.Element<#btn> (id f.1.d.2.e.3)`. An element list is `WebdriverIO.ElementArray<selector> (n)`, with the number of elements found, also as the result of `$$`. A function is `[Function name]`.

The `error` of a `result` is the value that the command threw. To write it as JSON, use `userCommandError(error)` from `@wdio/reporter`: it gives `{ name, message }` for an error (also an error from another realm), and the value as it is for other values. `userOutputReplacer` is a `JSON.stringify` replacer that does this for each `userResult` entry of `output`.

When your reporter overrides one of these methods, the base reporter does these steps:

- It calls the method in the unit of the command, as it does for `onBeforeCommand`. In parallel mode, the owner is the test of the context.
- It adds an entry with `type: 'userCommand'` and an entry with `type: 'userResult'` to the `output` of the owner. The owner is the owner at the start of the user command: a result that comes after the end of its test (for example after a test timeout) goes to the `output` of that test, and the reporter gets `onAfterUserCommand` in the unit of that test. The type of an `output` entry is `'command' | 'result' | 'userCommand' | 'userResult'` and the other fields keep the types of a protocol entry. Call `isUserCommandOutput(entry)` or `isUserResultOutput(entry)` to get the fields of a user entry (`UserCommandOutput`, `UserResultOutput`). For `execute` and `executeAsync`, a script string in the first value of `body` is shortened as the script of a protocol command. A function stays `[Function name]`.
- It keeps the protocol commands that a user command runs, with its `id` in their `parent` field, so you can show them as children of the user command: it calls `onBeforeCommand` and `onAfterCommand` for them and adds them to `output` after the `userCommand` entry. To hide them, return `true` from the `hidesProtocolCommands` getter. `takeScreenshot` and `takeElementScreenshot` have no `parent` field, and you can get the screenshots from them as before. These two commands never send user command events, because their result is a base64 screenshot.
- It hides the old `command` and `result` events of a custom command (no HTTP method, the name of its user command), so your reporter does not see the custom command two times, and the protocol commands of a user command that sent no user command events (an excluded command).

A reporter that overrides neither method gets no user commands, and it gets all protocol commands as before.

Only the outer user command sends events. The commands that a custom command or `waitUntil` runs send no events. `call` does not hide its commands: it sends no events, and the commands that run in it send their events, as in your test code. In a multi-remote run, the multi-remote browser sends no events: each instance sends the events of its own commands, also for the commands that a custom command of the multi-remote browser runs. The commands that a WebDriver BiDi event listener runs (for example `browser.on('log.entryAdded', …)`) are outer commands, also after `reloadSession`. The commands that a `beforeCommand` or `afterCommand` hook runs, and the commands that a reporter runs, send no events. An excluded command (see [`userCommandEvents`](./Configuration.md#usercommandevents)) is still the outer command, so the commands that it runs send no events, and its protocol commands have the `parent` field. For example, when you exclude `waitUntil`, its polls are hidden too. A custom command and a command that you overwrite with `overwriteCommand` (for example `click`) send one `userCommand` and one `userResult` event, as a WebdriverIO command does. A command of a browsing context (for example `tab.navigate()`, or a command that you add with `attachToBrowsingContext: true`) also sends one pair of events, with its own name. The old `command` and `result` events of a custom command that runs in a user command have the `parent` field. A reporter that gets user commands does not get them, and other reporters get these events as before.

`@wdio/reporter` exports helpers that give the one-line text that the Allure and JUnit reporters show:

| Helper | Example |
|--------|---------|
| `userCommandTitle(command, body)` | `setValue("**MASKED**", {"mask":true})`, `dragAndDrop($("#drop"))`: functions as `function name`, element arguments as their query, arguments cut at 120 characters |
| `inlineResult(result, command?)` | `"Hello"`, `found`, `not found`, `3 found` (cut at 60 characters); nothing for an error, a result with no data or a window handle |
| `isNoDataResult(result, command?)` | `true` for no value, `null`, `{}`, a tab or mock placeholder, and the handle of `newWindow`, `emulate`, `addInitScript`, `debug` and `getPuppeteer` |
| `compactRequest(method, endpoint)` | `GET /element/:elementId/text` |
| `resolvedPath(endpoint, sessionId)` | `/session/abc/element/f.1.d.2.e.3/text` |
| `userCommandTexts(output)` | The text of each user command entry (`getText() → "clicked"`) and of each protocol command entry with `parent` (`getElementText → "clicked"  GET /element/:elementId/text`) |

`userOutputReplacer` also adds this text as a `text` field to these entries.

:::warning Experimental

`onBeforeUserCommand`, `onAfterUserCommand`, `showsUserCommands`, `hidesProtocolCommands`, `userCommandError`, `userOutputReplacer`, `isUserCommandOutput`, `isUserResultOutput`, `userCommandTitle`, `userCommandTitleIsCut`, `inlineResult`, `isNoDataResult`, `compactRequest`, `resolvedPath`, `userCommandTexts`, the `text` field, `UserCommandOutput`, `UserResultOutput`, `BeforeUserCommandArgs`, `AfterUserCommandArgs`, the `parent` field, the `'userCommand'` and `'userResult'` entries of `output` and the `userCommandEvents` option are experimental. The names and the payloads can change.

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
