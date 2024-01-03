import WDIOReporter, { type RunnerStats } from '@wdio/reporter'
import type { Reporters } from '@wdio/types'

import type { ResultSet, TestSuite } from './types.js'

import { mapHooks, mapTests } from './utils.js'

export default class JsonReporter extends WDIOReporter {
    constructor (options: Reporters.Options) {
        if (options.logFile && options.logFile.endsWith('.log')) {
            options.logFile = options.logFile.slice(0, -4) + '.json'
        }
        super(options)
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

                resultSet.state.failed += testSuite.hooks.filter(
                    (hook) => hook.error).length
                resultSet.state.passed += testSuite.tests.filter(
                    (test) => test.state === 'passed').length
                resultSet.state.failed += testSuite.tests.filter(
                    (test) => test.state === 'failed').length
                resultSet.state.skipped += testSuite.tests.filter(
                    (test) => test.state === 'skipped').length
                resultSet.suites.push(testSuite)
            }
        }

        return resultSet
    }
}
