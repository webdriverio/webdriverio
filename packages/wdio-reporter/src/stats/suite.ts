import HookStats from './hook'
import RunnableStats, { Runnable } from './runnable'
import TestStats from './test'

export interface Suite extends Runnable {
    type?: string
    cid?: string
    title: string
    fullTitle: string
    tags?: string[]
    tests?: TestStats[]
    hooks?: HookStats[]
    suites?: SuiteStats[]
    hooksAndTests?: (HookStats | TestStats)[]
    description?: string | undefined
}

/**
 * Class describing statistics about a single suite.
 */
export default class SuiteStats extends RunnableStats {
    cid?: string
    title: string
    fullTitle: string
    tags?: string[]
    tests: TestStats[] = []
    hooks: HookStats[] = []
    suites: SuiteStats[] = []
    /**
     * an array of hooks and tests stored in order as they happen
     */
    hooksAndTests: (HookStats | TestStats)[] = []
    description?: string

    constructor (suite: Suite) {
        super(suite.type || 'suite')
        this.uid = RunnableStats.getIdentifier(suite)
        this.cid = suite.cid
        this.title = suite.title
        this.fullTitle = suite.fullTitle
        this.tags = suite.tags
        /**
         * only Cucumber
         */
        this.description = suite.description
    }
}
