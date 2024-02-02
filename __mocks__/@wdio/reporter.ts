import { vi } from 'vitest'

import { EventEmitter } from 'node:events'
import HookStats from '../../packages/wdio-reporter/src/stats/hook.ts'
import RunnerStats from '../../packages/wdio-reporter/src/stats/runner.ts'
import SuiteStats from '../../packages/wdio-reporter/src/stats/suite.ts'
import TestStats from '../../packages/wdio-reporter/src/stats/test.ts'
import { Chalk } from '../chalk.ts'

export default class WDIOReporter extends EventEmitter {
    outputStream: { write: Function }
    failures: number
    suites: Record<string, SuiteStats>
    hooks: Record<string, HookStats>
    tests: Record<string, TestStats>
    currentSuites: SuiteStats[]
    counts: {
        suites: number
        tests: number
        hooks: number
        passes: number
        skipping: number
        failures: number
    }
    retries: number
    _chalk: Chalk
    runnerStat?: RunnerStats
    constructor (public options: any) {
        super()
        this.options = options
        this.outputStream = { write: vi.fn() }
        this.failures = 0
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
        this._chalk = new Chalk(!options.color ? { level : 0 } : {})
    }

    get isSynchronised () {
        return true
    }

    write (content: any) {
        this.outputStream.write(content)
    }

    /* istanbul ignore next */
    onRunnerStart () {}
    /* istanbul ignore next */
    onBeforeCommand () {}
    /* istanbul ignore next */
    onAfterCommand () {}
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

export { HookStats, RunnerStats, SuiteStats, TestStats }
