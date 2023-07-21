import type HookStats from './hook.js'
import RunnableStats from './runnable.js'
import type TestStats from './test.js'
import type { Tag } from '../types.js'

export interface Suite {
    type?: string
    title: string
    parent?: string
    fullTitle: string
    pending?: boolean
    file: string
    duration?: number
    cid?: string
    specs?: string[]
    uid?: string
    tags?: string[] | Tag[]
    description?: string
    rule?: string
}

/**
 * Class describing statistics about a single suite.
 */
export default class SuiteStats extends RunnableStats {
    uid: string
    cid?: string
    file: string
    title: string
    fullTitle: string
    tags?: string[] | Tag[]
    tests: TestStats[] = []
    hooks: HookStats[] = []
    suites: SuiteStats[] = []
    parent?: string
    /**
     * an array of hooks and tests stored in order as they happen
     */
    hooksAndTests: (HookStats | TestStats)[] = []
    description?: string
    rule?: string

    constructor (suite: Suite) {
        super(suite.type || 'suite')
        this.uid = RunnableStats.getIdentifier(suite)
        this.cid = suite.cid
        this.file = suite.file
        this.title = suite.title
        this.fullTitle = suite.fullTitle
        this.tags = suite.tags
        this.parent= suite.parent
        /**
         * only Cucumber
         */
        this.description = suite.description
        this.rule = suite.rule
    }
}
