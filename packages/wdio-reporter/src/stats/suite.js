import RunnableStats from './runnable'

/**
 * Class describing statistics about a single suite.
 */
export default class SuiteStats extends RunnableStats {
    constructor (runner) {
        super('suite')
        this.uid = RunnableStats.getIdentifier(runner)
        this.title = runner.title
        this.tests = {}
        this.hooks = {}
    }
}
