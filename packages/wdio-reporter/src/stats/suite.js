import RunnableStats from './runnable'

/**
 * Class describing statistics about a single suite.
 */
export default class SuiteStats extends RunnableStats {
    constructor (suite) {
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
