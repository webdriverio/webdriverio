import type HookStats from './hook.js'
import RunnableStats from './runnable.js'
import type TestStats from './test.js'
import type { Tag } from '../types.js'

export interface Suite {
    type?: string
    title: string
    parent?: string
    /** `null` marks a top-level suite (child of the reporter root); `undefined` falls back to the open-suite stack */
    parentUid?: string | null
    /** the browsing context of a parallel Cucumber scenario */
    contextId?: string
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
    retries?: number
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
    retries = 0
    /**
     * an array of hooks and tests stored in order as they happen
     */
    hooksAndTests: (HookStats | TestStats)[] = []
    description?: string
    rule?: string
    // `declare`: no own property when the payload has no value, so these stats stay the same
    /** the uid of the parent suite (`null` for a top-level suite) */
    declare parentUid?: string | null
    /** the browsing context of a parallel Cucumber scenario */
    declare contextId?: string

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
        this.keepParallelFields(suite)
    }

    /**
     * Mark suite as retried and remove previous history.
     */
    retry () {
        this.retries++
        this.tests = []
        this.hooks = []
        this.hooksAndTests = []
    }
}
