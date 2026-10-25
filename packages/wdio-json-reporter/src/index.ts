import WDIOReporter, { type RunnerStats, type TestStats } from '@wdio/reporter'
import type { Reporters } from '@wdio/types'

import type { ResultSet, TestSuite } from './types.js'

import { mapHooks, mapTests } from './utils.js'

export default class JsonReporter extends WDIOReporter {
    // attempts that the framework ran again: only the last attempt counts
    #retried = new WeakSet<TestStats>()

    constructor (options: Reporters.Options) {
        if (options.logFile && options.logFile.endsWith('.log')) {
            options.logFile = options.logFile.slice(0, -4) + '.json'
        }
        super(options)
    }

    onTestRetry (test: TestStats) {
        this.#retried.add(test)
    }

    onRunnerEnd (runner: RunnerStats) {
        const json = this.#prepareJson(runner)
        this.write(JSON.stringify(json))
    }

    #prepareJson (runner: RunnerStats) {
        const resultSet: ResultSet = {
            start: runner.start,
            end: runner.end,
            capabilities: runner.capabilities,
            framework: runner.config.framework,
            mochaOpts: runner.config.mochaOpts,
            suites: [],
            specs: [],
            state: { passed: 0, failed: 0, skipped: 0 },
        }

        for (const spec of runner.specs) {
            resultSet.specs.push(spec)
            for (const suiteKey of Object.keys(this.suites)) {
                const suite = this.suites[suiteKey]
                const testSuite: TestSuite = {
                    name: suite.title,
                    duration: suite._duration,
                    start: suite.start,
                    end: suite.end,
                    sessionId: runner.sessionId,
                    tests: mapTests(suite.tests),
                    hooks: mapHooks(suite.hooks)
                }

                // the error of a retried attempt is on its `test:retry`, and the error of a `failedTestUid` hook is on that test
                resultSet.state.failed += suite.hooks.filter(
                    (hook) => hook.error && !hook.retried && !hook.failedTestUid).length
                resultSet.state.passed += testSuite.tests.filter(
                    (test) => test.state === 'passed').length
                resultSet.state.failed += suite.tests.filter(
                    (test) => test.state === 'failed' && !this.#retried.has(test)).length
                resultSet.state.skipped += testSuite.tests.filter(
                    (test) => test.state === 'skipped').length
                resultSet.suites.push(testSuite)
            }
        }

        return resultSet
    }
}
