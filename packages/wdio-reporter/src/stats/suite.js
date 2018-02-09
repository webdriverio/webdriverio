import RunnableStats from './runnable'

/**
 * Class describing statistics about a single suite.
 */
export default class SuiteStats extends RunnableStats {
    constructor (runner) {
        super('suite')
        this.uid = RunnableStats.getIdentifier(runner)
        this.cid = runner.cid
        this.title = runner.title
        this.fullTitle = runner.fullTitle
        this.tests = []
        this.hooks = []
        this.suites = []
    }
}
