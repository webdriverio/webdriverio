import RunnableStats from './runnable'

/**
 * Class describing statistics about a single suite.
 */
export default class SuiteStats extends RunnableStats {
    constructor (suite) {
        super('suite')
        this.uid = RunnableStats.getIdentifier(suite)
        this.cid = suite.cid
        this.title = suite.title
        this.fullTitle = suite.fullTitle
        this.tests = []
        this.hooks = []
        this.suites = []
    }
}
