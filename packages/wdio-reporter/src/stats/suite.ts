import RunnableStats from './runnable'

/**
 * Class describing statistics about a single suite.
 */
export default class SuiteStats extends RunnableStats {
    uid: string
    cid: string
    title: string
    fullTitle: string
    tags: any
    tests: never[]

    hooks: never[]
    suites: never[]
    hooksAndTests: never[]
    description: any
    constructor(suite: { title: string; fullTitle: string; type?: any; cid?: any; tags?: any; description?: any; uid?: any }) {
        super(suite.type || 'suite')
        this.uid = RunnableStats.getIdentifier(suite)
        this.cid = suite.cid
        this.title = suite.title
        this.fullTitle = suite.fullTitle
        this.tags = suite.tags
        this.tests = []
        this.hooks = []
        this.suites = []
        /**
         * an array of hooks and tests stored in order as they happen
         */
        this.hooksAndTests = []

        /**
         * only Cucumber
         */
        this.description = suite.description

    }
}
