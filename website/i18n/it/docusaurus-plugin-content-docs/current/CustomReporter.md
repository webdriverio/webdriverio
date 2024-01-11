---
id: customreporter
title: Custom Reporter
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
        }]
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
    onSuiteEnd() {}
    onRunnerEnd() {}
}
```

The method names are pretty self explanatory.

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

## Wait Until `isSynchronised`

If your reporter has to execute async operations to report the data (e.g. upload of log files or other assets) you can overwrite the `isSynchronised` method in your custom reporter to let the WebdriverIO runner wait until you have computed everything. An example of this can be seen in the [`@wdio/sumologic-reporter`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-sumologic-reporter/src/index.js):

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
- enhance the [reporter list](https://github.com/webdriverio/webdriverio/blob/main/scripts/docs-generation/3rd-party/reporters.json) for adding your docs to the official Webdriver.io page
