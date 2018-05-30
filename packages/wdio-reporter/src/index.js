import fs from 'fs'
import EventEmitter from 'events'

import SuiteStats from './stats/suite'
import HookStats from './stats/hook'
import TestStats from './stats/test'

import RunnerStats from './stats/runner'

export default class WDIOReporter extends EventEmitter {
    constructor (options) {
        super()
        this.options = options
        this.outputStream = this.options.stdout ? options.writeStream : fs.createWriteStream(this.options.logFile)
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

        let currentTest

        const rootSuite = new SuiteStats({
            title: '(root)',
            fullTitle: '(root)',
        })
        this.currentSuites.push(rootSuite)

        this.on('client:beforeCommand', ::this.onBeforeCommand)
        this.on('client:afterCommand', ::this.onAfterCommand)

        this.on('runner:start', (runner) => {
            rootSuite.cid = runner.cid
            this.runnerStat = new RunnerStats(runner)
            this.onRunnerStart(this.runnerStat)
        })

        this.on('suite:start', (params) => {
            const suite = new SuiteStats(params)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.suites.push(suite)
            this.currentSuites.push(suite)
            this.suites[suite.uid] = suite
            this.onSuiteStart(suite)
        })

        this.on('hook:start', (hook) => {
            const hookStat = new HookStats(hook)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.hooks.push(hookStat)
            this.hooks[hook.uid] = hookStat
            this.onHookStart(hookStat)
        })

        this.on('hook:end', (hook) => {
            const hookStat = this.hooks[hook.uid]
            hookStat.complete()
            this.counts.hooks++
            this.onHookEnd(hookStat)
        })

        this.on('test:start', (test) => {
            currentTest = new TestStats(test)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.tests.push(currentTest)
            this.tests[test.uid] = currentTest
            this.onTestStart(currentTest)
        })

        this.on('test:pass', (test) => {
            const testStat = this.tests[test.uid]
            testStat.pass()
            this.counts.passes++
            this.counts.tests++
            this.onTestPass(testStat)
        })

        this.on('test:fail', (test) => {
            const testStat = this.tests[test.uid]
            testStat.fail(test.error)
            this.counts.failures++
            this.counts.tests++
            this.onTestFail(testStat)
        })

        this.on('test:pending', (test) => {
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentTest = new TestStats(test)

            /**
             * In Mocha: tests that are skipped don't have a start event but a test end.
             * In Jasmine: tests have a start event, therefor we need to replace the
             * test instance with the pending test here
             */
            const suiteTests = currentSuite.tests
            if (!suiteTests.length || currentTest.uid !== suiteTests[suiteTests.length - 1].uid) {
                currentSuite.tests.push(currentTest)
            } else {
                suiteTests[suiteTests.length - 1] = currentTest
            }

            this.tests[test.uid] = currentTest
            currentTest.skip()
            this.counts.skipping++
            this.counts.tests++
            this.onTestSkip(currentTest)
        })

        this.on('test:end', (test) => {
            const testStat = this.tests[test.uid]
            this.onTestEnd(testStat)
        })

        this.on('suite:end', (suite) => {
            const suiteStat = this.suites[suite.uid]
            suiteStat.complete()
            this.currentSuites.pop()
            this.onSuiteEnd(suiteStat)
        })

        this.on('runner:end', (runner) => {
            rootSuite.complete()
            this.runnerStat.failures = runner.failures
            this.runnerStat.complete()
            this.onRunnerEnd(this.runnerStat)
        })

        /**
         * browser client event handlers
         */
        this.on('client:command', (payload) => {
            if (!currentTest) {
                return
            }
            currentTest.output.push(Object.assign(payload, { type: 'command' }))
        })
        this.on('client:result', (payload) => {
            if (!currentTest) {
                return
            }
            currentTest.output.push(Object.assign(payload, { type: 'result' }))
        })
    }

    /**
     * function to write to reporters output stream
     */
    write (content) {
        this.outputStream.write(content)
    }

    onRunnerStart () {}
    onBeforeCommand () {}
    onAfterCommand () {}
    onScreenshot () {}
    onSuiteStart () {}
    onHookStart () {}
    onHookEnd () {}
    onTestStart () {}
    onTestPass () {}
    onTestFail () {}
    onTestSkip () {}
    onTestEnd () {}
    onSuiteEnd () {}
    onRunnerEnd () {}
}
