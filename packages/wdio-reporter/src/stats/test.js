import RunnableStats from './runnable'

/**
 * TestStats class
 * captures data on a test.
 */
export default class TestStats extends RunnableStats {
    constructor (runner) {
        super('test')
        this.uid = RunnableStats.getIdentifier(runner)
        this.cid = runner.cid
        this.title = runner.title
        this.fullTItle = runner.fullTItle

        /**
         * initial test state is pending
         * the state can change to the following: passed, skipped, failed
         */
        this.state = 'pending'
    }

    pass () {
        this.complete()
        this.state = 'passed'
    }

    skip () {
        this.state = 'skipped'
    }

    fail (error) {
        this.complete()
        this.state = 'failed'
        this.error = error
    }
}
