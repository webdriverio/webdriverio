import SuiteStats from './stats/suite.js'
import type TestStats from './stats/test.js'

/**
 * What one test or scenario is, with all its attempts: in parallel mode one browsing context, from its
 * first event to `context:end`; in a sequential run a test, or a Cucumber scenario (step level: its suite)
 * @experimental the name and the fields may change
 */
export interface ReporterUnit {
    /** @experimental the browsing context of a parallel unit; `undefined` in a sequential run */
    readonly contextId?: string
    /** @experimental the scenario (Cucumber step level) or the test; `undefined` before it starts (Mocha `before all` hooks) */
    readonly stats?: SuiteStats | TestStats
    /** @experimental the test or step that started last in the unit */
    readonly test?: TestStats
    /** @experimental 0 for the first attempt; changes at the start of the next attempt */
    readonly attempt: number
    /** @experimental `true` from `onUnitEnd` on */
    readonly ended: boolean
}

export class Unit implements ReporterUnit {
    stats?: SuiteStats | TestStats
    test?: TestStats
    attempt = 0
    ended = false
    /** the `test:end` of `stats` came */
    testEnded = false
    /** the test of a `test:retry`: the next start of it is the next attempt */
    retriedTest?: TestStats
    readonly state = new Map<unknown, unknown>()
    readonly attemptState = new Map<unknown, unknown>()

    constructor (readonly contextId?: string) {}

    get isScenario () {
        return this.stats instanceof SuiteStats
    }

    /** a sequential `test:start` of this unit: a step of its open scenario, or the next attempt of its test */
    takesTest (test: TestStats) {
        if (this.stats instanceof SuiteStats) {
            return !this.stats.end
        }
        const retried = this.retriedTest
        // Cucumber scenario level starts the same uid again, Mocha a new uid with the same full title
        return Boolean(retried && !this.testEnded && (
            retried.uid === test.uid || (retried.fullTitle !== undefined && retried.fullTitle === test.fullTitle)
        ))
    }

    /** the start of the next attempt after a retry */
    nextAttempt () {
        this.attempt++
        this.attemptState.clear()
        this.retriedTest = undefined
    }
}
