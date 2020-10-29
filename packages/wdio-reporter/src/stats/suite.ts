import HookStats from './hook'
import RunnableStats from './runnable'
import TestStats from './test'

export interface Suite {
    type?: string
    title: string
    parent?: string
    fullTitle: string
    pending?: boolean
    fil?: string
    duration?: number
    cid?: string
    specs?: string[]
    uid?: string
    tags?: string[]
    description?: string
}

/**
 * Class describing statistics about a single suite.
 */
export default class SuiteStats extends RunnableStats {
    uid: string
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
