import fs from 'fs'
import fse from 'fs-extra'
import EventEmitter from 'events'

import { getErrorsFromEvent } from './utils'

import SuiteStats from './stats/suite'
import HookStats from './stats/hook'
import TestStats from './stats/test'

import RunnerStats from './stats/runner'

export default class WDIOReporter extends EventEmitter {
    constructor(options) {
        super()
        this.options = options

        // ensure the report directory exists
        if (this.options.outputDir) {
            fse.ensureDirSync(this.options.outputDir)
        }

        this.outputStream = this.options.stdout || !this.options.logFile
            ? options.writeStream
            : fs.createWriteStream(this.options.logFile)
        this.failures = []
        this.suites = {}
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
        this.retries = 0

        let currentTest

        const rootSuite = new SuiteStats({
            title: '(root)',
            fullTitle: '(root)',
        })
        this.currentSuites.push(rootSuite)

        this.on('client:beforeCommand', this.onBeforeCommand.bind(this))
        this.on('client:afterCommand', this.onAfterCommand.bind(this))

        this.on('runner:start',  /* istanbul ignore next */(runner) => {
            rootSuite.cid = runner.cid
            this.runnerStat = new RunnerStats(runner)
            this.onRunnerStart(this.runnerStat)
        })

        this.on('suite:start',  /* istanbul ignore next */(params) => {
            const suite = new SuiteStats(params)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.suites.push(suite)
            this.currentSuites.push(suite)
            this.suites[suite.uid] = suite
            this.onSuiteStart(suite)
        })

        this.on('hook:start',  /* istanbul ignore next */(hook) => {
            const hookStat = new HookStats(hook)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.hooks.push(hookStat)
            currentSuite.hooksAndTests.push(hookStat)
            this.hooks[hook.uid] = hookStat
            this.onHookStart(hookStat)
        })

        this.on('hook:end',  /* istanbul ignore next */(hook) => {
            const hookStat = this.hooks[hook.uid]
            hookStat.complete(getErrorsFromEvent(hook))
            this.counts.hooks++
            this.onHookEnd(hookStat)
        })

        this.on('test:start',  /* istanbul ignore next */(test) => {
            test.retries = this.retries
            currentTest = new TestStats(test)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.tests.push(currentTest)
            currentSuite.hooksAndTests.push(currentTest)
            this.tests[test.uid] = currentTest
            this.onTestStart(currentTest)
        })

        this.on('test:pass',  /* istanbul ignore next */(test) => {
            const testStat = this.tests[test.uid]
            testStat.pass()
            this.counts.passes++
            this.counts.tests++
            this.onTestPass(testStat)
        })

        this.on('test:fail',  /* istanbul ignore next */(test) => {
            const testStat = this.tests[test.uid]

            testStat.fail(getErrorsFromEvent(test))
            this.counts.failures++
            this.counts.tests++
            this.onTestFail(testStat)
        })

        this.on('test:retry', (test) => {
            const testStat = this.tests[test.uid]

            testStat.fail(getErrorsFromEvent(test))
            this.onTestRetry(testStat)
            this.retries++
        })

        this.on('test:pending', (test) => {
            test.retries = this.retries
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentTest = new TestStats(test)

            /**
             * In Mocha: tests that are skipped don't have a start event but a test end.
             * In Jasmine: tests have a start event, therefor we need to replace the
             * test instance with the pending test here
             */
            if (test.uid in this.tests && this.tests[test.uid].state !== 'pending') {
                currentTest.uid = test.uid in this.tests ? 'skipped-' + this.counts.skipping : currentTest.uid
            }
            const suiteTests = currentSuite.tests
            if (!suiteTests.length || currentTest.uid !== suiteTests[suiteTests.length - 1].uid) {
                currentSuite.tests.push(currentTest)
                currentSuite.hooksAndTests.push(currentTest)
            } else {
                suiteTests[suiteTests.length - 1] = currentTest
                currentSuite.hooksAndTests[currentSuite.hooksAndTests.length - 1] = currentTest
            }

            this.tests[currentTest.uid] = currentTest
            currentTest.skip(test.pendingReason)
            this.counts.skipping++
            this.counts.tests++
            this.onTestSkip(currentTest)
        })

        this.on('test:end',  /* istanbul ignore next */(test) => {
            const testStat = this.tests[test.uid]
            this.retries = 0
            this.onTestEnd(testStat)
        })

        this.on('suite:end',  /* istanbul ignore next */(suite) => {
            const suiteStat = this.suites[suite.uid]
            suiteStat.complete()
            this.currentSuites.pop()
            this.onSuiteEnd(suiteStat)
        })

        this.on('runner:end',  /* istanbul ignore next */(runner) => {
            rootSuite.complete()
            this.runnerStat.failures = runner.failures
            this.runnerStat.retries = runner.retries
            this.runnerStat.complete()
            this.onRunnerEnd(this.runnerStat)
        })

        /**
         * browser client event handlers
         */
        this.on('client:beforeCommand',  /* istanbul ignore next */(payload) => {
            if (!currentTest) {
                return
            }
            currentTest.output.push(Object.assign(payload, { type: 'command' }))
        })
        this.on('client:afterCommand',  /* istanbul ignore next */(payload) => {
            if (!currentTest) {
                return
            }
            currentTest.output.push(Object.assign(payload, { type: 'result' }))
        })
    }

    /**
     * allows reporter to stale process shutdown process until required sync work
     * is done (e.g. when having to send data to some server or any other async work)
     */
    get isSynchronised() {
        return true
    }

    /**
     * function to write to reporters output stream
     */
    write(content) {
        this.outputStream.write(content)
    }

    /* istanbul ignore next */
    onRunnerStart() { }
    /* istanbul ignore next */
    onBeforeCommand() { }
    /* istanbul ignore next */
    onAfterCommand() { }
    /* istanbul ignore next */
    onScreenshot() { }
    /* istanbul ignore next */
    onSuiteStart() { }
    /* istanbul ignore next */
    onHookStart() { }
    /* istanbul ignore next */
    onHookEnd() { }
    /* istanbul ignore next */
    onTestStart() { }
    /* istanbul ignore next */
    onTestPass() { }
    /* istanbul ignore next */
    onTestFail() { }
    /* istanbul ignore next */
    onTestRetry() { }
    /* istanbul ignore next */
    onTestSkip() { }
    /* istanbul ignore next */
    onTestEnd() { }
    /* istanbul ignore next */
    onSuiteEnd() { }
    /* istanbul ignore next */
    onRunnerEnd() { }
}
