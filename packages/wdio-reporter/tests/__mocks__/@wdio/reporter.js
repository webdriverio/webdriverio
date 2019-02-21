import EventEmitter from 'events'
import chalk from 'chalk'

export default class WDIOReporter extends EventEmitter {
    constructor (options) {
        super()
        this.options = options
        this.outputStream = { write: jest.fn() }
        this.failures = []
        this.all_suites = {}
        this.hooks = {}
        this.tests = {}
        this.currentSuites = []
        this.counts = {
            suites: 0,
            tests: 0,
            hooks: 0,
            passes: 0,
            skipping: 0,
            failures: 0
        }
    }

    get isSynchronised () {
        return true
    }

    getEventsToReport (suite) {
        return [
            /**
             * report all tests
             */
            ...suite.tests,
            /**
             * and only hooks that failed
             */
            ...suite.hooks
                .filter((hook) => Boolean(hook.error))
        ]
    }

    getFailureDisplay () {
        let failureLength = 0
        const output = []

        for (const [ , suite ] of Object.entries(this.all_suites)) {
            const suiteTitle = suite.title
            const eventsToReport = this.getEventsToReport(suite)
            for (const test of eventsToReport) {
                if(test.state !== 'failed') {
                    continue
                }

                const testTitle = test.title

                // If we get here then there is a failed test
                output.push(
                    '',
                    `${++failureLength}) ${suiteTitle} ${testTitle}`,
                    chalk.red(test.error.message),
                    ...test.error.stack.split(/\n/g).map(value => chalk.gray(value))
                )
            }
        }

        return output
    }

    write (content) {
        this.outputStream.write(content)
    }

    /* istanbul ignore next */
    onRunnerStart () {}
    /* istanbul ignore next */
    onBeforeCommand () {}
    /* istanbul ignore next */
    onAfterCommand () {}
    /* istanbul ignore next */
    onScreenshot () {}
    /* istanbul ignore next */
    onSuiteStart () {}
    /* istanbul ignore next */
    onHookStart () {}
    /* istanbul ignore next */
    onHookEnd () {}
    /* istanbul ignore next */
    onTestStart () {}
    /* istanbul ignore next */
    onTestPass () {}
    /* istanbul ignore next */
    onTestFail () {}
    /* istanbul ignore next */
    onTestSkip () {}
    /* istanbul ignore next */
    onTestEnd () {}
    /* istanbul ignore next */
    onSuiteEnd () {}
    /* istanbul ignore next */
    onRunnerEnd () {}
}
