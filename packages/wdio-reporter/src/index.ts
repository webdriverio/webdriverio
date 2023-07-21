import fs from 'node:fs'
import type { WriteStream } from 'node:fs'
import { EventEmitter } from 'node:events'
import logger from '@wdio/logger'
import type { Reporters, Options } from '@wdio/types'

import { getErrorsFromEvent } from './utils.js'
import type { Suite } from './stats/suite.js'
import SuiteStats from './stats/suite.js'
import type { Hook } from './stats/hook.js'
import HookStats from './stats/hook.js'
import TestStats, { Test } from './stats/test.js'
import RunnerStats from './stats/runner.js'
import type { AfterCommandArgs, BeforeCommandArgs, CommandArgs, Tag, Argument } from './types.js'

type CustomWriteStream = { write: (content: any) => boolean }
const log = logger('WDIOReporter')

export default class WDIOReporter extends EventEmitter {
    outputStream: WriteStream | CustomWriteStream
    failures = 0
    suites: Record<string, SuiteStats> = {}
    hooks: Record<string, HookStats> = {}
    tests: Record<string, TestStats> ={}
    currentSuites: SuiteStats[] = []
    counts = {
        suites: 0,
        tests: 0,
        hooks: 0,
        passes: 0,
        skipping: 0,
        failures: 0
    }
    retries = 0
    runnerStat?: RunnerStats
    isContentPresent = false
    specs: string[] = []
    currentSpec?: string

    constructor(public options: Partial<Reporters.Options>) {
        super()

        // ensure the report directory exists
        if (this.options.outputDir) {
            try {
                fs.mkdirSync(this.options.outputDir, { recursive: true })
            } catch (err: any) {
                log.error(`Couldn't create output dir: ${err.stack}`)
            }
        }

        this.outputStream = (this.options.stdout || !this.options.logFile) && this.options.writeStream
            ? this.options.writeStream as CustomWriteStream
            : fs.createWriteStream(this.options.logFile!)

        let currentTest: TestStats

        const rootSuite = new SuiteStats({
            title: '(root)',
            fullTitle: '(root)',
            file: ''
        })
        this.currentSuites.push(rootSuite)

        this.on('client:beforeCommand', this.onBeforeCommand.bind(this))
        this.on('client:afterCommand', this.onAfterCommand.bind(this))

        this.on('runner:start', /* istanbul ignore next */ (runner: Options.RunnerStart) => {
            rootSuite.cid = runner.cid
            this.specs.push(...runner.specs)
            this.runnerStat = new RunnerStats(runner)
            this.onRunnerStart(this.runnerStat)
        })

        this.on('suite:start', /* istanbul ignore next */ (params: Suite) => {
            /**
             * the jasmine framework doesn't give us information about the file
             * therefore we need to propagate these information into params
             */
            if (!params.file) {
                params.file = !params.parent
                    ? this.specs.shift() || 'unknown spec file'
                    : this.currentSpec!
                this.currentSpec = params.file
            }

            const suite = new SuiteStats(params)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.suites.push(suite)
            this.currentSuites.push(suite)
            this.suites[suite.uid] = suite
            this.onSuiteStart(suite)
        })

        this.on('hook:start', /* istanbul ignore next */ (hook: Hook) => {
            const hookStats = new HookStats(hook)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.hooks.push(hookStats)
            currentSuite.hooksAndTests.push(hookStats)
            this.hooks[hook.uid!] = hookStats
            this.onHookStart(hookStats)
        })

        this.on('hook:end',  /* istanbul ignore next */(hook: Hook) => {
            const hookStats = this.hooks[hook.uid!]
            hookStats.complete(getErrorsFromEvent(hook))
            this.counts.hooks++
            this.onHookEnd(hookStats)
        })

        this.on('test:start', /* istanbul ignore next */ (test: Test) => {
            test.retries = this.retries
            currentTest = new TestStats(test)
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentSuite.tests.push(currentTest)
            currentSuite.hooksAndTests.push(currentTest)
            this.tests[test.uid] = currentTest
            this.onTestStart(currentTest)
        })

        this.on('test:pass',  /* istanbul ignore next */(test: Test) => {
            const testStat = this.tests[test.uid]
            testStat.pass()
            this.counts.passes++
            this.counts.tests++
            this.onTestPass(testStat)
        })

        this.on('test:skip', (test: Test) => {
            const testStat = this.tests[test.uid]
            currentTest.skip(test.pendingReason!)
            this.counts.skipping++
            this.counts.tests++
            this.onTestSkip(testStat)
        })

        this.on('test:fail',  /* istanbul ignore next */(test: Test) => {
            const testStat = this.tests[test.uid]

            testStat.fail(getErrorsFromEvent(test))
            this.counts.failures++
            this.counts.tests++
            this.onTestFail(testStat)
        })

        this.on('test:retry', (test: Test) => {
            const testStat = this.tests[test.uid]

            testStat.fail(getErrorsFromEvent(test))
            this.onTestRetry(testStat)
            this.retries++
        })

        this.on('test:pending', (test: Test) => {
            test.retries = this.retries
            const currentSuite = this.currentSuites[this.currentSuites.length - 1]
            currentTest = new TestStats(test)

            /**
             * In Mocha: tests that are skipped don't have a start event but a test end.
             * In Jasmine: tests have a start event, therefore we need to replace the
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
            currentTest.skip(test.pendingReason!)
            this.counts.skipping++
            this.counts.tests++
            this.onTestSkip(currentTest)
        })

        this.on('test:end',  /* istanbul ignore next */(test: Test) => {
            const testStat = this.tests[test.uid]
            this.retries = 0
            this.onTestEnd(testStat)
        })

        this.on('suite:end',  /* istanbul ignore next */(suite: Suite) => {
            const suiteStat = this.suites[suite.uid!]
            suiteStat.complete()
            this.currentSuites.pop()
            this.onSuiteEnd(suiteStat)
        })

        this.on('runner:end',  /* istanbul ignore next */(runner: Options.RunnerEnd) => {
            rootSuite.complete()
            if (this.runnerStat) {
                this.runnerStat.failures = runner.failures
                this.runnerStat.retries = runner.retries
                this.runnerStat.complete()
                this.onRunnerEnd(this.runnerStat)
            }
            const logFile = (this.options as Reporters.Options).logFile
            if (!this.isContentPresent && logFile && fs.existsSync(logFile)) {
                fs.unlinkSync(logFile)
            }
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
    write(content: any) {
        if (content) {
            this.isContentPresent = true
        }
        this.outputStream.write(content)
    }

    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRunnerStart(runnerStats: RunnerStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeforeCommand(commandArgs: BeforeCommandArgs) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAfterCommand(commandArgs: AfterCommandArgs) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuiteStart(suiteStats: SuiteStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onHookStart(hookStat: HookStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onHookEnd(hookStats: HookStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestStart(testStats: TestStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestPass(testStats: TestStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestFail(testStats: TestStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestRetry(testStats: TestStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestSkip(testStats: TestStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestEnd(testStats: TestStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuiteEnd(suiteStats: SuiteStats) { }
    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRunnerEnd(runnerStats: RunnerStats) { }
}

export {
    SuiteStats, Tag, HookStats, TestStats, RunnerStats, BeforeCommandArgs,
    AfterCommandArgs, CommandArgs, Argument, Test
}
