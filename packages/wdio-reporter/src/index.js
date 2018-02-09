import EventEmitter from 'events'

import SuiteStats from './stats/suite'
import HookStats from './stats/hook'
import TestStats from './stats/test'

import RunnerStats from './stats/runner'

export default class WDIOReporter extends EventEmitter {
    constructor () {
        super()
        this.failures = []
        this.suites = {}
        this.hooks = {}
        this.tests = {}
        this.counts = {
            suites: 0,
            tests: 0,
            hooks: 0,
            passes: 0,
            skipping: 0,
            failures: 0
        }

        this.on('client:beforeCommand', ::this.onBeforeCommand)
        this.on('client:afterCommand', ::this.onAfterCommand)

        this.on('runner:start', (runner) => {
            this.runnerStat = new RunnerStats(runner)
            this.onRunnerStart(this.runnerStat)
        })

        this.on('suite:start', (suite) => {
            this.suites[suite.uid] = new SuiteStats(suite)
            this.onSuiteStart(this.suites[suite.uid])
        })

        this.on('hook:start', (hook) => {
            this.hooks[hook.uid] = new HookStats(hook)
            this.onHookStart(this.hooks[hook.uid])
        })

        this.on('hook:end', (hook) => {
            const hookStat = this.hooks[hook.uid]
            hookStat.complete()
            this.counts.hooks++
            this.onHookEnd(hookStat)
        })

        this.on('test:start', (test) => {
            this.tests[test.uid] = new TestStats(test)
            this.onTestStart(this.tests[test.uid])
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
            testStat.fail()
            this.counts.failures++
            this.counts.tests++
            this.onTestFail(test)
        })

        this.on('test:skip', (test) => {
            const testStat = this.tests[test.uid]
            testStat.skip()
            this.counts.skipping++
            this.counts.tests++
            this.onTestSkip(testStat)
        })

        this.on('test:end', (test) => {
            const testStat = this.tests[test.uid]
            this.onTestEnd(testStat)
        })

        this.on('suite:end', (suite) => {
            const suiteStat = this.suites[suite.uid]
            suiteStat.complete()
            this.onSuiteEnd(suiteStat)
        })

        this.on('runner:end', () => {
            this.runnerStat.complete()
            this.onRunnerEnd(this.runnerStat)
        })
    }

    onBeforeCommand () {}
    onAfterCommand () {}
    onScreenshot () {}
    onRunnerStart () {}
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
